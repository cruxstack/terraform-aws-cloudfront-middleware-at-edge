import { AppConfig, AppConfigSource, AppConfigState, AppEnvironmentVariables, AppServiceConfig } from './config';
import { AppError, AppErrorName } from './errors';

describe('AppConfig class', () => {
  let mockProcessEnv: AppEnvironmentVariables;

  let mockAppAuthServiceConfig: AppServiceConfig;

  beforeEach(() => {
    mockProcessEnv = {
      AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '1024MB',
      AWS_LAMBDA_FUNCTION_NAME: 'test',
      AWS_REGION: 'local',
      AWS_EXECUTION_ENV: 'nodejs16x',
      AWS_LAMBDA_FUNCTION_VERSION: '',
      LOG_LEVEL: 'debug',
    };

    mockAppAuthServiceConfig = {
      awsRegion: 'us-east-1',
      logEnabled: true,
      logLevel: 'info',
    };
  });

  it('should completely load the configuration from disk', async () => {
    const config = new AppConfig();

    await config.update(AppConfigSource.FILE, `${__dirname}/fixtures/configuration.json`);

    expect(config.state).toStrictEqual(AppConfigState.READY);
    expect(config.awsRegion).toStrictEqual(mockAppAuthServiceConfig.awsRegion);
    expect(config.logEnabled).toStrictEqual(mockAppAuthServiceConfig.logEnabled);
    expect(config.logLevel).toStrictEqual(mockAppAuthServiceConfig.logLevel);
  });

  it('should set the correct default values', async () => {
    const config = new AppConfig();
    delete mockAppAuthServiceConfig.awsRegion;
    delete mockAppAuthServiceConfig.logLevel;
    let error: unknown;

    try {
      await config.update(AppConfigSource.STATIC, mockAppAuthServiceConfig);
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(config.state).toStrictEqual(AppConfigState.READY);
    expect(config.awsRegion).toStrictEqual('us-east-1');
    expect(config.logLevel).toStrictEqual('info');
  });

  it('should error if unknown config source type is used', async () => {
    const config = new AppConfig();
    let error: unknown;

    try {
      await config.update('foobar' as any, '');
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).errorName).toStrictEqual(AppErrorName.INVALID_CONFIG);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
