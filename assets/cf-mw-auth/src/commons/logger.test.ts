import { AppLogger } from './logger';

describe('AppLogger class', () => {
  beforeEach(() => { });

  it('should proxy log fn commands to 3rd party logger', async () => {
    const libLoggerClient = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      trace: jest.fn(),
      debug: jest.fn(),
    };
    const libLogger = jest.fn().mockReturnValue(libLoggerClient);

    const logger = new AppLogger(libLogger);
    logger.debug('foobar');
    logger.error('foobar');
    logger.info('foobar');
    logger.trace('foobar');
    logger.warn('foobar');

    expect(libLoggerClient.debug).toBeCalledTimes(1);
    expect(libLoggerClient.error).toBeCalledTimes(1);
    expect(libLoggerClient.info).toBeCalledTimes(1);
    expect(libLoggerClient.trace).toBeCalledTimes(1);
    expect(libLoggerClient.warn).toBeCalledTimes(1);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
