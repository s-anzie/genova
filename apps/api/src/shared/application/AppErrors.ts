
import { AppError } from '@repo/utils';

export namespace AppErrors {
  export class UnexpectedError extends AppError {
    constructor(err: any) {
      // message, code, statusCode
      super('An unexpected error occurred.', 'INTERNAL_SERVER_ERROR', 500);
      console.error(`[AppError]: An unexpected error occurred`, err);
    }
  }
}
