import { CloudFrontRequest, CloudFrontRequestHandler, CloudFrontRequestResult } from 'aws-lambda';
import { Logger } from 'pino';
import { IAuthOptions } from '../services/bases/base-auth';

export type AppLogger = Logger;

export interface AppCookies extends Cookies {
  userId: string,
  userScopes: string,
  userTokenId: string,
  userTokenAccess: string,
  userTokenRefresh: string,
}

export interface AppRequestData {
  host: string;
  cookies: AppCookies;
  querystring: Record<string, string | string[] | undefined>;
  path: string;
}

export interface AppResponseData {
  location?: string;
  cookies?: string[]
  body?: string;
}

export interface AppResponseInput {
  request: AppRequestData;
  response?: AppResponseData;
}

export interface AppRequestStateData {
  redirectedFromUrl?: string | undefined;
  pkceCodeVerifier?: string | undefined;
  pkceCodeChallenge?: string | undefined;
}

export interface ICloudFrontRequestServiceConstructor {
  new(opts: IAuthOptions): ICloudFrontRequestService
}

export interface ICloudFrontRequestService {
  handle: (request: CloudFrontRequest) => Promise<CloudFrontRequestResult>
}

export type CloudFrontRequestHandlerInitializer = (serviceClass: ICloudFrontRequestServiceConstructor) => CloudFrontRequestHandler;

export type Cookies = {
  [key: string]: string | undefined
};

export interface HttpHeaders {
  [key: string]: string;
}
