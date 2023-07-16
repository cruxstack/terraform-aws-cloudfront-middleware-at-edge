import { CloudFrontRequestResult, CloudFrontResultResponse } from 'aws-lambda';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { AppAuthServiceConfig, AppConfig, AppConfigSource } from '../commons/config';
import { decodeBase64, encodeBase64 } from '../commons/utils';
import { ICrypter } from '../crypto/types';
import { ParseAuthService } from './parse-auth';
import { fixtures } from '../fixtures';

describe('ParseAuthService', () => {
  let mAppAuthServiceConfig: AppAuthServiceConfig;
  let mCookieTokens: { access: string, id: string, refresh: string };
  let mUserId: string;

  beforeEach(() => {
    mCookieTokens = fixtures.mockCookieTokens;

    mUserId = fixtures.mockUserId;

    mAppAuthServiceConfig = fixtures.mockAppAuthServiceConfig;
  });

  it('should redirect if authorization code and state inputs are valid', async () => {
    const config = new AppConfig();
    let error: unknown;
    let request = {
      'clientIp': '127.0.0.1',
      'headers': {
        'host': [{
          'key': 'Host',
          'value': 'example.com',
        }],
      },
      'method': 'GET',
      'querystring': 'code=eddf2e65-a755-44d1-9a8b-e1f15f7c6c4e&state=eyJyZWRpcmVjdGVkRnJvbVVybCI6Imh0dHBzOi8vZXhhbXBsZS5jb20vZm9vIn0K',
      'uri': '/_edge/auth/signin',
    };
    let response: CloudFrontRequestResult;
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
      hash: jest.fn().mockImplementation((data) => '1234567890123456'),
      generate: jest.fn().mockImplementation(() => '1234567890123456'),
    } as ICrypter;
    const decoder = {
      verify: jest.fn().mockResolvedValue({}),
      decodeIdToken: jest.fn().mockResolvedValue({
        'cognito:username': mUserId,
      }),
    } as any;

    const mockAxios = new AxiosMockAdapter(axios);
    mockAxios.onPost('https://test.auth.us-east-1.amazoncognito.com/oauth2/token').reply(200, {
      'access_token': mCookieTokens.access,
      'id_token': mCookieTokens.id,
      'refresh_token': mCookieTokens.refresh,
    }, { 'content-type': 'application/json' });

    try {
      await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
      const service = new ParseAuthService({ config, crypter, decoder });
      response = await service.handle(request);
    } catch (err: unknown) {
      error = err;
    }

    expect.hasAssertions();
    expect(error).toBeUndefined();
    expect((response as CloudFrontResultResponse)?.status).toBe('307');
    expect((response as CloudFrontResultResponse)?.headers?.location?.[0]).toStrictEqual({ 'key': 'location', 'value': 'https://example.com/foo' });
    expect((response as CloudFrontResultResponse)?.headers?.['set-cookie']).toContainEqual({
      'key': 'set-cookie', 'value': `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.LastAuthUser=${mUserId}; Path=/; Secure; SameSite=Lax`,
    });
    expect((response as CloudFrontResultResponse)?.headers?.['set-cookie']).toContainEqual({
      'key': 'set-cookie', 'value': `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.accessToken=${mCookieTokens.access}; Path=/; Secure; SameSite=Lax`,
    });
    expect((response as CloudFrontResultResponse)?.headers?.['set-cookie']).toContainEqual({
      'key': 'set-cookie', 'value': `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.idToken=${mCookieTokens.id}; Path=/; Secure; SameSite=Lax`,
    });
    expect((response as CloudFrontResultResponse)?.headers?.['set-cookie']).toContainEqual({
      'key': 'set-cookie', 'value': `CognitoIdentityServiceProvider.${mAppAuthServiceConfig.cognitoIdpClientId}.${mUserId}.refreshToken=${mCookieTokens.refresh}; Path=/; Secure; SameSite=Lax`,
    });
  });

  it('should redirect if authorization code and state inputs are valid', async () => {
    const config = new AppConfig();
    let error: unknown;
    let request = {
      'clientIp': '127.0.0.1',
      'headers': {
        'host': [{
          'key': 'Host',
          'value': 'example.com',
        }],
      },
      'method': 'GET',
      'querystring': '',
      'uri': '/_edge/auth/signin',
    };
    let response: CloudFrontRequestResult;
    const crypter = {
      encrypt: jest.fn().mockImplementation((data) => encodeBase64(data)),
      decrypt: jest.fn().mockImplementation((data) => decodeBase64(data)),
      hash: jest.fn().mockImplementation((data) => '1234567890123456'),
      generate: jest.fn().mockImplementation(() => '1234567890123456'),
    } as ICrypter;
    const decoder = {
      verify: jest.fn().mockResolvedValue({}),
      decodeIdToken: jest.fn().mockResolvedValue({
        'cognito:username': mUserId,
      }),
    } as any;

    const mockAxios = new AxiosMockAdapter(axios);
    mockAxios.onPost('https://test.auth.us-east-1.amazoncognito.com/oauth2/token').reply(403, {
    }, { 'content-type': 'application/json' });

    try {
      await config.update(AppConfigSource.STATIC, mAppAuthServiceConfig);
      const service = new ParseAuthService({ config, crypter, decoder });
      response = await service.handle(request);
    } catch (err: unknown) {
      error = err;
    }

    expect.hasAssertions();
    expect(error).toBeUndefined();
    expect(response).toStrictEqual({
      status: '307',
      statusDescription: 'Temporary Redirect',
      headers: {
        location: [{
          key: 'location',
          value: `https://${mAppAuthServiceConfig.cognitoIdpDomain}/oauth2/authorize?client_id=${mAppAuthServiceConfig.cognitoIdpClientId}&redirect_uri=https%3A%2F%2Fexample.com%2F_edge%2Fauth%2Fsignin&response_type=code&scope=phone%20email%20profile%20openid&state=eyJyZWRpcmVjdGVkRnJvbVVybCI6Ii8iLCJwa2NlQ29kZVZlcmlmaWVyIjoiMTIzNDU2Nzg5MDEyMzQ1NiIsInBrY2VDb2RlQ2hhbGxlbmdlIjoiMTIzNDU2Nzg5MDEyMzQ1NiJ9&code_challenge_method=S256&code_challenge=1234567890123456`,
        }],
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
