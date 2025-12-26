import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createSession,
  getSessionById,
  getUserSessions,
  confirmSession,
  updateSessionStatus,
  cancelSession,
  rescheduleSession,
  updateSession,
  getClassSessions,
  CreateSessionData,
  UpdateSessionData,
} from '../services/session.service';
import {
  createSessionReport,
  getSessionReport,
  getTutorReports,
  getStudentReports,
  updateSessionReport,
  CreateSessionReportData,
} from '../services/session-report.service';
import { createBulkNotifications } from '../services/notification.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError, NotFoundError, AuthorizationError, logger } from '@repo/utils';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/sessions
 * Create a new tutoring session
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const {
      classId,
      tutorId,
      consortiumId,
      scheduledStart,
      scheduledEnd,
      location,
      onlineMeetingLink,
      subject,
      description,
      price,
    } = req.body;

    // Validate required fields
    if (!classId || !scheduledStart || !scheduledEnd || !subject || price === undefined) {
      throw new ValidationError('Class ID, scheduled times, subject, and price are required');
    }

    const sessionData: CreateSessionData = {
      classId,
      tutorId,
      consortiumId,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      location,
      onlineMeetingLink,
      subject,
      description,
      price: parseFloat(price),
    };

    const result = await createSession(req.user.userId, sessionData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Session created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions
 * Get all sessions for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { status, startDate, endDate } = req.query;

    const filters: any = {};
    if (status) {
      filters.status = status as string;
    }
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const sessions = await getUserSessions(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:id
 * Get session details by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await getSessionById(id as string);

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/sessions/:id
 * Update session details
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const {
      tutorId,
      scheduledStart,
      scheduledEnd,
      location,
      onlineMeetingLink,
      description,
      price,
    } = req.body;

    const updateData: UpdateSessionData = {};

    if (tutorId !== undefined) {
      updateData.tutorId = tutorId;
    }
    if (scheduledStart) {
      updateData.scheduledStart = new Date(scheduledStart);
    }
    if (scheduledEnd) {
      updateData.scheduledEnd = new Date(scheduledEnd);
    }
    if (location !== undefined) {
      updateData.location = location;
    }
    if (onlineMeetingLink !== undefined) {
      updateData.onlineMeetingLink = onlineMeetingLink;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (price !== undefined) {
      updateData.price = parseFloat(price);
    }

    const result = await updateSession(id as string, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Session updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/unassign-tutor
 * Tutor unassigns themselves from a session
 */
router.post('/:id/unassign-tutor', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Get session
    const session = await prisma.tutoringSession.findUnique({
      where: { id: id as string },
      include: {
        class: {
          include: {
            members: {
              where: { isActive: true },
              include: {
                student: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Only the assigned tutor can unassign themselves
    if (session.tutorId !== req.user.userId) {
      throw new AuthorizationError('Only the assigned tutor can unassign themselves from this session');
    }

    // Cannot unassign from completed sessions
    if (session.status === 'COMPLETED') {
      throw new ValidationError('Cannot unassign from a completed session');
    }

    // Cannot unassign from already cancelled sessions
    if (session.status === 'CANCELLED') {
      throw new ValidationError('Session is already cancelled');
    }

    // Update session: remove tutor and set status to PENDING
    const updatedSession = await prisma.tutoringSession.update({
      where: { id: id as string },
      data: {
        tutorId: null,
        status: 'PENDING',
        cancellationReason: reason || 'Tutor unassigned',
      },
    });

    // Create notifications for all students in the class
    const notifications = session.class.members.map(member => ({
      userId: member.student.id,
      title: 'Changement de tuteur',
      message: `Le tuteur ${session.tutor?.firstName} ${session.tutor?.lastName} s'est désassigné de votre session "${session.subject}" prévue le ${new Date(session.scheduledStart).toLocaleDateString('fr-FR')}. Nous recherchons un nouveau tuteur.`,
      type: 'SESSION_TUTOR_UNASSIGNED',
      data: {
        sessionId: session.id,
        subject: session.subject,
        scheduledStart: session.scheduledStart,
        tutorName: `${session.tutor?.firstName} ${session.tutor?.lastName}`,
        reason: reason || 'Tuteur non disponible',
      },
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      logger.info(`Created ${notifications.length} notifications for session ${id} tutor unassignment`);
    }

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: `Successfully unassigned from session. ${notifications.length} student(s) have been notified.`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/confirm
 * Confirm a pending session
 */
router.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const result = await confirmSession(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Session confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/cancel
 * Cancel a session with refund calculation
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    const result = await cancelSession(id as string, req.user.userId, reason);

    res.status(200).json({
      success: true,
      data: {
        session: result.session,
        refund: {
          amount: result.refundAmount,
          percentage: result.refundPercentage,
        },
      },
      message: `Session cancelled successfully. ${result.refundAmount > 0 ? `Refund of ${result.refundAmount} (${result.refundPercentage * 100}%) will be processed.` : 'No refund applicable.'}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/reschedule
 * Reschedule a session to a new time slot
 */
router.post('/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { scheduledStart, scheduledEnd } = req.body;

    if (!scheduledStart || !scheduledEnd) {
      throw new ValidationError('New scheduled start and end times are required');
    }

    const result = await rescheduleSession(
      id as string,
      req.user.userId,
      new Date(scheduledStart),
      new Date(scheduledEnd)
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Session rescheduled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/sessions/:id/status
 * Update session status
 */
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    if (!status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await updateSessionStatus(id as string, status, req.user.userId, cancellationReason);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Session status updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/class/:classId
 * Get all sessions for a specific class
 */
router.get('/class/:classId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { status, startDate, endDate } = req.query;

    const filters: any = {};
    if (status) {
      filters.status = status as string;
    }
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const sessions = await getClassSessions(classId as string, filters);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/report
 * Submit a session report (tutor only)
 */
router.post('/:id/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { topicsCovered, homeworkAssigned, studentPerformance, notes } = req.body;

    if (!studentPerformance) {
      throw new ValidationError('Student performance ratings are required');
    }

    const reportData: CreateSessionReportData = {
      sessionId: id as string,
      topicsCovered,
      homeworkAssigned,
      studentPerformance,
      notes,
    };

    const result = await createSessionReport(req.user.userId, reportData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Session report submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:id/report
 * Get session report by session ID
 */
router.get('/:id/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const report = await getSessionReport(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/sessions/:id/report
 * Update a session report (tutor only)
 */
router.put('/:id/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { topicsCovered, homeworkAssigned, studentPerformance, notes } = req.body;

    const updateData: Partial<CreateSessionReportData> = {};
    if (topicsCovered !== undefined) {
      updateData.topicsCovered = topicsCovered;
    }
    if (homeworkAssigned !== undefined) {
      updateData.homeworkAssigned = homeworkAssigned;
    }
    if (studentPerformance !== undefined) {
      updateData.studentPerformance = studentPerformance;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const result = await updateSessionReport(id as string, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Session report updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/reports/tutor
 * Get all reports for the authenticated tutor
 */
router.get('/reports/tutor', async (req: Request, res: Response, next: NextFunction) => {
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

    const reports = await getTutorReports(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/reports/student
 * Get all reports for the authenticated student
 */
router.get('/reports/student', async (req: Request, res: Response, next: NextFunction) => {
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

    const reports = await getStudentReports(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/available-suggestions
 * Get available session suggestions for tutors
 */
router.get('/available-suggestions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 3;

    console.log('Loading available sessions for tutor:', userId);

    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: {
        subjects: true,
        educationLevels: true,
      },
    });

    if (!tutorProfile) {
      throw new NotFoundError('Tutor profile not found');
    }

    console.log('Tutor subjects:', tutorProfile.subjects);
    console.log('Tutor education levels:', tutorProfile.educationLevels);

    // Find unassigned sessions matching tutor's subjects
    const now = new Date();
    const candidateSessions = await prisma.tutoringSession.findMany({
      where: {
        tutorId: null,
        status: 'PENDING',
        scheduledStart: {
          gte: now,
        },
        subject: {
          in: tutorProfile.subjects,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            educationLevel: true,
            subjects: true,
            meetingLocation: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: limit * 3, // Get more than needed to filter by education level
    });

    console.log('Candidate sessions found:', candidateSessions.length);

    // Filter by education level (client-side since educationLevel is JSON)
    const availableSessions = candidateSessions.filter(session => {
      const classEducationLevel = session.class.educationLevel as any;
      let levelStr = '';
      
      if (typeof classEducationLevel === 'string') {
        levelStr = classEducationLevel;
      } else if (classEducationLevel && typeof classEducationLevel === 'object') {
        levelStr = classEducationLevel.level || '';
      }

      console.log('Session education level:', levelStr);
      const matches = tutorProfile.educationLevels.includes(levelStr);
      console.log('Matches tutor levels:', matches);
      
      return matches;
    }).slice(0, limit);

    console.log('Available sessions after filtering:', availableSessions.length);

    res.json({
      success: true,
      data: availableSessions,
    });
  } catch (error) {
    console.error('Error loading available sessions:', error);
    next(error);
  }
});

export default router;

