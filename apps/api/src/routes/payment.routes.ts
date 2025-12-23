import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as paymentService from '../services/payment.service';
import { ValidationError } from '@repo/utils';

const router = Router();

/**
 * POST /api/payments/intent
 * Create a payment intent for a session
 */
router.post(
  '/intent',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, amount, description } = req.body;
      const payerId = req.user!.userId;

      if (!sessionId || !amount) {
        throw new ValidationError('Session ID and amount are required');
      }

      const result = await paymentService.createPaymentIntent({
        sessionId,
        payerId,
        amount: parseFloat(amount),
        description,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/confirm
 * Confirm a payment after successful Stripe processing
 */
router.post(
  '/confirm',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentIntentId, sessionId } = req.body;

      if (!paymentIntentId || !sessionId) {
        throw new ValidationError('Payment intent ID and session ID are required');
      }

      const transaction = await paymentService.confirmPayment({
        paymentIntentId,
        sessionId,
      });

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          amount: transaction.amount.toNumber(),
          platformFee: transaction.platformFee.toNumber(),
          netAmount: transaction.netAmount.toNumber(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/wallet
 * Get wallet balance for the authenticated user
 */
router.get(
  '/wallet',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const balance = await paymentService.getWalletBalance(userId);

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/history
 * Get transaction history for the authenticated user
 */
router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const transactions = await paymentService.getTransactionHistory(userId, limit);

      res.json({
        success: true,
        data: transactions.map((tx) => ({
          id: tx.id,
          sessionId: tx.sessionId,
          amount: tx.amount.toNumber(),
          platformFee: tx.platformFee.toNumber(),
          netAmount: tx.netAmount.toNumber(),
          status: tx.status,
          type: tx.transactionType,
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          session: tx.session,
          payer: tx.payer,
          payee: tx.payee,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/withdraw
 * Request a withdrawal (placeholder for future implementation)
 */
router.post(
  '/withdraw',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        throw new ValidationError('Valid withdrawal amount is required');
      }

      // Minimum withdrawal amount
      const MIN_WITHDRAWAL = 20;
      if (amount < MIN_WITHDRAWAL) {
        throw new ValidationError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL}`);
      }

      const balance = await paymentService.getWalletBalance(userId);

      if (balance.availableBalance < amount) {
        throw new ValidationError('Insufficient available balance');
      }

      // TODO: Implement actual withdrawal processing with Stripe Connect or bank transfer
      // For now, just debit the wallet
      await paymentService.debitWallet(userId, amount);

      res.json({
        success: true,
        message: 'Withdrawal request submitted',
        data: {
          amount,
          status: 'pending',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
