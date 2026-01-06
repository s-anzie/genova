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
  getUpcomingSessions,
  getPastSessions,
  getCancelledSessions,
  getAssignedSessions,
  getSuggestedSessions,
  getTutorPastSessions,
  getTutorCancelledSessions,
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
 * Supports filters: upcoming, past, cancelled, suggested, assigned
 * Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { filter, status, startDate, endDate, studentId, tutorId, classId } = req.query;

    // Admin can query sessions for any user
    const isAdmin = req.user.role === 'ADMIN';
    const queryUserId = (isAdmin && studentId) ? studentId as string : req.user.userId;

    // Handle new filter types
    if (filter) {
      let sessions;
      
      switch (filter) {
        case 'upcoming':
          sessions = await getUpcomingSessions(queryUserId);
          break;
        
        case 'past':
          sessions = await getPastSessions(queryUserId);
          break;
        
        case 'cancelled':
          sessions = await getCancelledSessions(queryUserId);
          break;
        
        case 'assigned':
          sessions = await getAssignedSessions(queryUserId);
          break;
        
        case 'suggested':
          sessions = await getSuggestedSessions(queryUserId);
          break;
        
        case 'tutor-past':
          sessions = await getTutorPastSessions(queryUserId);
          break;
        
        case 'tutor-cancelled':
          sessions = await getTutorCancelledSessions(queryUserId);
          break;
        
        default:
          throw new ValidationError(`Invalid filter. Must be one of: upcoming, past, cancelled, assigned, suggested, tutor-past, tutor-cancelled`);
      }

      return res.status(200).json({
        success: true,
        data: sessions,
        filter,
      });
    }

    // For admin, allow querying all sessions or by specific filters
    if (isAdmin) {
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      // Get all sessions for admin
      const whereClause: any = {};
      
      // Filter by student
      if (studentId) {
        // Get classes where student is a member
        const studentClasses = await prisma.classMember.findMany({
          where: {
            studentId: studentId as string,
            isActive: true,
          },
          select: { classId: true },
        });
        const classIds = studentClasses.map(c => c.classId);
        if (classIds.length > 0) {
          whereClause.classId = { in: classIds };
        } else {
          // Student has no classes, return empty
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      }
      
      // Filter by tutor
      if (tutorId) {
        whereClause.tutorId = tutorId as string;
      }
      
      // Filter by class
      if (classId) {
        whereClause.classId = classId as string;
      }
      
      if (status) {
        whereClause.status = status as string;
      }
      if (startDate || endDate) {
        whereClause.scheduledStart = {};
        if (startDate) {
          whereClause.scheduledStart.gte = new Date(startDate as string);
        }
        if (endDate) {
          whereClause.scheduledStart.lte = new Date(endDate as string);
        }
      }

      // Search filter
      const { search } = req.query;
      let sessionIds: string[] | undefined;
      if (search) {
        // Search in tutor names
        const tutors = await prisma.user.findMany({
          where: {
            role: 'TUTOR',
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });

        const tutorIds = tutors.map(t => t.id);
        
        // Get sessions with matching tutors or subject
        const matchingSessions = await prisma.tutoringSession.findMany({
          where: {
            OR: [
              { tutorId: { in: tutorIds } },
              { subject: { contains: search as string, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });

        sessionIds = matchingSessions.map(s => s.id);
        
        if (sessionIds.length > 0) {
          whereClause.id = { in: sessionIds };
        } else {
          // No matches found, return empty result
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          });
        }
      }

      // Get total count for pagination
      const totalCount = await prisma.tutoringSession.count({
        where: whereClause,
      });

      // Determine sort order based on date filter
      const sortOrder = endDate ? 'desc' : 'asc'; // Past sessions: newest first, Upcoming: soonest first

      const allSessions = await prisma.tutoringSession.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          scheduledStart: sortOrder,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          tutor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Get student info for each session via class members
      const sessionsWithStudents = await Promise.all(
        allSessions.map(async (session) => {
          if (session.classId) {
            const members = await prisma.classMember.findMany({
              where: {
                classId: session.classId,
                isActive: true,
              },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
              take: 1, // Just get first student for display
            });

            return {
              ...session,
              student: members[0]?.student || null,
              scheduledAt: session.scheduledStart,
              date: session.scheduledStart.toISOString().split('T')[0],
              startTime: session.scheduledStart.toTimeString().slice(0, 5),
              endTime: session.scheduledEnd.toTimeString().slice(0, 5),
            };
          }
          return {
            ...session,
            student: null,
            scheduledAt: session.scheduledStart,
            date: session.scheduledStart.toISOString().split('T')[0],
            startTime: session.scheduledStart.toTimeString().slice(0, 5),
            endTime: session.scheduledEnd.toTimeString().slice(0, 5),
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: sessionsWithStudents,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Legacy filtering by status and date range
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

    const sessions = await getUserSessions(queryUserId, filters);

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

    // Extract student from class members for easier frontend access
    let student = null;
    if (session.class?.members && session.class.members.length > 0) {
      const firstMember = session.class.members[0] as any;
      student = firstMember.student || null;
    }

    // Extract subject - use session.subject if it's a string, otherwise try to get from class
    let subjectData = { name: 'N/A', code: 'N/A' };
    if (session.subject) {
      // If subject is a string, use it directly
      subjectData = { name: session.subject as string, code: session.subject as string };
    } else if (session.class?.classSubjects?.[0]?.levelSubject?.subject) {
      // Otherwise try to get from class subjects
      subjectData = session.class.classSubjects[0].levelSubject.subject;
    }

    // Format response with student at top level
    const formattedSession = {
      ...session,
      student,
      subject: subjectData,
      date: session.scheduledStart.toISOString().split('T')[0],
      startTime: session.scheduledStart.toTimeString().slice(0, 5),
      endTime: session.scheduledEnd.toTimeString().slice(0, 5),
      duration: Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000),
    };

    res.status(200).json({
      success: true,
      data: formattedSession,
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
        teachingSubjects: {
          include: {
            levelSubject: {
              include: {
                subject: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!tutorProfile) {
      throw new NotFoundError('Tutor profile not found');
    }

    // Extract subjects and education levels from relations
    const tutorSubjects = tutorProfile.teachingSubjects.map(ts => ts.levelSubject.subject.name);
    const tutorEducationLevels = [...new Set(tutorProfile.teachingSubjects.map(ts => ts.levelSubject.level.name))];

    console.log('Tutor subjects:', tutorSubjects);
    console.log('Tutor education levels:', tutorEducationLevels);

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
          in: tutorSubjects,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            educationLevelId: true,
            meetingLocation: true,
            classSubjects: {
              include: {
                levelSubject: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
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

    // Filter by education level - simplified since we don't have direct access anymore
    // In production, you might want to join through the educationLevel relation
    const availableSessions = candidateSessions.slice(0, limit);

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

