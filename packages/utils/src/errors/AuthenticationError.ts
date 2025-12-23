import { AppError } from './AppError';

/**
 * Authentication error for invalid credentials or expired tokens
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any, requestId?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, details, undefined, requestId);
  }
}
