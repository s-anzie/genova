import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, RecurrencePattern } from '@prisma/client';
import {
  getClassTimeSlots,
  assignTutorToSubject,
  removeTutorAssignment,
  TutorAssignmentData,
} from '../services/class-schedule.service';
import { getNextTutor } from '../services/recurrence-pattern.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError, NotFoundError, AuthorizationError } from '@repo/utils';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/classes/:classId/time-slots/:timeSlotId
 * Get time slot details with assignments
 * Validates: Requirements 13.1
 */
router.get('/:classId/time-slots/:timeSlotId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, timeSlotId } = req.params;

    if (!classId || !timeSlotId) {
      throw new ValidationError('Class ID and Time Slot ID are required');
    }

    // Get time slot with assignments
    const timeSlot = await prisma.classTimeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        tutorAssignments: {
          where: { isActive: true },
          include: {
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        cancellations: {
          orderBy: {
            weekStart: 'desc',
          },
        },
      },
    });

    if (!timeSlot) {
      throw new NotFoundError('Time slot not found');
    }

    if (timeSlot.classId !== classId) {
      throw new ValidationError('Time slot does not belong to this class');
    }

    // Generate session preview for next 4 weeks
    const now = new Date();
    const sessionPreview = [];
    
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      
      // Find the next occurrence of this day of week
      const daysUntilTarget = (timeSlot.dayOfWeek - weekStart.getDay() + 7) % 7;
      const sessionDate = new Date(weekStart);
      sessionDate.setDate(sessionDate.getDate() + daysUntilTarget);
      
      // Set the time
      const [hours, minutes] = timeSlot.startTime.split(':');
      sessionDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);

      // Get tutor for this date
      const tutorId = await getNextTutor(
        timeSlotId,
        sessionDate,
        timeSlot.tutorAssignments
      );

      let tutorName = 'Unassigned';
      if (tutorId) {
        const assignment = timeSlot.tutorAssignments.find(a => a.tutorId === tutorId);
        if (assignment) {
          tutorName = `${assignment.tutor.firstName} ${assignment.tutor.lastName}`;
        }
      }

      sessionPreview.push({
        weekStart: getWeekStart(sessionDate),
        sessionDate,
        tutorId,
        tutorName,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        timeSlot,
        sessionPreview,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:classId/time-slots/:timeSlotId/assignments
 * Add tutor assignment to time slot
 * Validates: Requirements 13.1
 */
router.post('/:classId/time-slots/:timeSlotId/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { classId, timeSlotId } = req.params;
    const { tutorId, recurrencePattern, recurrenceConfig, startDate, endDate } = req.body;

    if (!classId || !timeSlotId) {
      throw new ValidationError('Class ID and Time Slot ID are required');
    }

    if (!tutorId || !recurrencePattern) {
      throw new ValidationError('tutorId and recurrencePattern are required');
    }

    // Validate recurrence pattern
    const validPatterns = Object.values(RecurrencePattern);
    if (!validPatterns.includes(recurrencePattern)) {
      throw new ValidationError(`Invalid recurrence pattern. Must be one of: ${validPatterns.join(', ')}`);
    }

    // Get time slot to get subject
    const timeSlot = await prisma.classTimeSlot.findUnique({
      where: { id: timeSlotId },
    });

    if (!timeSlot) {
      throw new NotFoundError('Time slot not found');
    }

    if (timeSlot.classId !== classId) {
      throw new ValidationError('Time slot does not belong to this class');
    }

    const assignmentData: TutorAssignmentData = {
      subject: timeSlot.subject,
      tutorId,
      timeSlotIds: [timeSlotId],
      recurrencePattern,
      recurrenceConfig,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const assignment = await assignTutorToSubject(classId, req.user.userId, assignmentData);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Tutor assignment created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/classes/:classId/time-slots/:timeSlotId/assignments/:assignmentId
 * Update assignment recurrence pattern
 * Validates: Requirements 13.1
 */
router.put('/:classId/time-slots/:timeSlotId/assignments/:assignmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { classId, timeSlotId, assignmentId } = req.params;
    const { recurrencePattern, recurrenceConfig, startDate, endDate } = req.body;

    if (!classId || !timeSlotId || !assignmentId) {
      throw new ValidationError('Class ID, Time Slot ID, and Assignment ID are required');
    }

    // Get assignment
    const assignment = await prisma.classTutorAssignment.findUnique({
      where: { id: assignmentId },
      include: { class: true },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.classId !== classId) {
      throw new ValidationError('Assignment does not belong to this class');
    }

    if (assignment.class.createdBy !== req.user.userId) {
      throw new AuthorizationError('Only the class creator can update assignments');
    }

    // Validate recurrence pattern if provided
    if (recurrencePattern) {
      const validPatterns = Object.values(RecurrencePattern);
      if (!validPatterns.includes(recurrencePattern)) {
        throw new ValidationError(`Invalid recurrence pattern. Must be one of: ${validPatterns.join(', ')}`);
      }
    }

    // Update assignment
    const updateData: any = {};
    if (recurrencePattern !== undefined) {
      updateData.recurrencePattern = recurrencePattern;
    }
    if (recurrenceConfig !== undefined) {
      updateData.recurrenceConfig = recurrenceConfig;
    }
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    const updatedAssignment = await prisma.classTutorAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/classes/:classId/time-slots/:timeSlotId/assignments/:assignmentId
 * Remove tutor assignment
 * Validates: Requirements 13.1
 */
router.delete('/:classId/time-slots/:timeSlotId/assignments/:assignmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { classId, timeSlotId, assignmentId } = req.params;

    if (!classId || !timeSlotId || !assignmentId) {
      throw new ValidationError('Class ID, Time Slot ID, and Assignment ID are required');
    }

    // Verify assignment belongs to this class and time slot
    const assignment = await prisma.classTutorAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.classId !== classId) {
      throw new ValidationError('Assignment does not belong to this class');
    }

    await removeTutorAssignment(assignmentId, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Assignment removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:classId/time-slots/:timeSlotId/preview
 * Preview session distribution for a time slot
 * Validates: Requirements 13.1
 */
router.post('/:classId/time-slots/:timeSlotId/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, timeSlotId } = req.params;
    const { weeksAhead = 4 } = req.body;

    if (!classId || !timeSlotId) {
      throw new ValidationError('Class ID and Time Slot ID are required');
    }

    // Get time slot with assignments
    const timeSlot = await prisma.classTimeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        tutorAssignments: {
          where: { isActive: true },
          include: {
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!timeSlot) {
      throw new NotFoundError('Time slot not found');
    }

    if (timeSlot.classId !== classId) {
      throw new ValidationError('Time slot does not belong to this class');
    }

    // Generate preview
    const now = new Date();
    const sessions = [];

    for (let week = 0; week < weeksAhead; week++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      
      // Find the next occurrence of this day of week
      const daysUntilTarget = (timeSlot.dayOfWeek - weekStart.getDay() + 7) % 7;
      const sessionDate = new Date(weekStart);
      sessionDate.setDate(sessionDate.getDate() + daysUntilTarget);
      
      // Set the time
      const [hours, minutes] = timeSlot.startTime.split(':');
      sessionDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), 0, 0);

      // Get tutor for this date
      const tutorId = await getNextTutor(
        timeSlotId,
        sessionDate,
        timeSlot.tutorAssignments
      );

      let tutorName = 'Unassigned';
      if (tutorId) {
        const assignment = timeSlot.tutorAssignments.find(a => a.tutorId === tutorId);
        if (assignment) {
          tutorName = `${assignment.tutor.firstName} ${assignment.tutor.lastName}`;
        }
      }

      sessions.push({
        weekStart: getWeekStart(sessionDate),
        sessionDate,
        tutorId,
        tutorName,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to get Monday of the week
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default router;
