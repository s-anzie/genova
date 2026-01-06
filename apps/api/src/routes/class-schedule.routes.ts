import { Router, Request, Response } from 'express';
import {
  createTimeSlot,
  getClassTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
  cancelTimeSlotForWeek,
  reinstateTimeSlotForWeek,
  assignTutorToSubject,
  getClassTutorAssignments,
  updateAssignmentStatus,
  removeTutorAssignment,
  getWeekCancellations,
  CreateTimeSlotData,
  UpdateTimeSlotData,
  CancelTimeSlotData,
  TutorAssignmentData,
} from '../services/class-schedule.service';
import { authenticate } from '../middleware/auth.middleware';
import { RecurrencePattern, AssignmentStatus } from '@prisma/client';

const router = Router();

/**
 * POST /api/classes/:classId/schedule/time-slots
 * Create a new time slot
 */
router.post('/:classId/schedule/time-slots', authenticate, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { levelSubjectId, streamSubjectId, dayOfWeek, startTime, endTime } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { message: 'classId is required' },
      });
    }

    if ((!levelSubjectId && !streamSubjectId) || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: { message: 'Either levelSubjectId or streamSubjectId, dayOfWeek, startTime, and endTime are required' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const data: CreateTimeSlotData = {
      levelSubjectId,
      streamSubjectId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
    };

    const timeSlot = await createTimeSlot(classId, req.user.userId, data);

    res.status(201).json({
      success: true,
      data: timeSlot,
    });
  } catch (error: any) {
    console.error('Error creating time slot:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to create time slot' },
    });
  }
});

/**
 * GET /api/classes/:classId/schedule/time-slots
 * Get all time slots for a class
 */
router.get('/:classId/schedule/time-slots', authenticate, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { message: 'classId is required' },
      });
    }
    
    const timeSlots = await getClassTimeSlots(classId);

    res.json({
      success: true,
      data: timeSlots,
    });
  } catch (error: any) {
    console.error('Error fetching time slots:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch time slots' },
    });
  }
});

/**
 * PUT /api/classes/:classId/schedule/time-slots/:timeSlotId
 * Update a time slot
 */
router.put('/:classId/schedule/time-slots/:timeSlotId', authenticate, async (req: Request, res: Response) => {
  try {
    const { timeSlotId } = req.params;
    const data: UpdateTimeSlotData = req.body;

    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        error: { message: 'timeSlotId is required' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const timeSlot = await updateTimeSlot(timeSlotId, req.user.userId, data);

    res.json({
      success: true,
      data: timeSlot,
    });
  } catch (error: any) {
    console.error('Error updating time slot:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to update time slot' },
    });
  }
});

/**
 * DELETE /api/classes/:classId/schedule/time-slots/:timeSlotId
 * Delete a time slot
 */
router.delete('/:classId/schedule/time-slots/:timeSlotId', authenticate, async (req: Request, res: Response) => {
  try {
    const { timeSlotId } = req.params;
    
    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        error: { message: 'timeSlotId is required' },
      });
    }
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }
    
    await deleteTimeSlot(timeSlotId, req.user.userId);

    res.json({
      success: true,
      message: 'Time slot deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting time slot:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to delete time slot' },
    });
  }
});

/**
 * POST /api/classes/:classId/schedule/cancellations
 * Cancel a time slot for a specific week
 */
router.post('/:classId/schedule/cancellations', authenticate, async (req: Request, res: Response) => {
  try {
    const { timeSlotId, weekStart, reason } = req.body;

    if (!timeSlotId || !weekStart) {
      return res.status(400).json({
        success: false,
        error: { message: 'timeSlotId and weekStart are required' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const data: CancelTimeSlotData = {
      timeSlotId,
      weekStart: new Date(weekStart),
      reason,
    };

    await cancelTimeSlotForWeek(req.user.userId, data);

    res.json({
      success: true,
      message: 'Time slot cancelled for the specified week',
    });
  } catch (error: any) {
    console.error('Error cancelling time slot:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to cancel time slot' },
    });
  }
});

/**
 * DELETE /api/classes/:classId/schedule/cancellations
 * Reinstate a cancelled time slot for a specific week
 */
router.delete('/:classId/schedule/cancellations', authenticate, async (req: Request, res: Response) => {
  try {
    const { timeSlotId, weekStart } = req.body;

    if (!timeSlotId || !weekStart) {
      return res.status(400).json({
        success: false,
        error: { message: 'timeSlotId and weekStart are required' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    await reinstateTimeSlotForWeek(timeSlotId, new Date(weekStart), req.user.userId);

    res.json({
      success: true,
      message: 'Time slot reinstated for the specified week',
    });
  } catch (error: any) {
    console.error('Error reinstating time slot:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to reinstate time slot' },
    });
  }
});

/**
 * GET /api/classes/:classId/schedule/cancellations
 * Get cancellations for a specific week
 */
router.get('/:classId/schedule/cancellations', authenticate, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { weekStart } = req.query;

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { message: 'classId is required' },
      });
    }

    if (!weekStart) {
      return res.status(400).json({
        success: false,
        error: { message: 'weekStart query parameter is required' },
      });
    }

    const cancellations = await getWeekCancellations(classId, new Date(weekStart as string));

    res.json({
      success: true,
      data: cancellations,
    });
  } catch (error: any) {
    console.error('Error fetching cancellations:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch cancellations' },
    });
  }
});

/**
 * POST /api/classes/:classId/schedule/tutor-assignments
 * Assign a tutor to a subject
 */
router.post('/:classId/schedule/tutor-assignments', authenticate, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { levelSubjectId, tutorId, timeSlotIds, recurrencePattern, recurrenceConfig, startDate, endDate } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { message: 'classId is required' },
      });
    }

    if (!levelSubjectId || !tutorId || !recurrencePattern) {
      return res.status(400).json({
        success: false,
        error: { message: 'levelSubjectId, tutorId, and recurrencePattern are required' },
      });
    }

    // Validate recurrence pattern
    if (!Object.values(RecurrencePattern).includes(recurrencePattern)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid recurrence pattern' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const data: TutorAssignmentData = {
      levelSubjectId,
      tutorId,
      timeSlotIds,
      recurrencePattern,
      recurrenceConfig,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const assignment = await assignTutorToSubject(classId, req.user.userId, data);

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error assigning tutor:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to assign tutor' },
    });
  }
});

/**
 * GET /api/classes/:classId/schedule/tutor-assignments
 * Get all tutor assignments for a class
 */
router.get('/:classId/schedule/tutor-assignments', authenticate, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { message: 'classId is required' },
      });
    }
    
    const assignments = await getClassTutorAssignments(classId);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.error('Error fetching tutor assignments:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch tutor assignments' },
    });
  }
});

/**
 * PUT /api/classes/:classId/schedule/tutor-assignments/:assignmentId/status
 * Update assignment status (tutor accepts/declines)
 */
router.put('/:classId/schedule/tutor-assignments/:assignmentId/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'assignmentId is required' },
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'status is required' },
      });
    }

    // Validate status
    if (!Object.values(AssignmentStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid assignment status' },
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const assignment = await updateAssignmentStatus(assignmentId, req.user.userId, status);

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error updating assignment status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to update assignment status' },
    });
  }
});

/**
 * DELETE /api/classes/:classId/schedule/tutor-assignments/:assignmentId
 * Remove a tutor assignment
 */
router.delete('/:classId/schedule/tutor-assignments/:assignmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'assignmentId is required' },
      });
    }
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }
    
    await removeTutorAssignment(assignmentId, req.user.userId);

    res.json({
      success: true,
      message: 'Tutor assignment removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing tutor assignment:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message || 'Failed to remove tutor assignment' },
    });
  }
});

export default router;
