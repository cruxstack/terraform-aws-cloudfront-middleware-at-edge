#!/usr/bin/env node
const jose = require('node-jose');

NINITY_NINE_YEARS_IN_SECS = 60 * 60 * 24 * 365 * 99;

(async () => {
  try {
    const keystore = jose.JWK.createKeyStore();
    const key = await keystore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig',
    });
    const jwks = keystore.toJSON();

    const accessTokenPayload = {
      sub: '00000000-aaaa-bbbb-cccc-111111111111',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TESTPOOL',
      version: 2,
      client_id: 'fake_client_id',
      origin_jti: '00000000-aaaa-bbbb-cccc-111111111111',
      event_id: '00000000-aaaa-bbbb-cccc-111111111111',
      token_use: 'access',
      scope: 'phone openid email profile',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + NINITY_NINE_YEARS_IN_SECS,
      iat: Math.floor(Date.now() / 1000),
      jti: '00000000-aaaa-bbbb-cccc-111111111111',
      username: '00000000-aaaa-bbbb-cccc-111111111111',
    };

    const accessToken = await jose.JWS.createSign({ format: 'compact', fields: { kid: key.kid } }, key)
      .update(JSON.stringify(accessTokenPayload))
      .final();

    const idTokenPayload = {
      at_hash: 'at_hash',
      sub: '1234567890',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TESTPOOL',
      origin_jti: '00000000-aaaa-bbbb-cccc-111111111111',
      aud: 'fake_client_id',
      event_id: '00000000-aaaa-bbbb-cccc-111111111111',
      token_use: 'id',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + NINITY_NINE_YEARS_IN_SECS,
      iat: Math.floor(Date.now() / 1000),
      jti: '00000000-aaaa-bbbb-cccc-111111111111',
      email: "john.doe@example.com",
      email_verified: true,
      "cognito:username": "00000000-aaaa-bbbb-cccc-111111111111",
    };

    const idToken = await jose.JWS.createSign({ format: 'compact', fields: { kid: key.kid } }, key)
      .update(JSON.stringify(idTokenPayload))
      .final();

    const refreshToken = jose.util.base64url.encode(jose.util.randomBytes(32));

    console.log(JSON.stringify({
      jwks: [jwks.keys.find(k => k.kid === key.kid)],
      accessToken,
      idToken,
      refreshToken,
    }, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
