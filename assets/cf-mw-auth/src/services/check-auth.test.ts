import { CloudFrontRequest } from 'aws-lambda';
import { AppAuthServiceConfig, AppConfig, AppConfigSource } from '../commons/config';
import { IJwtDecoder } from '../commons/jwt-verifier';
import { decodeBase64, encodeBase64, readFile } from '../commons/utils';
import { ICrypter } from '../crypto/types';
import { IOpaPolicy, OpaPolicy } from '../opa/opa-policy';
import { CheckAuthService } from './check-auth';
import { fixtures } from '../fixtures';

describe('CheckAuthService', () => {
  let mAppAuthServiceConfig: AppAuthServiceConfig;
  let mCookieTokens: { access: string, id: string, refresh: string };
  let mUserId: string;
  let mCrypter: ICrypter;
  let mDecoder: IJwtDecoder;
  let mPolicy: IOpaPolicy;

  beforeEach(() => {
    mCookieTokens = fixtures.mockCookieTokens;

    mUserId = fixtures.mockUserId;

    mAppAuthServiceConfig = fixtures.mockAppAuthServiceConfig;

    mCrypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
      hash: jest.fn().mockImplementation(() => '1234567890123456'),
      generate: jest.fn().mockImplementation(() => '1234567890123456'),
    };

    mDecoder = {
      verify: jest.fn().mockResolvedValue({}),
      decode: jest.fn().mockResolvedValue({ accessToken: {}, idToken: {} }),
      decodeAccessToken: jest.fn().mockResolvedValue({}),
      decodeIdToken: jest.fn().mockResolvedValue({}),
    };

    mPolicy = {
      evaluate: jest.fn().mockResolvedValue({ allow: true }),
    };
  });

  it('should allow request to continue by returning the original request', async () => {
    const config = new AppConfig();
    const request = {
      headers: {
        cookie: [{
          key: 'cookie',
          value: [
            'amplify-signin-with-hostedUI=true',
            `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.LastAuthUser=${mUserId}`,
            `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.tokenScopesString=email openid phone profile`,
            `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.accessToken=${mCookieTokens.access}`,
            `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.idToken=${mCookieTokens.id}`,
            `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.refreshToken=${mCookieTokens.refresh}`,
          ].join('; '),
        }],
        host: [{ key: 'host', value: 'example.com' }],
      },
      uri: '/foo',
    } as any;

    await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
    const service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder });
    const result = await service.handle(request);

    expect(result).toEqual(request);
  });

  it('should redirect to login if token verification fails', async () => {
    const config = new AppConfig();
    const request = {
      headers: {
        cookie: [{
          key: 'cookie',
          value: '',
        }],
        host: [{ key: 'host', value: 'example.com' }],
      },
      uri: '/foo',
    } as any;
    mDecoder = Object.assign(mDecoder, {
      decode: jest.fn().mockRejectedValue({}),
    });

    await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
    const service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder });
    const response = await service.handle(request);

    expect(response).toStrictEqual({
      status: '307',
      statusDescription: 'Temporary Redirect',
      headers: {
        location: [{
          key: 'location',
          value: `https://${mAppAuthServiceConfig.cognitoIdpDomain}/oauth2/authorize?client_id=${mAppAuthServiceConfig.cognitoIdpClientId}&redirect_uri=https%3A%2F%2Fexample.com%2F_edge%2Fauth%2Fsignin&response_type=code&scope=phone%20email%20profile%20openid&state=eyJyZWRpcmVjdGVkRnJvbVVybCI6Imh0dHBzOi8vZXhhbXBsZS5jb20vZm9vIiwicGtjZUNvZGVWZXJpZmllciI6IjEyMzQ1Njc4OTAxMjM0NTYiLCJwa2NlQ29kZUNoYWxsZW5nZSI6IjEyMzQ1Njc4OTAxMjM0NTYifQ..&code_challenge_method=S256&code_challenge=1234567890123456`,
        }],
      },
    });
  });

  it('should return unauthorized when request if policy check return allowed', async () => {
    const config = new AppConfig();
    const request = {
      headers: {
        cookie: [{
          key: 'cookie',
          value: '',
        }],
        host: [{ key: 'host', value: 'example.com' }],
      },
      uri: '/foo',
    } as any;
    mDecoder = Object.assign(mDecoder, {
      decode: jest.fn().mockRejectedValue({}),
    });

    await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
    const service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder, policy: mPolicy });
    const response = await service.handle(request);

    expect(response).toStrictEqual({
      status: '307',
      statusDescription: 'Temporary Redirect',
      headers: {
        location: [{
          key: 'location',
          value: `https://${mAppAuthServiceConfig.cognitoIdpDomain}/oauth2/authorize?client_id=${mAppAuthServiceConfig.cognitoIdpClientId}&redirect_uri=https%3A%2F%2Fexample.com%2F_edge%2Fauth%2Fsignin&response_type=code&scope=phone%20email%20profile%20openid&state=eyJyZWRpcmVjdGVkRnJvbVVybCI6Imh0dHBzOi8vZXhhbXBsZS5jb20vZm9vIiwicGtjZUNvZGVWZXJpZmllciI6IjEyMzQ1Njc4OTAxMjM0NTYiLCJwa2NlQ29kZUNoYWxsZW5nZSI6IjEyMzQ1Njc4OTAxMjM0NTYifQ..&code_challenge_method=S256&code_challenge=1234567890123456`,
        }],
      },
    });
  });

  it('should return unauthorized when request if policy check return not allowed', async () => {
    const config = new AppConfig();
    const request = {
      headers: {
        cookie: [{
          key: 'cookie',
          value: '',
        }],
        host: [{ key: 'host', value: 'example.com' }],
      },
      uri: '/foo',
    } as any;

    mPolicy = Object.assign(mPolicy, {
      evaluate: jest.fn().mockResolvedValue({ allow: false, message: 'forced failure' }),
    });

    await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
    const service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder, policy: mPolicy });
    const response = await service.handle(request);

    expect(response).toStrictEqual({
      status: '403',
      headers: {},
      body: 'unauthorized',
    });
  });

  describe('advance policy', () => {
    let service: CheckAuthService;
    let request: CloudFrontRequest;
    let policy: OpaPolicy;
    let policyWasm: Buffer;

    beforeEach(async () => {
      policyWasm = await readFile(`${__dirname}/fixtures/advanced_policy.wasm`);

      mDecoder = {
        verify: jest.fn().mockResolvedValue({}),
        decode: jest.fn().mockResolvedValue({ accessToken: {}, idToken: { email: 'user@example.com' } }),
        decodeAccessToken: jest.fn().mockResolvedValue({}),
        decodeIdToken: jest.fn().mockResolvedValue({}),
      };

      request = {
        headers: {
          cookie: [{
            key: 'cookie',
            value: [
              'amplify-signin-with-hostedUI=true',
              `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.LastAuthUser=${mUserId}`,
              `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.tokenScopesString=email openid phone profile`,
              `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.accessToken=${mCookieTokens.access}`,
              `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.idToken=${mCookieTokens.id}`,
              `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.refreshToken=${mCookieTokens.refresh}`,
            ].join('; '),
          }],
          host: [{ key: 'host', value: 'example.com' }],
        },
        uri: '/foo',
      } as any;

    });

    it('should pass the auth policy check', async () => {
      policy = new OpaPolicy(policyWasm, { 'email_patterns': '@acme.com,@example.com,@foobar.com' });
      const config = new AppConfig();
      await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
      service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder, policy });

      const result = await service.handle(request);

      expect(result).toEqual(request);
    });

    it('should not pass the auth policy check', async () => {
      policy = new OpaPolicy(policyWasm, { 'email_patterns': '@acme.com,@foobar.com' });
      const config = new AppConfig();
      await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
      service = new CheckAuthService({ config, crypter: mCrypter, decoder: mDecoder, policy });

      const result = await service.handle(request);

      expect(result).toStrictEqual({ 'body': 'unauthorized access', 'headers': {}, 'status': '403' });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
