import { logger } from '../commons/logger';
import { BaseAuth } from './bases/base-auth';
import type { CloudFrontRequest, CloudFrontRequestResult } from 'aws-lambda';
import type { IAuthOptions } from './bases/base-auth';
import type { AppJwtDecoderDecodedTokens } from '../commons/jwt-verifier';
import type { AppRequestData } from '../commons/types';

export interface ICheckAuthOptions extends IAuthOptions { }

export class CheckAuthService extends BaseAuth {
  constructor(opts: ICheckAuthOptions) {
    super(opts);
    logger.debug('check-auth service initalized');
  }

  public readonly handle = async (event: CloudFrontRequest): Promise<CloudFrontRequestResult> => {
    const request = this._parseRequest(event);
    const cookies = request.cookies;

    const verifiedTokens = await this._readTokens(cookies.userTokenAccess, cookies.userTokenId);
    if (!verifiedTokens)
      return this._respondWithLoginRedirect({ request });

    const result = await this._checkAgainstPolicy(request, verifiedTokens);
    if (!result.allowed) {
      const response = { body: result.message };
      return this._respondWithUnauthorized({ request, response });
    }

    return event;
  };

  private readonly _checkAgainstPolicy = async (request: AppRequestData, tokens: AppJwtDecoderDecodedTokens) => {
    const response = {
      allowed: false,
      message: '',
    };

    if (!this._policy) {
      response.allowed = true;
      return response;
    }

    const result = (await this._policy.evaluate({ request, tokens }))[0];
    if (!result?.allowed)
      logger.info({ result }, 'failed policy check');

    response.allowed = result?.allowed ?? false;
    response.message = result?.message ?? 'unauthorized';
    return response;
  };
}
