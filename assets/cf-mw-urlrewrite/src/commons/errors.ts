export enum AppErrorName {
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_INPUT = 'INVALID_INPUT',
  COGNITO_ERROR = 'COGNITO_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  public readonly errorName: AppErrorName;

  public constructor(message: string, errorName: AppErrorName) {
    super(message);
    this.errorName = errorName;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AppInputError extends AppError {
  public constructor(message: string, errorName: AppErrorName) {
    super(message, errorName);

    Object.setPrototypeOf(this, AppInputError.prototype);
  }
}
