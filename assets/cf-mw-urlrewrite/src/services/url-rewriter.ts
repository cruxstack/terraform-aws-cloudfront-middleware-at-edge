import { CloudFrontRequest, CloudFrontRequestResult, CloudFrontResultResponse } from 'aws-lambda';
import { AppConfig } from '../commons/config';
import { logger } from '../commons/logger';
import { IAppService } from '../commons/types';

export interface IUrlRewriterPolicy<T = any, R = any> {
  evaluate: (input: T) => Promise<R>;
}

export interface UrlRewriterPolicyEvaluateInput {
  uri: string;
  uri_parts: string[];
  querystring: string;
}

export interface UrlRewriterPolicyEvaluateOutput {
  uri: string;
  querystring: string;
  action?: 'REDIRECT_301' | 'REDIRECT_302' | 'FORWARD';
}

export class UrlRewriter implements IAppService {
  protected readonly _config: AppConfig;

  protected readonly _policy: IUrlRewriterPolicy<UrlRewriterPolicyEvaluateInput, UrlRewriterPolicyEvaluateOutput[]>;

  constructor(config: AppConfig, policy: IUrlRewriterPolicy) {
    this._config = config;
    this._policy = policy;
  }

  public handle = async (request: CloudFrontRequest): Promise<CloudFrontRequestResult> => {
    const input: UrlRewriterPolicyEvaluateInput = {
      uri: request.uri,
      uri_parts: request.uri.split('/').filter((p) => p.length > 0),
      querystring: request.querystring,
    };

    try {
      const response = await this._policy.evaluate(input);
      const result = response[0];
      logger.debug({ response }, 'request evaluated against policy');

      if (!result)
        return request;
      else if (result.action === 'REDIRECT_301' || result.action === 'REDIRECT_302')
        return this._respondWithRedirect(result, request);
      else
        return this._respondWithUrlRewrite(result, request);
    } catch (err: unknown) {
      logger.error({ error: err }, 'error evaluating request against policy');
      return request;
    }
  };

  private _respondWithRedirect = (input: UrlRewriterPolicyEvaluateOutput, request: CloudFrontRequest) => {
    const querystring = input.querystring ? `?${input.querystring}` : '';
    return {
      status: input.action === 'REDIRECT_301' ? '301' : '302',
      headers: {
        location: [{
          key: 'location',
          value: `${input.uri || '/'}${querystring}`,
        }],
      },
    };
  };

  private _respondWithUrlRewrite = (input: UrlRewriterPolicyEvaluateOutput, request: CloudFrontRequest) => {
    request.uri = input.uri;
    request.querystring = input.querystring;
    return request;
  };
}
