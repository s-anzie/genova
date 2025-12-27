import { Router, Request, Response, NextFunction } from 'express';
import {
  createRecurringAvailability,
  createOneTimeAvailability,
  getTutorAvailability,
  deleteAvailability,
  RecurringAvailabilityData,
  OneTimeAvailabilityData,
} from '../services/tutor-availability.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/tutors/availability/recurring
 * Create recurring weekly availability for a tutor
 * Validates: Requirements 2.1
 */
router.post('/recurring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { dayOfWeek, startTime, endTime } = req.body;

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      throw new ValidationError('dayOfWeek, startTime, and endTime are required');
    }

    const data: RecurringAvailabilityData = {
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
    };

    const availability = await createRecurringAvailability(req.user.userId, data);

    res.status(201).json({
      success: true,
      data: availability,
      message: 'Recurring availability created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tutors/availability/one-time
 * Create one-time availability for a tutor on a specific date
 * Validates: Requirements 3.1
 */
router.post('/one-time', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { specificDate, startTime, endTime } = req.body;

    // Validate required fields
    if (!specificDate || !startTime || !endTime) {
      throw new ValidationError('specificDate, startTime, and endTime are required');
    }

    const data: OneTimeAvailabilityData = {
      specificDate: new Date(specificDate),
      startTime,
      endTime,
    };

    const availability = await createOneTimeAvailability(req.user.userId, data);

    res.status(201).json({
      success: true,
      data: availability,
      message: 'One-time availability created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tutors/:tutorId/availability
 * Get all availability entries for a tutor
 * Validates: Requirements 2.1, 3.1
 */
router.get('/:tutorId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tutorId } = req.params;

    if (!tutorId) {
      throw new ValidationError('Tutor ID is required');
    }

    const availability = await getTutorAvailability(tutorId);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tutors/availability/:id
 * Delete (deactivate) an availability entry
 * Validates: Requirements 2.1, 3.1
 */
router.delete('/availability/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new ValidationError('Availability ID is required');
    }

    await deleteAvailability(id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
