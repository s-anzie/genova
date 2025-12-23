import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllBadges,
  getBadgesByCategory,
  getBadgesWithStatus,
  getUserBadges,
  checkAllBadges,
  getLoyaltyPoints,
  getBadgeStatistics,
} from '../services/badge.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';
import { BadgeCategory } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/badges
 * Get all badges
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;

    let badges;
    if (category) {
      // Validate category
      if (!['STUDENT', 'TUTOR', 'BOTH'].includes(category as string)) {
        throw new ValidationError('Invalid badge category');
      }
      badges = await getBadgesByCategory(category as BadgeCategory);
    } else {
      badges = await getAllBadges();
    }

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/badges/with-status
 * Get all badges with earned status for the authenticated user
 */
router.get('/with-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const badges = await getBadgesWithStatus(req.user.userId);

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/badges/earned
 * Get earned badges for the authenticated user
 */
router.get('/earned', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const userBadges = await getUserBadges(req.user.userId);

    res.status(200).json({
      success: true,
      data: userBadges,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/badges/check
 * Check and award eligible badges for the authenticated user
 */
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await checkAllBadges(req.user.userId);

    // Get updated badge list
    const userBadges = await getUserBadges(req.user.userId);

    res.status(200).json({
      success: true,
      data: userBadges,
      message: 'Badge eligibility checked',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/badges/loyalty-points
 * Get loyalty points balance for the authenticated user
 */
router.get('/loyalty-points', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const points = await getLoyaltyPoints(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        loyaltyPoints: points,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/badges/statistics
 * Get badge statistics for the authenticated user
 */
router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const statistics = await getBadgeStatistics(req.user.userId);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
