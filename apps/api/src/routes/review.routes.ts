import { Router, Request, Response, NextFunction } from 'express';
import {
  createReview,
  getReviewById,
  getTutorReviews,
  getUserReviews,
  getSessionReviews,
  updateReview,
  deleteReview,
  flagReview,
  getTutorRatingStats,
  CreateReviewData,
} from '../services/review.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/reviews
 * Submit a review for a completed session
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId, rating, comment } = req.body;

    // Validate required fields
    if (!sessionId || rating === undefined) {
      throw new ValidationError('Session ID and rating are required');
    }

    const reviewData: CreateReviewData = {
      sessionId,
      rating: parseInt(rating),
      comment,
    };

    const result = await createReview(req.user.userId, reviewData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/:id
 * Get review details by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await getReviewById(id as string);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/reviews/:id
 * Update a review comment
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { comment } = req.body;

    if (comment === undefined) {
      throw new ValidationError('Comment is required');
    }

    const result = await updateReview(id as string, req.user.userId, comment);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Review updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    await deleteReview(id as string , req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews/:id/flag
 * Flag a review for moderation
 */
router.post('/:id/flag', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Flagging reason is required');
    }

    await flagReview(id as string, req.user.userId, reason);

    res.status(200).json({
      success: true,
      message: 'Review flagged for moderation',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/tutor/:tutorId
 * Get all reviews for a specific tutor
 */
router.get('/tutor/:tutorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate, includeOlderThan12Months } = req.query;

    const filters: any = {};
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }
    if (includeOlderThan12Months === 'true') {
      filters.includeOlderThan12Months = true;
    }

    const reviews = await getTutorReviews(tutorId as string, filters);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/tutor/:tutorId/stats
 * Get rating statistics for a tutor
 */
router.get('/tutor/:tutorId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tutorId } = req.params;

    const stats = await getTutorRatingStats(tutorId as string);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/user/my-reviews
 * Get all reviews submitted by the authenticated user
 */
router.get('/user/my-reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const reviews = await getUserReviews(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reviews/session/:sessionId
 * Get all reviews for a specific session
 */
router.get('/session/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const reviews = await getSessionReviews(sessionId as string);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
