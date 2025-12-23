import { AppError } from './AppError';

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, details?: any, requestId?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, details, undefined, requestId);
  }
}
