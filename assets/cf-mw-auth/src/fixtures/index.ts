import type { AppAuthServiceConfig } from '../commons/config';

export const mockUserId: string = '00000000-aaaa-bbbb-cccc-111111111111';

export const mockCookieTokens: { access: string, id: string, refresh: string } = Object.freeze({
  access: 'eyJraWQiOiJ3X0t2ZDZhTlhQaVFWajdFTEJscl8zTTFnMTc5NDFpMUE3VE04a004aVdRIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIwMDAwMDAwMC1hYWFhLWJiYmItY2NjYy0xMTExMTExMTExMTEiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9URVNUUE9PTCIsInZlcnNpb24iOjIsImNsaWVudF9pZCI6ImZha2VfY2xpZW50X2lkIiwib3JpZ2luX2p0aSI6IjAwMDAwMDAwLWFhYWEtYmJiYi1jY2NjLTExMTExMTExMTExMSIsImV2ZW50X2lkIjoiMDAwMDAwMDAtYWFhYS1iYmJiLWNjY2MtMTExMTExMTExMTExIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJwaG9uZSBvcGVuaWQgZW1haWwgcHJvZmlsZSIsImF1dGhfdGltZSI6MTY4OTQ2MTAwNiwiZXhwIjo0ODExNTI1MDA2LCJpYXQiOjE2ODk0NjEwMDYsImp0aSI6IjAwMDAwMDAwLWFhYWEtYmJiYi1jY2NjLTExMTExMTExMTExMSIsInVzZXJuYW1lIjoiMDAwMDAwMDAtYWFhYS1iYmJiLWNjY2MtMTExMTExMTExMTExIn0.2pxZqPYuWIVDEd1BgJN9SBFKob8k1l4LY9XypWR-XmtcjCQV31Yyz9iCpG4p0H51XlbO1akiazy7qtkTC5BSlK1Xnk0dA7UQDXuwfvF9S7HPYprWyLo2dtZJcMF7cYxCjUWbM450u2dKF2IWQ2vwfWL8BInwWDQK5BIPImcZZj8BTzWwyv48gk-UWZPjABwsQOFJo4fONt7PQUTr_T7tMEQrFKH_Xvz0WtvdhhSOLiU-aIrDxj7SAG6WTAAYgJCoqYzJtkTpLnA5PU7eai_uqFiNi2_Zhw1fGBQZW_Xi2nkplnYpIxg1IJNUYly0oL30d2c3GYBmclQ82ggD2sN3Qw',
  id: 'eyJraWQiOiJ3X0t2ZDZhTlhQaVFWajdFTEJscl8zTTFnMTc5NDFpMUE3VE04a004aVdRIiwiYWxnIjoiUlMyNTYifQ.eyJhdF9oYXNoIjoiYXRfaGFzaCIsInN1YiI6IjEyMzQ1Njc4OTAiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9URVNUUE9PTCIsIm9yaWdpbl9qdGkiOiIwMDAwMDAwMC1hYWFhLWJiYmItY2NjYy0xMTExMTExMTExMTEiLCJhdWQiOiJmYWtlX2NsaWVudF9pZCIsImV2ZW50X2lkIjoiMDAwMDAwMDAtYWFhYS1iYmJiLWNjY2MtMTExMTExMTExMTExIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2ODk0NjEwMDYsImV4cCI6NDgxMTUyNTAwNiwiaWF0IjoxNjg5NDYxMDA2LCJqdGkiOiIwMDAwMDAwMC1hYWFhLWJiYmItY2NjYy0xMTExMTExMTExMTEiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImNvZ25pdG86dXNlcm5hbWUiOiIwMDAwMDAwMC1hYWFhLWJiYmItY2NjYy0xMTExMTExMTExMTEifQ.vdLE8u6L9SGCzFHnQ2Rpm0Epix7zd-AZgcAMInJFOfNDzNDT--7ng8PRCh0CujpyFAct8caUwF2EoqMAaFTaf7miTMTnaxLhFMnYjHnXAJ0WeUtel9iWUpBF-iWf3h4RiZnIts0Uti3u5QJQ3JALOjEVDsGG6x80iRbyi46EDtx-KXHVl58mYtpGClHcOW2pEQ4ewmSrVTapRMoQSXH5u6xQo9iZnEEEFkBMNFbxvStLrHvYOhzsN0YXOwOT6Dbrmw6GCZbyIGL-J1WVxmNEk9s8aOWE3zTCdMYS1-R7h5-Oqm0u7RBVRjz0ZemXFZvER3BB5MHS5JXjhYXnMWDBCw',
  refresh: 'YF-_GjsKmVnFc-J0pi8ZBRO9TdtzycJlAKmk62kbtNU',
});

export const mockAppAuthServiceConfig: AppAuthServiceConfig = Object.freeze({
  logEnabled: false,
  logLevel: 'error',
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
});

export const fixtures = {
  mockAppAuthServiceConfig,
  mockCookieTokens,
  mockUserId,
};
