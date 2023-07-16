import axios from 'axios';
import { AppAuthServiceConfig, AppConfig, AppConfigSource } from '../../commons/config';
import { AppError } from '../../commons/errors';
import { BaseAuth } from './base-auth';
import AxiosMockAdapter from 'axios-mock-adapter';
import { encodeBase64, decodeBase64 } from '../../commons/utils';

describe('BaseAuthService', () => {
  let mockAppAuthServiceConfig: AppAuthServiceConfig;

  beforeEach(() => {
    mockAppAuthServiceConfig = {
      logLevel: 'info',
      cognitoIdpArn: 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_TESTPOOL',
      cognitoIdpId: 'us-east-1_TESTPOOL',
      cognitoIdpDomain: 'test.auth.us-east-1.amazoncognito.com',
      cognitoIdpJwks: {
        keys: [
          {
            alg: 'RS256',
            e: 'AQAB',
            kid: 'ZKgb1NV5jU1UpB49YdWyRAYQ9j7sqIDWDAT/Igv16do=',
            kty: 'RSA',
            n: '15iW8rGLu7CN0Jr0VWFdLo383p0SxQshC771JuQJObRNspE7QxhSE4-IK2jld0ZdNSuCr3T-cSAGlD57uLMNQYjK27lPyuzidLrlUoooyI4cScRwIuVjPinuATWmgqi1R3-yET1iFGssjeTqxJvW_GXcjSg_NgTpwOUqAZqH4LG-oJqPnAw0fYK4-0lb35MTqQmIJVogaI79PvjQ58FzbhG0EHEzO2L7eMlTBavMZlwbycSSHIqnrNd5qJ-JZaiBGN3HpncT1QfXRPnJyt8meJvWY4Nw_cpNmAHlGNX3S_vs5G7IQN81rT7l2xW_18AMECS9Y6haysHIk98IosIMGQ',
            use: 'sig',
          },
          {
            alg: 'RS256',
            e: 'AQAB',
            kid: 'NEFxN84zi+HrjY/kTgOP0nAx0wO4kRliIQfdMdaEPlo=',
            kty: 'RSA',
            n: 'p_nTcrxlc1PCGpovgKlptgOX36-6wPcAlClOvYs9LzHZKb9hL-wuCejcgSJgfPfR_hJNEJbloe1GmqK7xXP7QBZ7-nheAQe6vCIucJ9-uxk1Xry--K-QbmgpiQx3t8We_XWT8Ye-5svT2RshHG-Xi03ZCRLMFPSKuMI38zUS99TOVsG-Kfw1WKm-5x58yeu_IsffJNdUHlGOOdTeZCAjUIWnb22HREdJlaf8k7nl461qkcwarLICbZR7tA6vYnioSBP7i3AeAVH8NXR_OxivcgtYcHZp2spZl42kdlJffh_aVnpfScKMY1jeTEhrD-Mk0sGm5sY61BrueMTaP3qv7Q',
            use: 'sig',
          },
        ],
      },
      cognitoIdpClientId: '5mutv98opfcqrkfgf8ub7nr327',
      cognitoIdpClientSecret: '1uqvqt9ebcip62ao8o574kkmmarl0cgvlmpn4ef2j6dn1m8gvj70',
      cognitoIdpClientScopes: [
        'phone',
        'email',
        'profile',
        'openid',
      ],
      oidcStateEncryptionKey: '12345678901234567890123456789012',
      redirectPathAuthRefresh: '/_edge/auth/refresh',
      redirectPathAuthSignIn: '/_edge/auth/signin',
      redirectPathAuthSignOut: '/',
      urlSignOut: '/_edge/auth/signout',
    };
  });

  it('should redirect to login if token verification fails', async () => {
    class TestAuthService extends BaseAuth { }
    const config = new AppConfig();
    const request = {
      headers: {
        host: [{ key: 'host', value: 'example.com' }],
      },
      uri: '/foo',
    } as any;
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
    } as any;
    const decoder = {
      verify: jest.fn().mockRejectedValue({}),
    } as any;

    await config.update(AppConfigSource.STATIC, mockAppAuthServiceConfig);
    const service = new TestAuthService({ config, crypter, decoder });
    let error: unknown;

    try {
      await service.handle(request);
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).errorName).toEqual('UNKNOWN');
  });

  it('should reattempt cognito request multiple times until successful response', async () => {
    class TestAuthService extends BaseAuth {
      public sendCognitoRequest = async (url: string, data: any, opts: any) => {
        return this._sendCognitoRequestWithRetry(url, data, opts);
      };
    }
    const config = new AppConfig();
    const mockAxios = new AxiosMockAdapter(axios);
    mockAxios
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .replyOnce(400, {}, { 'content-type': 'application/json' })
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .replyOnce(400, {}, { 'content-type': 'application/json' })
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .replyOnce(400, {}, { 'content-type': 'application/json' })
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .replyOnce(400, {}, { 'content-type': 'application/json' })
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .replyOnce(200, {}, { 'content-type': 'application/json' });
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
    } as any;
    const decoder = {
      verify: jest.fn().mockRejectedValue({}),
    } as any;

    await config.update(AppConfigSource.STATIC, mockAppAuthServiceConfig);
    const service = new TestAuthService({ config, crypter, decoder });
    let error: unknown;

    try {
      await service.sendCognitoRequest(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`, {}, { headers: {} });
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeUndefined();
  });

  it('should reattempt cognito request multiple times until it fails for too many attempts', async () => {
    class TestAuthService extends BaseAuth {
      public sendCognitoRequest = async (url: string, data: any, opts: any) => {
        return this._sendCognitoRequestWithRetry(url, data, opts);
      };
    }
    const config = new AppConfig();
    const mockAxios = new AxiosMockAdapter(axios);
    mockAxios
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .reply(200, {}, { 'content-type': 'text' });
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
    } as any;
    const decoder = {
      verify: jest.fn().mockRejectedValue({}),
    } as any;

    await config.update(AppConfigSource.STATIC, mockAppAuthServiceConfig);
    const service = new TestAuthService({ config, crypter, decoder });
    let error: unknown;

    try {
      await service.sendCognitoRequest(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`, {}, { headers: {} });
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
  });

  it('should fail if congito returns unexpect content-type', async () => {
    class TestAuthService extends BaseAuth {
      public sendCognitoRequest = async (url: string, data: any, opts: any) => {
        return this._sendCognitoRequestWithRetry(url, data, opts);
      };
    }
    const config = new AppConfig();
    const mockAxios = new AxiosMockAdapter(axios);
    mockAxios
      .onPost(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`)
      .reply(200, {}, { 'content-type': 'text' });
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
    } as any;
    const decoder = {
      verify: jest.fn().mockRejectedValue({}),
    } as any;

    await config.update(AppConfigSource.STATIC, mockAppAuthServiceConfig);
    const service = new TestAuthService({ config, crypter, decoder });
    let error: unknown;

    try {
      await service.sendCognitoRequest(`https://${mockAppAuthServiceConfig.cognitoIdpDomain}/oauth2/token`, {}, { headers: {} });
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
