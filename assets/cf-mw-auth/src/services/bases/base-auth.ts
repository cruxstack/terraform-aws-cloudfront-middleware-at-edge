import axios from 'axios';
import { parse as cookieParse } from 'cookie';
import { Agent } from 'https';
import { parse as qsParse, stringify as qsStringify } from 'querystring';
import { AppConfig } from '../../commons/config';
import { AppError, AppErrorName } from '../../commons/errors';
import { AppJwtDecoderDecodedTokens, IJwtDecoder } from '../../commons/jwt-verifier';
import { logger } from '../../commons/logger';
import { parseUrlSafeBase64, sleep, stringifyUrlSafeBase64 } from '../../commons/utils';
import { AppCognitoPkceData } from '../parse-auth';
import { IOpaPolicy } from '../../opa/opa-policy';
import type { CloudFrontHeaders, CloudFrontRequest, CloudFrontRequestResult } from 'aws-lambda';
import type { AppCookies, AppRequestData, AppRequestStateData, AppResponseInput, Cookies, ICloudFrontRequestService } from '../../commons/types';
import type { ICrypter } from '../../crypto/types';
import type { RequestOptions } from 'https';

export interface IAuthOptions {
  config: AppConfig;
  crypter: ICrypter;
  decoder: IJwtDecoder;
  policy?: IOpaPolicy;
}

export interface IAuthPolicy<T = any, R = any> {
  evaluate: (input: T) => Promise<R[]>;
}

export interface AuthPolicyEvaluateInput {
  request: AppRequestData;
  tokens: AppJwtDecoderDecodedTokens;
}

export interface AuthPolicyEvaluateOutput {
  allowed: boolean;
  message?: string;
}

export abstract class BaseAuth implements ICloudFrontRequestService {
  protected readonly _config: AppConfig;

  protected readonly _crypter: ICrypter;

  protected readonly _decoder: IJwtDecoder;

  protected readonly _policy?: IAuthPolicy<AuthPolicyEvaluateInput, AuthPolicyEvaluateOutput>;

  private readonly _maxPkceCodeVerifierLength = 64;

  private readonly _maxAttempts = 5;

  constructor(opts: IAuthOptions) {
    this._config = opts.config;
    this._crypter = opts.crypter;
    this._decoder = opts.decoder;
    this._policy = opts.policy;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handle = async (request: CloudFrontRequest): Promise<CloudFrontRequestResult> => {
    throw new AppError('not yet implemented', AppErrorName.UNKNOWN);
  };

  protected readonly _decryptState = async (data: string): Promise<AppRequestStateData> => {
    try {
      const context = { clientId: this._config.cognitoIdpId }; // todo: use something that is unique to the user session
      const encryptedData = parseUrlSafeBase64(data);
      const serializedData = await this._crypter.decrypt(encryptedData, context);
      const state = JSON.parse(serializedData || '{}');
      logger.debug({ state }, 'decrypted state');
      return state;
    } catch (err: unknown) {
      logger.warn({ error: err, state: data }, 'failed to deserialize state');
      return {};
    }
  };

  protected readonly _encryptState = async (data: AppRequestStateData): Promise<string> => {
    const context = { clientId: this._config.cognitoIdpId }; // todo: use something that is unique to the user session
    const serializedData = JSON.stringify(data || {});
    const encryptedData = await this._crypter.encrypt(serializedData, context) || '';
    return stringifyUrlSafeBase64(encryptedData);
  };

  protected readonly _respondWithLoginRedirect = async (input: AppResponseInput) => {
    const redirectedFromUrl = input.request.path === this._config.redirectPathAuthSignIn
      ? '/'
      : `https://${input.request.host}${input.request.path}?${qsStringify(input.request.querystring)}`;
    const pkceData = this.__generatePkceData();
    const state: AppRequestStateData = {
      redirectedFromUrl: redirectedFromUrl.replace(/\?$/, ''), // strip trailing question mark if present
      pkceCodeVerifier: pkceData.pkceCodeVerifier,
      pkceCodeChallenge: pkceData.pkceCodeChallenge,
    };

    const qs = qsStringify({
      client_id: this._config.cognitoIdpClientId,
      redirect_uri: `https://${input.request.host}${this._config.redirectPathAuthSignIn}`,
      response_type: 'code',
      scope: this._config.cognitoIdpClientScopes.join(' '),
      state: await this._encryptState(state),
      code_challenge_method: 'S256',
      code_challenge: state.pkceCodeChallenge,
    });

    return {
      status: '307',
      statusDescription: 'Temporary Redirect',
      headers: {
        location: [
          {
            key: 'location',
            value: `https://${this._config.cognitoIdpDomain}/oauth2/authorize?${qs}`,
          },
        ],
      },
    };
  };

  protected readonly _respondWithRedirect = (input: AppResponseInput) => {
    return {
      status: '307',
      headers: {
        location: [{
          key: 'location',
          value: input.response?.location || '/',
        }],
        'set-cookie': input.response?.cookies?.map(x => ({ key: 'set-cookie', value: x })) || [],
        'cache-control': [{
          key: 'cache-control',
          value: 'no-cache',
        }],
      },
    };
  };

  protected readonly _respondWithUnauthorized = (input: AppResponseInput) => {
    return {
      status: '403',
      headers: {},
      body: input.response?.body ?? 'unauthorized',
    };
  };

  protected readonly _parseRequest = (request: CloudFrontRequest): AppRequestData => {
    return {
      host: request.headers?.host?.[0]?.value || '',
      cookies: this.__parseCookies(request.headers),
      querystring: qsParse(request.querystring || '') || {},
      path: request.uri || '/',
    };
  };


  protected readonly _sendCognitoRequestWithRetry = async (url: string, data: Record<string, any>, options: RequestOptions) => {
    let attempts = 0;
    while (true) {
      ++attempts;
      try {
        return await this._sendCognitoRequest(url, data, options);  // @ts-ignore
      } catch (err) {
        logger.debug({ error: err, attempt: attempts }, 'failed cognito request attempt');
        if (attempts >= this._maxAttempts)
          throw new AppError('failed cognito request', AppErrorName.COGNITO_ERROR);
        logger.debug('attempting request again after exponential backoff');
        await sleep(25 * (Math.pow(2, attempts) + Math.random() * attempts));
      }
    }
  };

  protected readonly _sendCognitoRequest = async (url: string, data: Record<string, any>, options: RequestOptions) => {
    const response = await axios(url, {
      httpsAgent: new Agent({ keepAlive: true }),
      headers: options.headers as Record<string, string>,
      method: options.method || 'POST',
      data: data,
    });
    logger.debug({ response }, 'cognito request response');

    if (!response.headers['content-type']?.startsWith('application/json'))
      throw new AppError(`cognito responsed incorrect content-type: ${response.headers['content-type']}`, AppErrorName.COGNITO_ERROR);

    return {
      status: response.status,
      headers: response.headers as Record<string, any>,
      data: (await response.data) as { [k: string]: any },
    };
  };

  protected readonly _readTokens = async (accessToken: string, idToken: string) => {
    let result: AppJwtDecoderDecodedTokens | undefined;
    try {
      result = await this._decoder.decode(accessToken, idToken);
    } catch {
      logger.debug({ accessToken, idToken }, 'failed to read tokens');
    }
    return result;
  };

  private readonly __getCookieNamesTemplate = (): AppCookies => {
    return Object.create({
      userId: '',
      userScopes: '',
      userTokenId: '',
      userTokenAccess: '',
      userTokenRefresh: '',
    });
  };

  private readonly __generatePkceData = (): AppCognitoPkceData => {
    const pkceCodeVerifier = this._crypter.generate(this._maxPkceCodeVerifierLength);
    const pkceCodeChallenge = stringifyUrlSafeBase64(this._crypter.hash(pkceCodeVerifier), true);
    return { pkceCodeVerifier, pkceCodeChallenge };
  };

  private readonly __parseCookies = (headers: CloudFrontHeaders): AppCookies => {
    const cookies = this.__getCookieNamesTemplate();
    const rawCookies = this.__parseCookiesFromHeaders(headers);
    const cognitoCookieKeyPrefix = `CognitoIdentityServiceProvider.${this._config.cognitoIdpClientId}`;

    cookies.userId = rawCookies[`${cognitoCookieKeyPrefix}.LastAuthUser`] || '';
    cookies.userScopes = rawCookies[`${cognitoCookieKeyPrefix}.${cookies.userId}.tokenScopesString`] || '';
    cookies.userTokenAccess = rawCookies[`${cognitoCookieKeyPrefix}.${cookies.userId}.accessToken`] || '';
    cookies.userTokenId = rawCookies[`${cognitoCookieKeyPrefix}.${cookies.userId}.idToken`] || '';
    cookies.userTokenRefresh = rawCookies[`${cognitoCookieKeyPrefix}.${cookies.userId}.refreshToken`] || '';

    return cookies;
  };

  private readonly __parseCookiesFromHeaders = (headers: CloudFrontHeaders): Cookies => {
    if (!headers.cookie)
      return {};

    return headers.cookie.reduce((obj, header) => Object.assign(obj, cookieParse(header.value)), {});
  };
}
