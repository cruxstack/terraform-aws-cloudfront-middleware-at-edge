import { serialize as cookieSerialize } from 'cookie';
import { logger } from '../commons/logger';
import { encodeBase64 } from '../commons/utils';
import { BaseAuth } from './bases/base-auth';
import type { RequestOptions } from 'https';
import type { CloudFrontRequest, CloudFrontRequestResult } from 'aws-lambda';
import type { IAuthOptions } from './bases/base-auth';

export interface AppCognitoPkceData {
  pkceCodeVerifier: string;
  pkceCodeChallenge: string;
}

export interface IParseAuthOptions extends IAuthOptions { }

export class ParseAuthService extends BaseAuth {
  constructor(opt: IParseAuthOptions) {
    super(opt);
    logger.debug('parse-auth service initalized');
  }

  public readonly handle = async (event: CloudFrontRequest): Promise<CloudFrontRequestResult> => {
    const request = this._parseRequest(event);

    // if code is missing, request didn't come from cognito so send to login
    if (typeof request.querystring.code !== 'string')
      return this._respondWithLoginRedirect({ request });

    const state = await this._decryptState(String(request.querystring.state || ''));
    const userTokens = await this._sendCognitoTokenRequest(request.host, request.querystring.code, state as AppCognitoPkceData);
    const cognitoAmplifyCookies = await this._generateCognitoAmplifyCookies(userTokens);

    return this._respondWithRedirect({
      response: {
        location: state.redirectedFromUrl,
        cookies: cognitoAmplifyCookies,
      },
      request,
    });
  };

  private readonly _generateCognitoAmplifyCookies = async (tokenData: Record<string, any>) => {
    const idTokenData = await this._decoder.decodeIdToken(tokenData.id_token);
    const cognitoUserId = idTokenData['cognito:username'];
    const cognitoCookieKeyPrefix = `CognitoIdentityServiceProvider.${this._config.cognitoIdpClientId}`;
    const cognitoCookieUserKeyPrefix = `${cognitoCookieKeyPrefix}.${cognitoUserId}`;
    return [
      cookieSerialize('amplify-signin-with-hostedUI', 'true', {
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
      cookieSerialize(`${cognitoCookieKeyPrefix}.LastAuthUser`, cognitoUserId, {
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
      cookieSerialize(`${cognitoCookieUserKeyPrefix}.accessToken`, tokenData.access_token, {
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
      cookieSerialize(`${cognitoCookieUserKeyPrefix}.idToken`, tokenData.id_token, {
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
      cookieSerialize(`${cognitoCookieUserKeyPrefix}.refreshToken`, tokenData.refresh_token, {
        path: '/',
        secure: true,
        sameSite: 'lax',
      }),
      cookieSerialize(`${cognitoCookieUserKeyPrefix}.tokenScopesString`, this._config.cognitoIdpClientScopes.join(' '), {
        path: '/',
        sameSite: 'lax',
        secure: true,
      }),
    ];
  };

  private readonly _sendCognitoTokenRequest = async (domain: string, code: string, pkceData: AppCognitoPkceData) => {
    const url = `https://${this._config.cognitoIdpDomain}/oauth2/token`;
    const requestConfig: RequestOptions = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodeBase64(`${this._config.cognitoIdpClientId}:${this._config.cognitoIdpClientSecret}`)}`,
      },
    };
    const data = {
      grant_type: 'authorization_code',
      client_id: this._config.cognitoIdpClientId,
      redirect_uri: `https://${domain}${this._config.redirectPathAuthSignIn}`,
      code,
      code_verifier: pkceData.pkceCodeVerifier,
    };

    const response = await this._sendCognitoRequestWithRetry(url, data, requestConfig);
    return response.data;
  };
}
