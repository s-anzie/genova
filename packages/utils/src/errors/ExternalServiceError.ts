import { AppError } from './AppError';

/**
 * External service error for third-party API failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service unavailable',
    details?: any,
    requestId?: string
  ) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 503, details, undefined, requestId);
  }
}
