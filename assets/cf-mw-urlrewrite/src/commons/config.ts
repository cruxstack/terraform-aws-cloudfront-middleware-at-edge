import { Level as LogLevel } from 'pino';
import { AppError, AppErrorName } from './errors';
import { logger } from './logger';
import { readFile } from './utils';

export interface AppEnvironmentVariables extends NodeJS.ProcessEnv {
  AWS_LAMBDA_FUNCTION_MEMORY_SIZE?: string,
  AWS_LAMBDA_FUNCTION_NAME?: string,
  AWS_REGION?: string,
  AWS_EXECUTION_ENV?: string,
  AWS_LAMBDA_FUNCTION_VERSION?: string,
  LOG_LEVEL?: string,
  POLICY_PATH?: string,
}

export interface AppServiceConfig {
  awsRegion?: string;
  logEnabled?: boolean;
  logLevel?: LogLevel;
}

export enum AppConfigSource {
  FILE,
  STATIC,
}

export enum AppConfigState {
  READY,
  NOT_READY,
}

export class AppConfig implements AppServiceConfig {
  private _configuration: AppServiceConfig;

  private _state: AppConfigState = AppConfigState.NOT_READY;

  constructor() {
    this._configuration = {} as AppServiceConfig;
  }

  public get state() {
    return this._state;
  }

  public get awsRegion() {
    return this._configuration.awsRegion || process.env.AWS_REGION || 'us-east-1';
  }

  public get logEnabled() {
    return this._configuration.logEnabled || true;
  }

  public get logLevel() {
    return this._configuration.logLevel || 'info';
  }

  public readonly update = async (sourceType: AppConfigSource, source: string | AppServiceConfig) => {
    let configuration: AppServiceConfig;
    if (sourceType === AppConfigSource.FILE && typeof source === 'string')
      configuration = JSON.parse((await readFile(source)).toString('utf8'));
    else if (sourceType === AppConfigSource.STATIC && typeof source !== 'string')
      configuration = source;
    else
      throw new AppError('unknown configuration source', AppErrorName.INVALID_CONFIG);

    this._configuration = configuration;
    logger.configure(this._configuration);

    this._state = AppConfigState.READY;
    logger.debug({ config: this._configuration }, 'app config updated');
  };
}
