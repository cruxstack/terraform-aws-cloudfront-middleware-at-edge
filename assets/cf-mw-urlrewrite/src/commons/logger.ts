import { pino, Logger, LogFn } from 'pino';

export type LoggerLib = (...args: any[]) => Logger;

export type AppLoggerLogFn = LogFn;

export interface AppLoggerConfig {
  logLevel?: string,
  [k: string]: any,
}

export class AppLogger {
  private _lib: LoggerLib;

  private _logger: Logger;

  constructor(lib?: LoggerLib) {
    this._lib = lib || pino;
    this._logger = this._lib(AppLogger._buildConfiguration());
  }

  public configure = (config?: AppLoggerConfig): void => {
    const logConfig = AppLogger._buildConfiguration(config);
    this._logger = this._lib(logConfig);
  };

  public debug: AppLoggerLogFn = (arg: any, ...args: any[]) => {
    this._logger.debug(arg, ...args);
  };

  public info: AppLoggerLogFn = (arg: any, ...args: any[]) => {
    this._logger.info(arg, ...args);
  };

  public error: AppLoggerLogFn = (arg: any, ...args: any[]) => {
    this._logger.error(arg, ...args);
  };

  public trace: AppLoggerLogFn = (arg: any, ...args: any[]) => {
    this._logger.trace(arg, ...args);
  };

  public warn: AppLoggerLogFn = (arg: any, ...args: any[]) => {
    this._logger.warn(arg, ...args);
  };

  private static _buildConfiguration = (config?: AppLoggerConfig) => {
    return {
      enabled: config?.logEnabled || true,
      base: {
        memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        region: process.env.AWS_REGION,
        runtime: process.env.AWS_EXECUTION_ENV,
        version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
      },
      name: process.env.AWS_LAMBDA_FUNCTION_NAME,
      level: config?.logLevel || process.env.LOG_LEVEL || 'info',
      useLevelLabels: true,
    };
  };
}

export const logger = new AppLogger();
