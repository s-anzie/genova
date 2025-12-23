import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as subscriptionService from '../services/subscription.service';
import { ValidationError } from '@repo/utils';
import { SubscriptionType } from '@prisma/client';

const router = Router();

/**
 * GET /api/subscriptions/tiers
 * Get all available subscription tiers
 */
router.get(
  '/tiers',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tiers = subscriptionService.getAllSubscriptionTiers();

      res.json({
        success: true,
        data: tiers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/subscriptions/status
 * Get current subscription status for authenticated user
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const status = await subscriptionService.getSubscriptionStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/subscriptions/create
 * Create or upgrade subscription
 */
router.post(
  '/create',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { subscriptionType, paymentMethodId } = req.body;

      if (!subscriptionType) {
        throw new ValidationError('Subscription type is required');
      }

      // Validate subscription type
      if (!Object.values(SubscriptionType).includes(subscriptionType)) {
        throw new ValidationError('Invalid subscription type');
      }

      const result = await subscriptionService.createSubscription({
        userId,
        subscriptionType,
        paymentMethodId,
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
 * POST /api/subscriptions/confirm
 * Confirm subscription payment
 */
router.post(
  '/confirm',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { stripeSubscriptionId } = req.body;

      if (!stripeSubscriptionId) {
        throw new ValidationError('Stripe subscription ID is required');
      }

      const result = await subscriptionService.confirmSubscriptionPayment(
        userId,
        stripeSubscriptionId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/subscriptions/cancel
 * Cancel current subscription
 */
router.post(
  '/cancel',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await subscriptionService.cancelSubscription(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/subscriptions/features/:feature
 * Check if user has access to a specific feature
 */
router.get(
  '/features/:feature',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { feature } = req.params;

      const hasAccess = await subscriptionService.hasFeatureAccess(
        userId,
        feature as any
      );

      res.json({
        success: true,
        data: {
          feature,
          hasAccess,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/subscriptions/can-create-class
 * Check if user can create more classes
 */
router.get(
  '/can-create-class',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const canCreate = await subscriptionService.canCreateClass(userId);

      res.json({
        success: true,
        data: {
          canCreate,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/subscriptions/payment-failure
 * Handle subscription payment failure (webhook endpoint)
 */
router.post(
  '/payment-failure',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, reason } = req.body;

      if (!userId || !reason) {
        throw new ValidationError('User ID and reason are required');
      }

      const result = await subscriptionService.handleSubscriptionPaymentFailure(
        userId,
        reason
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/subscriptions/process-expired
 * Process expired subscriptions (admin/cron endpoint)
 */
router.post(
  '/process-expired',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Add admin authentication or API key validation
      const result = await subscriptionService.processExpiredSubscriptions();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
