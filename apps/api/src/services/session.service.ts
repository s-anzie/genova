import { PrismaClient, TutoringSession, Attendance, User } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  logger
} from '@repo/utils';
import { checkMentorBadge, checkPedagogueBadge } from './badge.service';

const prisma = new PrismaClient();

// Reusable select for tutor with hourlyRate
const tutorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  tutorProfile: {
    select: {
      hourlyRate: true,
    },
  },
} as const;

// Types
export interface CreateSessionData {
  classId: string;
  tutorId?: string;
  consortiumId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  location?: string;
  onlineMeetingLink?: string;
  subject: string;
  description?: string;
  price: number;
}

export interface UpdateSessionData {
  scheduledStart?: Date;
  scheduledEnd?: Date;
  location?: string;
  onlineMeetingLink?: string;
  description?: string;
  price?: number;
  tutorId?: string;
}

export interface SessionWithDetails extends TutoringSession {
  class: {
    id: string;
    name: string;
    educationLevel: string;
    subjects: string[]; // Changed from subject to subjects
    members: { studentId: string }[];
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  consortium?: {
    id: string;
    name: string;
  };
  attendances: Attendance[];
}

/**
 * Check if a tutor is available during a time slot
 * Validates: Requirements 6.2
 */
export async function checkTutorAvailability(
  tutorId: string,
  startTime: Date,
  endTime: Date,
  excludeSessionId?: string
): Promise<boolean> {
  // Get tutor profile with availability
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
  });

  if (!tutorProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Check for conflicting sessions
  const conflictingSessions = await prisma.tutoringSession.findMany({
    where: {
      tutorId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      id: excludeSessionId ? { not: excludeSessionId } : undefined,
      OR: [
        // New session starts during existing session
        {
          AND: [
            { scheduledStart: { lte: startTime } },
            { scheduledEnd: { gt: startTime } },
          ],
        },
        // New session ends during existing session
        {
          AND: [
            { scheduledStart: { lt: endTime } },
            { scheduledEnd: { gte: endTime } },
          ],
        },
        // New session completely contains existing session
        {
          AND: [
            { scheduledStart: { gte: startTime } },
            { scheduledEnd: { lte: endTime } },
          ],
        },
      ],
    },
  });

  // If there are conflicting sessions, tutor is not available
  if (conflictingSessions.length > 0) {
    return false;
  }

  // TODO: Check against tutor's weekly availability schedule
  // For now, we'll assume if no conflicts, tutor is available
  return true;
}

/**
 * Create a new tutoring session
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
export async function createSession(
  requestingUserId: string,
  data: CreateSessionData
): Promise<SessionWithDetails> {
  // Validate required fields
  if (!data.classId || !data.scheduledStart || !data.scheduledEnd || !data.subject || data.price === undefined) {
    throw new ValidationError('Class ID, scheduled times, subject, and price are required');
  }

  // Validate that either tutorId or consortiumId is provided
  if (!data.tutorId && !data.consortiumId) {
    throw new ValidationError('Either tutor ID or consortium ID must be provided');
  }

  if (data.tutorId && data.consortiumId) {
    throw new ValidationError('Cannot specify both tutor ID and consortium ID');
  }

  // Validate time range
  if (data.scheduledEnd <= data.scheduledStart) {
    throw new ValidationError('Session end time must be after start time');
  }

  // Validate price
  if (data.price < 0) {
    throw new ValidationError('Price cannot be negative');
  }

  // Check if class exists
  const classData = await prisma.class.findUnique({
    where: { id: data.classId },
    include: {
      members: {
        where: { isActive: true },
        select: { studentId: true },
      },
    },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (!classData.isActive) {
    throw new ValidationError('Cannot create session for inactive class');
  }

  // Check if requesting user is a member of the class or the creator
  const isMember = classData.members.some(m => m.studentId === requestingUserId);
  const isCreator = classData.createdBy === requestingUserId;

  if (!isMember && !isCreator) {
    throw new AuthorizationError('Only class members can create sessions');
  }

  // If tutorId is provided, check tutor availability (Requirement 6.2)
  if (data.tutorId) {
    const isAvailable = await checkTutorAvailability(
      data.tutorId,
      data.scheduledStart,
      data.scheduledEnd
    );

    if (!isAvailable) {
      throw new ConflictError('Tutor is not available during the requested time slot');
    }
  }

  // Create session with PENDING status (Requirement 6.1)
  logger.info('Creating session with data:', {
    classId: data.classId,
    tutorId: data.tutorId,
    scheduledStart: data.scheduledStart.toISOString(),
    scheduledEnd: data.scheduledEnd.toISOString(),
    subject: data.subject,
    price: data.price,
  });

  const session = await prisma.tutoringSession.create({
    data: {
      classId: data.classId,
      tutorId: data.tutorId,
      consortiumId: data.consortiumId,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      location: data.location,
      onlineMeetingLink: data.onlineMeetingLink,
      subject: data.subject,
      description: data.description,
      price: data.price,
      status: 'PENDING',
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  // TODO: Send notifications to tutor and all class members (Requirement 6.4)
  // This would be implemented in a notification service

  return session as SessionWithDetails;
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<SessionWithDetails> {
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          meetingLocation: true,
          members: {
            where: { isActive: true },
            select: {
              id: true,
              studentId: true,
              student: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  role: true,
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
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  return session as SessionWithDetails;
}

/**
 * Get sessions for a user (as student or tutor)
 */
export async function getUserSessions(
  userId: string,
  filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<SessionWithDetails[]> {
  const whereConditions: any = {
    OR: [
      // Sessions where user is the tutor
      { tutorId: userId },
      // Sessions where user is a class member
      {
        class: {
          members: {
            some: {
              studentId: userId,
              isActive: true,
            },
          },
        },
      },
    ],
  };

  // Apply filters
  if (filters?.status) {
    // Handle multiple statuses separated by comma
    const statuses = filters.status.split(',').map(s => s.trim());
    if (statuses.length > 1) {
      whereConditions.status = { in: statuses };
    } else {
      whereConditions.status = statuses[0];
    }
  }

  if (filters?.startDate || filters?.endDate) {
    whereConditions.scheduledStart = {};
    if (filters.startDate) {
      whereConditions.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.scheduledStart.lte = filters.endDate;
    }
  }

  const sessions = await prisma.tutoringSession.findMany({
    where: whereConditions,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
    orderBy: {
      scheduledStart: 'desc',
    },
  });

  return sessions as SessionWithDetails[];
}

/**
 * Confirm a pending session
 * Validates: Requirements 6.5
 */
export async function confirmSession(
  sessionId: string,
  tutorId: string
): Promise<SessionWithDetails> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify tutor is the assigned tutor
  if (session.tutorId !== tutorId) {
    throw new AuthorizationError('Only the assigned tutor can confirm this session');
  }

  // Verify session is in PENDING status
  if (session.status !== 'PENDING') {
    throw new ValidationError(`Cannot confirm session with status: ${session.status}`);
  }

  // Check for conflicts one more time before confirming
  const isAvailable = await checkTutorAvailability(
    tutorId,
    session.scheduledStart,
    session.scheduledEnd,
    sessionId
  );

  if (!isAvailable) {
    throw new ConflictError('Tutor is no longer available during this time slot');
  }

  // Update session status to CONFIRMED
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: { status: 'CONFIRMED' },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  // TODO: Send confirmation notifications to all class members
  // This would be implemented in a notification service

  return updatedSession as SessionWithDetails;
}

/**
 * Update session status
 * Validates: Requirements 6.5
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
  userId: string,
  cancellationReason?: string
): Promise<SessionWithDetails> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Authorization checks
  const isTutor = session.tutorId === userId;
  const isClassCreator = session.class.createdBy === userId;

  if (!isTutor && !isClassCreator) {
    throw new AuthorizationError('Only the tutor or class creator can update session status');
  }

  // Validate status transitions
  if (status === 'CONFIRMED' && session.status !== 'PENDING') {
    throw new ValidationError('Can only confirm pending sessions');
  }

  if (status === 'COMPLETED' && session.status !== 'CONFIRMED') {
    throw new ValidationError('Can only complete confirmed sessions');
  }

  // Update session
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: {
      status,
      cancellationReason: status === 'CANCELLED' ? cancellationReason : undefined,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  // Check for badge eligibility when session is completed
  if (status === 'COMPLETED' && session.tutorId) {
    // Update tutor's total hours taught
    const actualStart = updatedSession.actualStart || updatedSession.scheduledStart;
    const actualEnd = updatedSession.actualEnd || updatedSession.scheduledEnd;
    const hours = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
    
    prisma.tutorProfile.update({
      where: { userId: session.tutorId },
      data: {
        totalHoursTaught: {
          increment: hours,
        },
      },
    }).catch((err: Error) => {
      console.error('Error updating tutor hours:', err);
    });
    
    // Check for Mentor badge (Requirement 11.2)
    checkMentorBadge(session.tutorId).catch((err: Error) => {
      console.error('Error checking Mentor badge:', err);
    });
    
    // Check for Pédagogue badge (Requirement 11.3)
    checkPedagogueBadge(session.tutorId).catch((err: Error) => {
      console.error('Error checking Pédagogue badge:', err);
    });
  }

  // TODO: Send status update notifications
  // This would be implemented in a notification service

  return updatedSession as SessionWithDetails;
}

/**
 * Calculate refund amount based on cancellation timing
 * Validates: Requirements 15.1, 15.2, 15.3
 */
export function calculateRefundAmount(
  sessionPrice: number,
  scheduledStart: Date,
  cancellationTime: Date = new Date()
): { refundAmount: number; refundPercentage: number } {
  const hoursUntilSession = (scheduledStart.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursUntilSession > 24) {
    // More than 24 hours: full refund (Requirement 15.1)
    refundPercentage = 1.0;
  } else if (hoursUntilSession > 2) {
    // Between 2 and 24 hours: 50% refund (Requirement 15.2)
    refundPercentage = 0.5;
  } else {
    // Less than 2 hours: no refund (Requirement 15.3)
    refundPercentage = 0;
  }

  const refundAmount = Math.round(sessionPrice * refundPercentage * 100) / 100;

  return { refundAmount, refundPercentage };
}

/**
 * Process refund for a cancelled session
 */
async function processRefund(
  sessionId: string,
  refundAmount: number,
  refundPercentage: number
): Promise<void> {
  // Get the original payment transaction
  const originalTransaction = await prisma.transaction.findFirst({
    where: {
      sessionId,
      transactionType: 'SESSION_PAYMENT',
      status: 'COMPLETED',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!originalTransaction) {
    logger.warn('No completed payment transaction found for session', { sessionId });
    return;
  }

  if (refundAmount <= 0) {
    logger.info('No refund amount, skipping refund processing', { sessionId, refundPercentage });
    return;
  }

  // Create refund transaction record
  await prisma.transaction.create({
    data: {
      sessionId,
      payerId: originalTransaction.payeeId || '', // Tutor pays back
      payeeId: originalTransaction.payerId, // Student receives
      amount: refundAmount,
      platformFee: 0, // No platform fee on refunds
      netAmount: refundAmount,
      paymentMethod: 'refund',
      paymentProviderId: originalTransaction.paymentProviderId,
      status: 'COMPLETED',
      transactionType: 'SESSION_PAYMENT',
    },
  });

  // Credit student wallet
  await prisma.user.update({
    where: { id: originalTransaction.payerId },
    data: {
      walletBalance: {
        increment: refundAmount,
      },
    },
  });

  // Debit tutor wallet (if they received payment)
  if (originalTransaction.payeeId) {
    await prisma.user.update({
      where: { id: originalTransaction.payeeId },
      data: {
        walletBalance: {
          decrement: refundAmount,
        },
      },
    });
  }

  logger.info('Refund processed', {
    sessionId,
    refundAmount,
    refundPercentage,
    studentId: originalTransaction.payerId,
    tutorId: originalTransaction.payeeId,
  });
}

/**
 * Cancel a session with refund calculation
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4
 */
export async function cancelSession(
  sessionId: string,
  userId: string,
  reason?: string
): Promise<{ session: SessionWithDetails; refundAmount: number; refundPercentage: number }> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Authorization checks
  const isTutor = session.tutorId === userId;
  const isClassCreator = session.class.createdBy === userId;
  const isClassMember = session.class.members.some(m => m.studentId === userId);

  if (!isTutor && !isClassCreator && !isClassMember) {
    throw new AuthorizationError('Only the tutor, class creator, or class members can cancel this session');
  }

  // Cannot cancel already completed or cancelled sessions
  if (session.status === 'COMPLETED') {
    throw new ValidationError('Cannot cancel a completed session');
  }

  if (session.status === 'CANCELLED') {
    throw new ValidationError('Session is already cancelled');
  }

  // Calculate refund amount based on timing
  const { refundAmount, refundPercentage } = calculateRefundAmount(
    session.price.toNumber(),
    session.scheduledStart
  );

  // Update session status to CANCELLED
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  // Process refund if applicable
  if (refundAmount > 0) {
    await processRefund(sessionId, refundAmount, refundPercentage);
  }

  // TODO: Send cancellation notifications to tutor and all class members (Requirement 15.4)
  // This would be implemented in a notification service

  logger.info('Session cancelled', {
    sessionId,
    userId,
    reason,
    refundAmount,
    refundPercentage,
  });

  return {
    session: updatedSession as SessionWithDetails,
    refundAmount,
    refundPercentage,
  };
}

/**
 * Update session details
 */
export async function updateSession(
  sessionId: string,
  userId: string,
  data: UpdateSessionData
): Promise<SessionWithDetails> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Authorization checks
  const isTutor = session.tutorId === userId;
  const isClassCreator = session.class.createdBy === userId;

  if (!isTutor && !isClassCreator) {
    throw new AuthorizationError('Only the tutor or class creator can update session details');
  }

  // Cannot update completed or cancelled sessions
  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    throw new ValidationError(`Cannot update ${session.status.toLowerCase()} sessions`);
  }

  // If updating time, validate and check availability
  if (data.scheduledStart || data.scheduledEnd) {
    const newStart = data.scheduledStart || session.scheduledStart;
    const newEnd = data.scheduledEnd || session.scheduledEnd;

    if (newEnd <= newStart) {
      throw new ValidationError('Session end time must be after start time');
    }

    if (session.tutorId) {
      const isAvailable = await checkTutorAvailability(
        session.tutorId,
        newStart,
        newEnd,
        sessionId
      );

      if (!isAvailable) {
        throw new ConflictError('Tutor is not available during the new time slot');
      }
    }
  }

  // If assigning a tutor, validate and check availability
  if (data.tutorId) {
    logger.info(`Assigning tutor ${data.tutorId} to session ${sessionId}`);
    
    // Check if session already has a tutor assigned
    if (session.tutorId) {
      throw new ConflictError('This session already has a tutor assigned. Please unassign the current tutor first.');
    }
    
    // Check if tutor exists and has a profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: data.tutorId },
      include: { user: true },
    });

    if (!tutorProfile) {
      throw new NotFoundError('Tutor profile not found');
    }

    logger.info(`Tutor profile found: ${tutorProfile.user.firstName} ${tutorProfile.user.lastName}`);

    // Check tutor availability
    const isAvailable = await checkTutorAvailability(
      data.tutorId,
      data.scheduledStart || session.scheduledStart,
      data.scheduledEnd || session.scheduledEnd,
      sessionId
    );

    if (!isAvailable) {
      throw new ConflictError('Tutor is not available during this time slot');
    }

    logger.info(`Tutor is available for the time slot`);

    // Always update price based on tutor's hourly rate when assigning a tutor
    const duration = ((data.scheduledEnd || session.scheduledEnd).getTime() - 
                     (data.scheduledStart || session.scheduledStart).getTime()) / (1000 * 60 * 60);
    data.price = parseFloat(tutorProfile.hourlyRate.toString()) * duration;
    logger.info(`Calculated price: ${data.price} for ${duration} hours at ${tutorProfile.hourlyRate}/h`);
  }

  logger.info(`Updating session ${sessionId} with data:`, data);

  // Update session
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          tutorProfile: {
            select: {
              hourlyRate: true,
            },
          },
        },
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  return updatedSession as SessionWithDetails;
}

/**
 * Get sessions for a class
 */
export async function getClassSessions(
  classId: string,
  filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<SessionWithDetails[]> {
  const whereConditions: any = {
    classId,
  };

  // Apply filters
  if (filters?.status) {
    whereConditions.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    whereConditions.scheduledStart = {};
    if (filters.startDate) {
      whereConditions.scheduledStart.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.scheduledStart.lte = filters.endDate;
    }
  }

  const sessions = await prisma.tutoringSession.findMany({
    where: whereConditions,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
    orderBy: {
      scheduledStart: 'asc',
    },
  });

  return sessions as SessionWithDetails[];
}

/**
 * Reschedule a session to a new time slot
 * Validates: Requirements 15.5
 */
export async function rescheduleSession(
  sessionId: string,
  userId: string,
  newScheduledStart: Date,
  newScheduledEnd: Date
): Promise<SessionWithDetails> {
  // Get session
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Authorization checks
  const isTutor = session.tutorId === userId;
  const isClassCreator = session.class.createdBy === userId;
  const isClassMember = session.class.members.some(m => m.studentId === userId);

  if (!isTutor && !isClassCreator && !isClassMember) {
    throw new AuthorizationError('Only the tutor, class creator, or class members can reschedule this session');
  }

  // Cannot reschedule completed or cancelled sessions
  if (session.status === 'COMPLETED') {
    throw new ValidationError('Cannot reschedule a completed session');
  }

  if (session.status === 'CANCELLED') {
    throw new ValidationError('Cannot reschedule a cancelled session');
  }

  // Validate new time range
  if (newScheduledEnd <= newScheduledStart) {
    throw new ValidationError('Session end time must be after start time');
  }

  // Verify tutor availability for new time slot (Requirement 15.5)
  if (session.tutorId) {
    const isAvailable = await checkTutorAvailability(
      session.tutorId,
      newScheduledStart,
      newScheduledEnd,
      sessionId
    );

    if (!isAvailable) {
      throw new ConflictError('Tutor is not available during the new time slot');
    }
  }

  // Update session with new schedule
  const updatedSession = await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: {
      scheduledStart: newScheduledStart,
      scheduledEnd: newScheduledEnd,
      // Reset status to PENDING if it was CONFIRMED, requiring re-confirmation
      status: session.status === 'CONFIRMED' ? 'PENDING' : session.status,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          educationLevel: true,
          subjects: true,
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
      tutor: {
        select: tutorSelect,
      },
      consortium: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: true,
    },
  });

  // TODO: Send reschedule notifications to tutor and all class members
  // This would be implemented in a notification service

  logger.info('Session rescheduled', {
    sessionId,
    userId,
    oldStart: session.scheduledStart,
    newStart: newScheduledStart,
  });

  return updatedSession as SessionWithDetails;
}

