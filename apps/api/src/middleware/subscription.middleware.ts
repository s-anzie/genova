import { Request, Response, NextFunction } from 'express';
import { hasFeatureAccess, canCreateClass } from '../services/subscription.service';
import { ValidationError } from '@repo/utils';

/**
 * Middleware to check if user has access to a specific feature
 */
export function requireFeature(feature: 'examBankAccess' | 'prioritySupport') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const userId = req.user.userId;
      const hasAccess = await hasFeatureAccess(userId, feature);

      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'FEATURE_ACCESS_DENIED',
            message: `This feature requires a subscription upgrade. Feature: ${feature}`,
            feature,
            timestamp: new Date().toISOString(),
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user can create a class
 */
export async function requireClassCreationAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const userId = req.user.userId;
    const canCreate = await canCreateClass(userId);

    if (!canCreate) {
      return res.status(403).json({
        error: {
          code: 'CLASS_LIMIT_REACHED',
          message: 'You have reached your class creation limit. Please upgrade your subscription to create more classes.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if subscription is active (not expired)
 */
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const userId = req.user.userId;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check if subscription is expired
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
      return res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your subscription has expired. Please renew to continue using premium features.',
          expiredAt: user.subscriptionExpiresAt.toISOString(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
