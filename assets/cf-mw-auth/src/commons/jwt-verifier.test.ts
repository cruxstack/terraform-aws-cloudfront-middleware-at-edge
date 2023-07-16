import { AppAuthServiceConfig } from './config';
import { AppError } from './errors';
import { AppJwtDecoder } from './jwt-verifier';

describe('AppJwtVerifier class', () => {
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

  it('should verify token via dependency inversion', async () => {
    const verifierClient = {
      verify: jest.fn().mockResolvedValue({}),
      cacheJwks: jest.fn(),
    } as any;

    const verifierCntr = {
      create: jest.fn().mockReturnValue(verifierClient),
    } as any;

    const decoder = new AppJwtDecoder(mockAppAuthServiceConfig as any, verifierCntr);
    await decoder.verify('', '');

    expect(verifierClient.verify).toBeCalledTimes(2);
  });

  it('should decode token via dependency inversion', async () => {
    const verifierClient = {
      verify: jest.fn().mockResolvedValue({}),
      cacheJwks: jest.fn(),
    } as any;
    const verifierCntr = {
      create: jest.fn().mockReturnValue(verifierClient),
    } as any;

    const decoder = new AppJwtDecoder(mockAppAuthServiceConfig as any, verifierCntr);
    const decodedTokens = await decoder.decode('', '');

    expect(verifierClient.verify).toBeCalledTimes(2);
    expect(decodedTokens).toStrictEqual({ accessToken: {}, idToken: {} });
  });

  it('should throw error if token is invalid', async () => {
    const verifierClient = {
      verify: jest.fn().mockRejectedValue(new Error('invalid token')),
      cacheJwks: jest.fn(),
    } as any;
    const verifierCntr = {
      create: jest.fn().mockReturnValue(verifierClient),
    } as any;
    let error: unknown;

    try {
      const decoder = new AppJwtDecoder(mockAppAuthServiceConfig as any, verifierCntr);
      await decoder.verify('', '');
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
