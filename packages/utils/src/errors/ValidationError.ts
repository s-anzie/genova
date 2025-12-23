import { AppError } from './AppError';

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: any, requestId?: string) {
    super(message, 'VALIDATION_ERROR', 400, details, field, requestId);
  }
}
