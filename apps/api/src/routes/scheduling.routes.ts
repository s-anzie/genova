import { Router, Request, Response, NextFunction } from 'express';
import {
  saveTutorAvailability,
  getTutorAvailability,
  deleteTutorAvailability,
  getAvailableSlots,
  getStudentTimetable,
  checkStudentConflicts,
  getClassSchedule,
  DateSlot,
} from '../services/scheduling.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// TUTOR AVAILABILITY ROUTES
// ============================================================================

/**
 * POST /api/scheduling/tutor/:tutorId/availability
 * Save tutor availability slots
 */
router.post('/tutor/:tutorId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { tutorId } = req.params;
    const { slots } = req.body;

    // Verify user is the tutor
    if (req.user.userId !== tutorId) {
      throw new ValidationError('You can only update your own availability');
    }

    if (!Array.isArray(slots)) {
      throw new ValidationError('Slots must be an array');
    }

    const result = await saveTutorAvailability(tutorId, slots as DateSlot[]);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Availability saved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/scheduling/tutor/:tutorId/availability
 * Get tutor availability slots
 */
router.get('/tutor/:tutorId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!tutorId) {
      throw new ValidationError('Tutor ID is required');
    }

    const slots = await getTutorAvailability(
      tutorId as string,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/scheduling/tutor/:tutorId/available-slots
 * Get available time slots for a tutor on a specific date
 */
router.get('/tutor/:tutorId/available-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tutorId } = req.params;
    const { date, duration } = req.query;

    if (!tutorId) {
      throw new ValidationError('Tutor ID is required');
    }

    if (!date) {
      throw new ValidationError('Date is required');
    }

    const durationMinutes = duration ? parseInt(duration as string) : 60;

    const slots = await getAvailableSlots(tutorId as string, date as string, durationMinutes);

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/scheduling/tutor/:tutorId/availability
 * Delete tutor availability slots for specific dates
 */
router.delete('/tutor/:tutorId/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { tutorId } = req.params;
    const { dates } = req.body;

    // Verify user is the tutor
    if (req.user.userId !== tutorId) {
      throw new ValidationError('You can only delete your own availability');
    }

    if (!Array.isArray(dates)) {
      throw new ValidationError('Dates must be an array');
    }

    const result = await deleteTutorAvailability(tutorId, dates);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STUDENT TIMETABLE ROUTES
// ============================================================================

/**
 * GET /api/scheduling/student/:studentId/timetable
 * Get student's complete timetable (classes + sessions)
 */
router.get('/student/:studentId/timetable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!studentId) {
      throw new ValidationError('Student ID is required');
    }

    // Verify user is the student or has permission
    if (req.user.userId !== studentId && req.user.role !== 'ADMIN') {
      throw new ValidationError('You can only view your own timetable');
    }

    const timetable = await getStudentTimetable(
      studentId as string,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/scheduling/student/:studentId/check-conflicts
 * Check if student has schedule conflicts for a proposed session
 */
router.post('/student/:studentId/check-conflicts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { studentId } = req.params;
    const { proposedStart, proposedEnd } = req.body;

    if (!studentId) {
      throw new ValidationError('Student ID is required');
    }

    if (!proposedStart || !proposedEnd) {
      throw new ValidationError('Proposed start and end times are required');
    }

    const conflicts = await checkStudentConflicts(
      studentId as string,
      new Date(proposedStart),
      new Date(proposedEnd)
    );

    res.status(200).json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CLASS SCHEDULE ROUTES
// ============================================================================

/**
 * GET /api/scheduling/class/:classId/schedule
 * Get class schedule (all sessions)
 */
router.get('/class/:classId/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    if (!classId) {
      throw new ValidationError('Class ID is required');
    }

    const schedule = await getClassSchedule(
      classId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
