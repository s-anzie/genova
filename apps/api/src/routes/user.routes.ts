import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search, isActive, page, limit } = req.query;

    // Pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        birthDate: true,
        address: true,
        city: true,
        postalCode: true,
        countryCode: true,
        preferredLanguage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        birthDate: true,
        address: true,
        city: true,
        postalCode: true,
        countryCode: true,
        preferredLanguage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/notification-preferences
 * Get notification preferences for the authenticated user
 */
router.get('/notification-preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // For now, return default preferences
    // TODO: Implement notification preferences in database
    const preferences = {
      email: true,
      push: true,
      sms: false,
      sessionReminders: true,
      sessionUpdates: true,
      paymentNotifications: true,
      marketingEmails: false,
    };

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/notification-preferences
 * Update notification preferences for the authenticated user
 */
router.put('/notification-preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // For now, just return the updated preferences
    // TODO: Implement notification preferences in database
    const preferences = req.body;

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create a new user (Admin only)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role, phone, countryCode } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('Un utilisateur avec cet email existe déjà');
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role || 'STUDENT',
        phone,
        countryCode,
        isActive: true,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive, isVerified, countryCode, city, address } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        role,
        isActive,
        isVerified,
        countryCode,
        city,
        address,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
      message: 'Utilisateur modifié avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ValidationError('Utilisateur non trouvé');
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/:id/generate-sessions
 * Generate sessions for a student's classes (Admin only)
 */
router.post('/:id/generate-sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { weeksAhead = 4 } = req.body;

    // Check if user exists and is a student
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ValidationError('Utilisateur non trouvé');
    }

    if (user.role !== 'STUDENT') {
      throw new ValidationError('Cet utilisateur n\'est pas un étudiant');
    }

    // Get all classes for this student
    const classMembers = await prisma.classMember.findMany({
      where: {
        studentId: id,
        isActive: true,
      },
      include: {
        class: true,
      },
    });

    if (classMembers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          classesProcessed: 0,
          sessionsGenerated: 0,
        },
        message: 'Aucune classe trouvée pour cet étudiant',
      });
    }

    // Import the session generator service
    const { generateSessionsForClass } = require('../services/session-generator.service');

    let totalSessions = 0;
    const classesProcessed = [];

    // Generate sessions for each class
    for (const member of classMembers) {
      try {
        const sessions = await generateSessionsForClass(member.classId, weeksAhead);
        totalSessions += sessions.length;
        classesProcessed.push({
          classId: member.classId,
          className: member.class.name,
          sessionsGenerated: sessions.length,
        });
      } catch (error: any) {
        console.error(`Error generating sessions for class ${member.classId}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        classesProcessed: classesProcessed.length,
        sessionsGenerated: totalSessions,
        details: classesProcessed,
      },
      message: `${totalSessions} session(s) générée(s) pour ${classesProcessed.length} classe(s)`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id/classes
 * Get all classes for a student (Admin only)
 */
router.get('/:id/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get all classes where the student is a member
    const classMembers = await prisma.classMember.findMany({
      where: {
        studentId: id,
        isActive: true,
      },
      include: {
        class: {
          include: {
            timeSlots: {
              orderBy: {
                dayOfWeek: 'asc',
              },
            },
            classSubjects: {
              include: {
                levelSubject: {
                  include: {
                    subject: true,
                    level: true,
                  },
                },
              },
            },
            educationLevelRel: {
              select: {
                name: true,
                code: true,
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
    });

    // Format the response
    const classes = classMembers.map(member => {
      const cls = member.class as any;
      const subject = cls.classSubjects[0]?.levelSubject?.subject?.name || 'N/A';
      const level = cls.educationLevelRel?.name || cls.classSubjects[0]?.levelSubject?.level?.name || 'N/A';
      const timeSlot = cls.timeSlots[0];
      const schedule = timeSlot 
        ? `${['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][timeSlot.dayOfWeek]} ${timeSlot.startTime}-${timeSlot.endTime}`
        : 'Horaire non défini';

      // Debug logs
      console.log('Class data:', {
        name: cls.name,
        subject,
        level,
        educationLevelRel: cls.educationLevelRel,
        classSubjects: cls.classSubjects,
      });

      return {
        id: cls.id,
        name: cls.name,
        subject,
        level,
        schedule,
        status: cls.isActive ? 'ACTIVE' : 'INACTIVE',
        memberCount: cls._count.members,
      };
    });

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
