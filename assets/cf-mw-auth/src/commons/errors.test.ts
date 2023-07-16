import { AppError, AppErrorName, AppInputError } from './errors';

describe('AppError class', () => {
  beforeEach(() => { });

  it('should be instance of AppError', async () => {
    const error = new AppError('fake error', AppErrorName.UNKNOWN);

    expect(error).toBeInstanceOf(AppError);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});

describe('AppInputError class', () => {
  beforeEach(() => { });

  it('should be instance of AppInputError', async () => {
    const error = new AppInputError('fake error', AppErrorName.UNKNOWN);

    expect(error).toBeInstanceOf(AppInputError);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
