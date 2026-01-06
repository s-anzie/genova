import { Router, Request, Response, NextFunction } from 'express';
import {
  searchTutors,
  getTutorDetails,
  getTutorDetailsByUserId,
  TutorSearchCriteria,
} from '../services/tutor-search.service';
import { ValidationError } from '@repo/utils';

const router = Router();

/**
 * POST /api/tutors/search
 * Search for tutors based on criteria
 */
router.post(
  '/search',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const criteria: TutorSearchCriteria = {
        subject: req.body.subject,
        educationLevel: req.body.educationLevel,
        minPrice: req.body.minPrice,
        maxPrice: req.body.maxPrice,
        minRating: req.body.minRating,
        maxDistance: req.body.maxDistance,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        availability: req.body.availability,
        languages: req.body.languages,
        teachingMode: req.body.teachingMode,
      };

      // Validate price range
      if (
        criteria.minPrice !== undefined &&
        criteria.maxPrice !== undefined &&
        criteria.minPrice > criteria.maxPrice
      ) {
        throw new ValidationError(
          'Minimum price cannot be greater than maximum price',
          'minPrice'
        );
      }

      // Validate rating
      if (criteria.minRating !== undefined) {
        if (criteria.minRating < 0 || criteria.minRating > 5) {
          throw new ValidationError(
            'Minimum rating must be between 0 and 5',
            'minRating'
          );
        }
      }

      // Validate location criteria
      if (criteria.maxDistance !== undefined) {
        if (criteria.latitude === undefined || criteria.longitude === undefined) {
          throw new ValidationError(
            'Latitude and longitude are required when filtering by distance',
            'location'
          );
        }
      }

      const results = await searchTutors(criteria);

      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tutors/:id
 * Get tutor details by tutor profile ID
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Tutor ID is required', 'id');
      }

      const tutor = await getTutorDetails(id);

      res.json({
        success: true,
        data: tutor,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tutors/user/:userId
 * Get tutor details by user ID
 */
router.get(
  '/user/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required', 'userId');
      }

      const tutor = await getTutorDetailsByUserId(userId);

      res.json({
        success: true,
        data: tutor,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tutors/suggestions/:sessionId
 * Get tutor suggestions for an unassigned session
 */
router.get(
  '/suggestions/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 3;

      if (!sessionId) {
        throw new ValidationError('Session ID is required', 'sessionId');
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Get session details
      const session = await prisma.tutoringSession.findUnique({
        where: { id: sessionId },
        include: {
          class: {
            select: {
              educationLevelId: true,
            },
          },
        },
      });

      if (!session) {
        throw new ValidationError('Session not found', 'sessionId');
      }

      console.log('Session found:', session.id);
      console.log('Session subject:', session.subject);
      console.log('Session class educationLevelId:', session.class.educationLevelId);

      // Find tutors matching the session criteria
      const criteria: TutorSearchCriteria = {
        subject: session.subject,
        educationLevel: session.class.educationLevelId || undefined,
      };

      console.log('Search criteria:', criteria);

      const tutors = await searchTutors(criteria);

      console.log('Tutors found:', tutors.length);

      // Limit results
      const suggestions = tutors.slice(0, limit);

      res.json({
        success: true,
        data: suggestions,
        sessionId,
      });
    } catch (error) {
      console.error('Error in tutor suggestions:', error);
      next(error);
    }
  }
);

export default router;
