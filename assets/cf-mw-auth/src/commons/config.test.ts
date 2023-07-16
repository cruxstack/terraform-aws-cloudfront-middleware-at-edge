import { AppAuthServiceConfig, AppConfig, AppConfigSource, AppConfigState, AppEnvironmentVariables } from './config';
import { AppError, AppErrorName } from './errors';

describe('AppConfig class', () => {
  let mockProcessEnv: AppEnvironmentVariables;

  let mockAppAuthServiceConfig: AppAuthServiceConfig;

  let mockUserPoolArn: string;

  beforeEach(() => {
    mockProcessEnv = {
      AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '1024MB',
      AWS_LAMBDA_FUNCTION_NAME: 'test',
      AWS_REGION: 'local',
      AWS_EXECUTION_ENV: 'nodejs16x',
      AWS_LAMBDA_FUNCTION_VERSION: '',
      LOG_LEVEL: 'debug',
    };

    mockUserPoolArn = 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_TESTPOOL';

    mockAppAuthServiceConfig = {
      awsRegion: 'us-east-1',
      logEnabled: true,
      logLevel: 'silent',
      cognitoIdpArn: 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_TESTPOOL',
      cognitoIdpId: 'us-east-1_TESTPOOL',
      cognitoIdpDomain: 'test.auth.us-east-1.amazoncognito.com',
      cognitoIdpJwks: {
        keys: [
          {
            alg: 'RS256',
            e: 'AQAB',
            kid: 'w_Kvd6aNXPiQVj7ELBlr_3M1g17941i1A7TM8kM8iWQ',
            kty: 'RSA',
            n: '5TWp7zqXouL6Sobv9HaFi3utY8NOHxeXbb4ToL--vJH5hK3kDoPtdq37Gc5O8eQlWBuBwbi7AjL-N0F1pvPQYM_bcCEaypheMj7BdD42yR-tlhacXPPMgYggRPW3ML1x4z8ge_pYBp-HccoljtWKP-tqe_XpJnhw3yxIm6oDvFMz9FZlnYvW2QESnujVNrR4pgzh1He3Ihv1uE3OmMoPrawsmUFo6o0_foqIF7cQL2ZJIc2T_fdwxG9aIpjY-KQ1lCSlFFVpfX1xTfDAnyAtZYDRPv5My4ku22Bm-xKwMj244VqizZeOyc4cDEe9BaywAtjSsMmgUyJlbHpeomT8-Q',
            use: 'sig',
          },
          {
            alg: 'RS256',
            e: 'AQAB',
            kid: 'ZKgb1NV5jU1UpB49YdWyRAYQ9j7sqIDWDAT/Igv16do=',
            kty: 'RSA',
            n: '15iW8rGLu7CN0Jr0VWFdLo383p0SxQshC771JuQJObRNspE7QxhSE4-IK2jld0ZdNSuCr3T-cSAGlD57uLMNQYjK27lPyuzidLrlUoooyI4cScRwIuVjPinuATWmgqi1R3-yET1iFGssjeTqxJvW_GXcjSg_NgTpwOUqAZqH4LG-oJqPnAw0fYK4-0lb35MTqQmIJVogaI79PvjQ58FzbhG0EHEzO2L7eMlTBavMZlwbycSSHIqnrNd5qJ-JZaiBGN3HpncT1QfXRPnJyt8meJvWY4Nw_cpNmAHlGNX3S_vs5G7IQN81rT7l2xW_18AMECS9Y6haysHIk98IosIMGQ',
            use: 'sig',
          },
        ],
      },
      cognitoIdpClientId: 'fake_client_id',
      cognitoIdpClientSecret: 'abc123',
      cognitoIdpClientScopes: [
        'phone',
        'email',
        'profile',
        'openid',
      ],
      oidcStateEncryptionKey: '12345678901234567890123456789012',
      opaPolicyEnabled: false,
      opaPolicyData: {},
      redirectPathAuthRefresh: '/_edge/auth/refresh',
      redirectPathAuthSignIn: '/_edge/auth/signin',
      redirectPathAuthSignOut: '/',
      urlSignOut: '/_edge/auth/signout',
    };
  });

  it('should completely load the configuration from disk', async () => {
    const config = new AppConfig();

    await config.update(AppConfigSource.FILE, `${__dirname}/fixtures/configuration.json`);

    expect(config.state).toStrictEqual(AppConfigState.READY);
    expect(config.awsRegion).toStrictEqual(mockAppAuthServiceConfig.awsRegion);
    expect(config.logEnabled).toStrictEqual(mockAppAuthServiceConfig.logEnabled);
    expect(config.logLevel).toStrictEqual(mockAppAuthServiceConfig.logLevel);
    expect(config.cognitoIdpDomain).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpDomain);
    expect(config.cognitoIdpJwks).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpJwks);
    expect(config.cognitoIdpClientId).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpClientId);
    expect(config.cognitoIdpClientSecret).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpClientSecret);
    expect(config.cognitoIdpClientScopes).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpClientScopes);
    expect(config.redirectPathAuthRefresh).toStrictEqual(mockAppAuthServiceConfig.redirectPathAuthRefresh);
    expect(config.redirectPathAuthSignIn).toStrictEqual(mockAppAuthServiceConfig.redirectPathAuthSignIn);
    expect(config.redirectPathAuthSignOut).toStrictEqual(mockAppAuthServiceConfig.redirectPathAuthSignOut);
    expect(config.oidcStateEncryptionKey).toStrictEqual(mockAppAuthServiceConfig.oidcStateEncryptionKey);
    expect(config.opaPolicyEnabled).toStrictEqual(mockAppAuthServiceConfig.opaPolicyEnabled);
    expect(config.opaPolicyData).toStrictEqual(mockAppAuthServiceConfig.opaPolicyData);
    expect(config.urlSignOut).toStrictEqual(mockAppAuthServiceConfig.urlSignOut);
    expect(config.cognitoIdpArn).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpArn);
    expect(config.cognitoIdpId).toStrictEqual(mockAppAuthServiceConfig.cognitoIdpId);
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
