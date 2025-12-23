import { AppError } from './AppError';

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any, requestId?: string) {
    super(message, 'AUTHORIZATION_ERROR', 403, details, undefined, requestId);
  }
}
