import { AppError } from './AppError';

/**
 * Conflict error for duplicate resources or scheduling conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 'CONFLICT_ERROR', 409, details, undefined, requestId);
  }
}
