import { AppError } from './AppError';

/**
 * Payment error for payment processing failures
 */
export class PaymentError extends AppError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 'PAYMENT_ERROR', 402, details, undefined, requestId);
  }
}
