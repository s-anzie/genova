import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        birthDate: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        preferredLanguage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/notification-preferences
 * Get notification preferences for the authenticated user
 */
router.get('/notification-preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // For now, return default preferences
    // TODO: Implement notification preferences in database
    const preferences = {
      email: true,
      push: true,
      sms: false,
      sessionReminders: true,
      sessionUpdates: true,
      paymentNotifications: true,
      marketingEmails: false,
    };

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/notification-preferences
 * Update notification preferences for the authenticated user
 */
router.put('/notification-preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // For now, just return the updated preferences
    // TODO: Implement notification preferences in database
    const preferences = req.body;

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
