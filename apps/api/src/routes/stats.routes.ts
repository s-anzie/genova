import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics (Admin only)
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ValidationError('Admin access required');
    }

    // Get total users count
    const totalUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Get active tutors count
    const activeTutors = await prisma.user.count({
      where: {
        role: 'TUTOR',
        isActive: true,
      },
    });

    // Get active students count
    const activeStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        isActive: true,
      },
    });

    // Get sessions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sessionsThisMonth = await prisma.tutoringSession.count({
      where: {
        scheduledStart: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Get previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sessionsPrevMonth = await prisma.tutoringSession.count({
      where: {
        scheduledStart: {
          gte: startOfPrevMonth,
          lte: endOfPrevMonth,
        },
      },
    });

    // Calculate trends
    const sessionsTrend = sessionsPrevMonth > 0
      ? ((sessionsThisMonth - sessionsPrevMonth) / sessionsPrevMonth) * 100
      : 0;

    // Get recent activity (last 5 sessions for dashboard)
    const recentSessions = await prisma.tutoringSession.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tutor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            name: true,
            members: {
              take: 1,
              include: {
                student: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const recentActivity = recentSessions.map(session => ({
      id: session.id,
      type: 'session',
      description: `Session ${session.subject} - ${session.class?.name || 'N/A'}`,
      tutor: session.tutor ? `${session.tutor.firstName} ${session.tutor.lastName}` : 'Non assigné',
      student: session.class?.members[0]?.student 
        ? `${session.class.members[0].student.firstName} ${session.class.members[0].student.lastName}`
        : 'N/A',
      date: session.createdAt,
      status: session.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeTutors,
          activeStudents,
          sessionsThisMonth,
        },
        trends: {
          sessions: {
            value: Math.abs(Math.round(sessionsTrend)),
            isPositive: sessionsTrend >= 0,
          },
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/activity
 * Get all activity with pagination (Admin only)
 */
router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ValidationError('Admin access required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.tutoringSession.count();

    // Get paginated sessions
    const sessions = await prisma.tutoringSession.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tutor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            name: true,
            members: {
              take: 1,
              include: {
                student: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const activities = sessions.map(session => ({
      id: session.id,
      type: 'session',
      description: `Session ${session.subject} - ${session.class?.name || 'N/A'}`,
      tutor: session.tutor ? `${session.tutor.firstName} ${session.tutor.lastName}` : 'Non assigné',
      student: session.class?.members[0]?.student 
        ? `${session.class.members[0].student.firstName} ${session.class.members[0].student.lastName}`
        : 'N/A',
      date: session.createdAt,
      status: session.status,
      scheduledDate: session.scheduledStart,
    }));

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
