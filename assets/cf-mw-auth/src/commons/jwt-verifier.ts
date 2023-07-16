import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppConfig } from './config';
import type { CognitoJwtVerifierSingleUserPool } from 'aws-jwt-verify/cognito-verifier';
import type { CognitoAccessTokenPayload, CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';

interface AppJwtDecoderOpts {
  userPoolId: string;
  clientId: string;
  tokenUse: 'id' | 'access';
}

interface AppJwtAccessDecoderOpts extends AppJwtDecoderOpts {
  tokenUse: 'access';
}

interface AppJwtIdDecoderOpts extends AppJwtDecoderOpts {
  tokenUse: 'id';
}

export interface AppJwtDecoderDecodedTokens {
  accessToken: CognitoAccessTokenPayload;
  idToken: CognitoIdTokenPayload;
}

export interface IJwtDecoder {
  decodeAccessToken(accessToken: string): Promise<Record<string, any>>;
  decodeIdToken(idToken: string): Promise<Record<string, any>>;
  decode(accessToken: string, idToken: string): Promise<AppJwtDecoderDecodedTokens>;
  verify(accessToken: string, idToken: string): Promise<void>;
}

export class AppJwtDecoder {
  private readonly _accessTokenDecoder: CognitoJwtVerifierSingleUserPool<AppJwtAccessDecoderOpts>;

  private readonly _idTokenDecoder: CognitoJwtVerifierSingleUserPool<AppJwtIdDecoderOpts>;

  constructor(config: AppConfig, veriferCnstr?: typeof CognitoJwtVerifier) {
    const Verifier = veriferCnstr || CognitoJwtVerifier;

    this._idTokenDecoder = Verifier.create({
      userPoolId: config.cognitoIdpId,
      clientId: config.cognitoIdpClientId,
      tokenUse: 'id',
    });

    this._accessTokenDecoder = Verifier.create({
      userPoolId: config.cognitoIdpId,
      clientId: config.cognitoIdpClientId,
      tokenUse: 'access',
      scope: config.cognitoIdpClientScopes,
    });

    this._idTokenDecoder.cacheJwks(config.cognitoIdpJwks);
  }

  public readonly verify = async (accessToken: string, idToken: string): Promise<void> => {
    await this.decode(accessToken, idToken);
  };

  public readonly decode = async (accessToken: string, idToken: string): Promise<AppJwtDecoderDecodedTokens> => {
    const decodeTokens = await Promise.all([
      this.decodeAccessToken(accessToken),
      this.decodeIdToken(idToken),
    ]);
    return {
      accessToken: decodeTokens[0],
      idToken: decodeTokens[1],
    };
  };

  public readonly decodeAccessToken = async (token: string) => {
    return this._accessTokenDecoder.verify(token);
  };

  public readonly decodeIdToken = async (token: string) => {
    return this._idTokenDecoder.verify(token);
  };
}

export { CognitoJwtInvalidGroupError, JwtExpiredError } from 'aws-jwt-verify/error';
