import { AppConfig, AppConfigSource, AppConfigState } from './commons/config';
import { AppError } from './commons/errors';
import { AppJwtDecoder } from './commons/jwt-verifier';
import { logger } from './commons/logger';
import { Crypter } from './crypto/crypter';
import { CheckAuthService } from './services/check-auth';
import { ParseAuthService } from './services/parse-auth';
import { OpaPolicy } from './opa/opa-policy';
import type { CloudFrontRequestEvent, CloudFrontRequestHandler } from 'aws-lambda';
import type { CloudFrontRequestHandlerInitializer, ICloudFrontRequestService, ICloudFrontRequestServiceConstructor } from './commons/types';

const APP_CONFIGURATION_PATH = `${__dirname}/configuration.json`;
const APP_OPA_POLICY_PATH = `${__dirname}/policy.wasm`;

const init: CloudFrontRequestHandlerInitializer = (svcConstructor: ICloudFrontRequestServiceConstructor) => {
  const config = new AppConfig();
  let service: ICloudFrontRequestService;

  return async (event: CloudFrontRequestEvent) => {
    if (config.state !== AppConfigState.READY) {
      await config.update(AppConfigSource.FILE, APP_CONFIGURATION_PATH);
      const crypter = new Crypter(config.oidcStateEncryptionKey);
      const decoder = new AppJwtDecoder(config);
      const policy = config.opaPolicyEnabled ? await OpaPolicy.fromWasmFile(APP_OPA_POLICY_PATH, config.opaPolicyData) : undefined;
      service = new svcConstructor({ config, crypter, decoder, policy });
    }

    logger.debug({ event }, 'lambda handler triggered');

    const request = event.Records[0]?.cf?.request;
    if (!request) {
      logger.error({ lambdaEvent: event }, 'unexpected event');
      return;
    }

    try {
      const response = await service.handle(request);
      logger.debug({ response }, 'response');
      return response;
    } catch (err: unknown) {
      logger.error({ event, error: err }, String(err));
      if (err instanceof AppError) {
        return {
          status: '500',
          statusDescription: 'Unknown Error',
        };
      }
      throw err;
    }
  };
};

export const checkAuthHandler: CloudFrontRequestHandler = init(CheckAuthService);

export const parseAuthHandler: CloudFrontRequestHandler = init(ParseAuthService);
