import { CloudFrontRequest, CloudFrontRequestHandler, CloudFrontRequestResult } from 'aws-lambda';
import { Logger } from 'pino';
import { IUrlRewriterPolicy } from '../services/url-rewriter';
import { AppConfig } from './config';

export type AppLogger = Logger;

export interface AppRequestData {
  host: string;
  querystring: Record<string, string | string[] | undefined>;
  path: string;
}

export interface IAppServiceConstructor {
  new(config: AppConfig, policy: IUrlRewriterPolicy): IAppService
}

export interface IAppService {
  handle: (request: CloudFrontRequest) => Promise<CloudFrontRequestResult>
}

export type AppServiceInitializer = (serviceClass: IAppServiceConstructor) => CloudFrontRequestHandler;

export interface HttpHeaders {
  [key: string]: string;
}
