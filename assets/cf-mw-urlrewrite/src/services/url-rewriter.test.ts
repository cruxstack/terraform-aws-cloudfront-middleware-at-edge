import { CloudFrontRequest, CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from 'aws-lambda';
import { AppConfig, AppConfigSource, AppServiceConfig } from '../commons/config';
import { clone, readFile } from '../commons/utils';
import { OpaPolicy } from '../opa/opa-policy';
import * as cfRequestEvents from './fixtures/cf-req-events';
import { UrlRewriter } from './url-rewriter';

const makeRequest = (base: CloudFrontRequestEvent, overrides: object): CloudFrontRequest => {
  const payload = clone(base);
  const request = payload?.Records?.[0]?.cf.request as CloudFrontRequest;
  Object.assign(request, overrides);
  return request;
};

describe('UrlRewriterService', () => {
  describe('test advance rewrite policy with complex rules', () => {
    let mockServiceConfig: AppServiceConfig;

    let urlRewriter: UrlRewriter;

    beforeEach(async () => {
      mockServiceConfig = {
        logLevel: 'info',
      };

      const config = new AppConfig();
      await config.update(AppConfigSource.STATIC, mockServiceConfig);

      const policyWasm = await readFile(`${__dirname}/fixtures/advanced_policy.wasm`);
      const policy = new OpaPolicy(policyWasm);
      urlRewriter = new UrlRewriter(config, policy);
    });

    it('should passthrough when path is a file with extension', async () => {
      const request = makeRequest(cfRequestEvents.authed, { uri: '/test.html' });
      const result = await urlRewriter.handle(request) as CloudFrontRequest;

      expect(result).not.toBeNull();
      expect(result.uri).toEqual('/test.html');
    });

    it('should redirect to path with trailing slash', async () => {
      const request = makeRequest(cfRequestEvents.authed, { uri: '/foo', querystring: 'foo=bar' });
      const result = await urlRewriter.handle(request) as CloudFrontResultResponse;

      expect(result != null);
      expect(result.status).toEqual('301');
      expect(result.headers?.location?.[0]?.value).toEqual('/foo/?foo=bar');
    });

    it('should append index.html to request', async () => {
      const request = makeRequest(cfRequestEvents.authed, { uri: '/foo/', querystring: 'foo=bar' });
      const result = await urlRewriter.handle(request) as CloudFrontRequest;

      expect(result != null);
      expect(result.uri).toEqual('/foo/index.html');
      expect(result.querystring).toEqual('foo=bar');
    });

    describe('/product path', () => {
      it('handle request with id in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/product/testing-foo-00000000-aaaa-bbbb-cccc-111111111111/', querystring: 'foo=bar' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/product/index.html');
        expect(result.querystring).toEqual('foo=bar&productId=00000000-aaaa-bbbb-cccc-111111111111');
      });

      it('handle rqeuest with id and serial in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/product/testing-foo-00000000-aaaa-bbbb-cccc-111111111111/123', querystring: 'foo=bar' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/product/index.html');
        expect(result.querystring).toEqual('foo=bar&productId=00000000-aaaa-bbbb-cccc-111111111111&productSerial=123');

      });
    });

    describe('/withdrawal path', () => {
      it('handle request without any params in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/withdrawal/' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/withdrawal/index.html');
        expect(result.querystring).toEqual('');
      });

      it('handle request with id in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/withdrawal/00000000-aaaa-bbbb-cccc-222222222222' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/product/index.html');
        expect(result.querystring).toEqual('productId=00000000-aaaa-bbbb-cccc-222222222222');
      });

      it('handle request with id and serial in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/withdrawal/00000000-aaaa-bbbb-cccc-222222222222/234' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/withdrawal/index.html');
        expect(result.querystring).toEqual('productId=00000000-aaaa-bbbb-cccc-222222222222&productSerial=234');
      });
    });

    describe('/drops path', () => {
      it('handle request without any params in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/drops/' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/drops/index.html');
        expect(result.querystring).toEqual('');
      });

      it('handle request with id in path', async () => {
        const request = makeRequest(cfRequestEvents.authed, { uri: '/drops/00000000-aaaa-bbbb-cccc-333333333333' });
        const result = await urlRewriter.handle(request) as CloudFrontRequest;

        expect(result != null);
        expect(result.uri).toEqual('/drops/index.html');
        expect(result.querystring).toEqual('dropId=00000000-aaaa-bbbb-cccc-333333333333');
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });
  });

});
