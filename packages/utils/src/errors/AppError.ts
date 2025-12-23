/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly field?: string;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any,
    field?: string,
    requestId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        field: this.field,
        timestamp: this.timestamp,
        requestId: this.requestId,
      },
    };
  }
}
