import { AppError, AppErrorName } from './errors';
import { logger } from './logger';
import { readFile } from './utils';
import type { LoggerLevel } from './logger';
import type { Jwks } from 'aws-jwt-verify/jwk';

export interface AppEnvironmentVariables extends NodeJS.ProcessEnv {
  AWS_LAMBDA_FUNCTION_MEMORY_SIZE?: string,
  AWS_LAMBDA_FUNCTION_NAME?: string,
  AWS_REGION?: string,
  AWS_EXECUTION_ENV?: string,
  AWS_LAMBDA_FUNCTION_VERSION?: string,
  LOG_LEVEL?: string,
}

export interface AppAuthServiceConfig {
  awsRegion?: string;
  logEnabled?: boolean;
  logLevel?: LoggerLevel;
  cognitoIdpClientId: string;
  cognitoIdpClientSecret: string;
  cognitoIdpClientScopes: string[];
  cognitoIdpArn: string;
  cognitoIdpId?: string;
  cognitoIdpDomain: string;
  cognitoIdpJwks: Jwks;
  redirectPathAuthRefresh: string;
  redirectPathAuthSignIn: string;
  redirectPathAuthSignOut: string;
  urlSignOut: string;
  oidcStateEncryptionKey: string;
  opaPolicyEnabled?: boolean;
  opaPolicyData?: Record<string, any>;
}

export enum AppConfigSource {
  FILE,
  STATIC,
}

export enum AppConfigState {
  READY,
  NOT_READY,
}

export class AppConfig implements AppAuthServiceConfig {
  private _configuration: AppAuthServiceConfig;

  private _state: AppConfigState = AppConfigState.NOT_READY;

  constructor() {
    this._configuration = {} as AppAuthServiceConfig;
  }

  public get state() {
    return this._state;
  }

  public get awsRegion() {
    return this._configuration.awsRegion || process.env.AWS_REGION || 'us-east-1';
  }

  public get logEnabled() {
    return this._configuration.logEnabled ?? true;
  }

  public get logLevel() {
    return this._configuration.logLevel ?? 'info';
  }

  public get cognitoIdpArn() {
    return this._configuration.cognitoIdpArn;
  }

  public get cognitoIdpId() {
    return this.cognitoIdpArn.split('/')[1] as string;
  }

  public get cognitoIdpDomain() {
    return this._configuration.cognitoIdpDomain;
  }

  public get cognitoIdpJwks() {
    return this._configuration.cognitoIdpJwks;
  }

  public get cognitoIdpClientId() {
    return this._configuration.cognitoIdpClientId;
  }

  public get cognitoIdpClientSecret() {
    return this._configuration.cognitoIdpClientSecret;
  }

  public get cognitoIdpClientScopes() {
    return this._configuration.cognitoIdpClientScopes;
  }

  public get oidcStateEncryptionKey() {
    return this._configuration.oidcStateEncryptionKey;
  }

  public get redirectPathAuthSignIn() {
    return this._configuration.redirectPathAuthSignIn;
  }

  public get redirectPathAuthSignOut() {
    return this._configuration.redirectPathAuthSignOut;
  }

  public get redirectPathAuthRefresh() {
    return this._configuration.redirectPathAuthRefresh;
  }

  public get opaPolicyEnabled() {
    return this._configuration.opaPolicyEnabled ?? false;
  }

  public get opaPolicyData() {
    return this._configuration.opaPolicyData;
  }

  public get urlSignOut() {
    return this._configuration.urlSignOut;
  }

  public readonly update = async (sourceType: AppConfigSource, source: string | AppAuthServiceConfig) => {
    let configuration: AppAuthServiceConfig;
    if (sourceType === AppConfigSource.FILE && typeof source === 'string')
      configuration = JSON.parse((await readFile(source)).toString('utf8'));
    else if (sourceType === AppConfigSource.STATIC && typeof source !== 'string')
      configuration = source;
    else
      throw new AppError('unknown configuration source', AppErrorName.INVALID_CONFIG);

    this._configuration = configuration;
    logger.configure(this._configuration);

    if (!this._configuration.oidcStateEncryptionKey)
      throw new AppError('required config is missing or empty: oidcStateEncryptionKey', AppErrorName.INVALID_CONFIG);

    this._state = AppConfigState.READY;
    logger.debug({ config: this._configuration }, 'app config updated');
  };
}
