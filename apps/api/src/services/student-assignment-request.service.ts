import { PrismaClient, TutorAssignmentRequest, RequestStatus, User } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
  AuthorizationError,
  ConflictError,
  logger
} from '@repo/utils';
import { checkAvailability } from './tutor-availability.service';
import { createBulkNotifications } from './notification.service';

const prisma = new PrismaClient();

/**
 * Get available tutors for a session
 * Validates: Requirements 14.2
 * 
 * Returns tutors where:
 * - The subject matches one of the tutor's subjects
 * - The tutor is available at the session time
 * - The tutor doesn't have conflicting sessions
 */
export async function getAvailableTutors(sessionId: string): Promise<User[]> {
  // Get session details
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

  // Session must not have a tutor assigned
  if (session.tutorId) {
    throw new ValidationError('Session already has a tutor assigned');
  }

  // Calculate session duration in hours
  const duration = (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60 * 60);

  // Find tutors with matching subject
  const tutorsWithSubject = await prisma.tutorProfile.findMany({
    where: {
      subjects: {
        has: session.subject,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  // Filter tutors by availability and no conflicting sessions
  const availableTutors: User[] = [];

  for (const tutorProfile of tutorsWithSubject) {
    const tutorId = tutorProfile.userId;

    try {
      // Check tutor availability
      const isAvailable = await checkAvailability(tutorId, session.scheduledStart, duration);

      if (!isAvailable) {
        continue;
      }

      // Check for conflicting sessions
      const conflictingSessions = await prisma.tutoringSession.findMany({
        where: {
          tutorId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            // New session starts during existing session
            {
              AND: [
                { scheduledStart: { lte: session.scheduledStart } },
                { scheduledEnd: { gt: session.scheduledStart } },
              ],
            },
            // New session ends during existing session
            {
              AND: [
                { scheduledStart: { lt: session.scheduledEnd } },
                { scheduledEnd: { gte: session.scheduledEnd } },
              ],
            },
            // New session completely contains existing session
            {
              AND: [
                { scheduledStart: { gte: session.scheduledStart } },
                { scheduledEnd: { lte: session.scheduledEnd } },
              ],
            },
          ],
        },
      });

      if (conflictingSessions.length === 0) {
        availableTutors.push(tutorProfile.user as User);
      }
    } catch (error) {
      logger.warn('Failed to check availability for tutor', {
        tutorId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Found available tutors', {
    sessionId,
    subject: session.subject,
    totalTutors: tutorsWithSubject.length,
    availableTutors: availableTutors.length,
  });

  return availableTutors;
}

/**
 * Create a tutor assignment request
 * Validates: Requirements 14.3, 14.7
 */
export async function createRequest(
  sessionId: string,
  studentId: string,
  tutorId: string,
  message?: string
): Promise<TutorAssignmentRequest> {
  // Get session details
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
          tutorAssignments: {
            where: {
              isActive: true,
              status: 'ACCEPTED',
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify student is a member of the class
  const isMember = session.class.members.some(m => m.studentId === studentId);
  if (!isMember) {
    throw new AuthorizationError('Only class members can request tutors');
  }

  // Check if session has ClassTutorAssignment-based tutor (Requirement 14.7)
  // If the session was generated with a pre-assigned tutor from ClassTutorAssignment,
  // we should reject student requests
  if (session.tutorId) {
    throw new ConflictError('This session already has a tutor assigned. Student requests are not allowed for pre-assigned sessions.');
  }

  // Check if there's an active ClassTutorAssignment for this session's time slot
  // This would indicate the session is meant to have a pre-assigned tutor
  const hasPreAssignment = session.class.tutorAssignments.some(
    assignment => assignment.subject === session.subject
  );

  if (hasPreAssignment) {
    throw new ConflictError('This session has a pre-configured tutor assignment. Student requests are not allowed.');
  }

  // Verify tutor exists and has a profile
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
    include: {
      user: true,
    },
  });

  if (!tutorProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Check if tutor teaches this subject
  if (!tutorProfile.subjects.includes(session.subject)) {
    throw new ValidationError('Tutor does not teach this subject');
  }

  // Check for existing pending request from this student for this session
  const existingRequest = await prisma.tutorAssignmentRequest.findFirst({
    where: {
      sessionId,
      studentId,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new ConflictError('You already have a pending request for this session');
  }

  // Create the request
  const request = await prisma.tutorAssignmentRequest.create({
    data: {
      sessionId,
      studentId,
      tutorId,
      message,
      status: 'PENDING',
    },
  });

  // Create notification for the tutor (Requirement 14.4)
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  const sessionDateStr = session.scheduledStart.toLocaleDateString();
  const sessionTimeStr = `${session.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${session.scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  await createBulkNotifications([
    {
      userId: tutorId,
      title: 'New Tutor Request',
      message: `${student?.firstName} ${student?.lastName} has requested you to teach ${session.subject} on ${sessionDateStr} at ${sessionTimeStr}.${message ? ` Message: "${message}"` : ''}`,
      type: 'TUTOR_REQUEST',
      data: {
        requestId: request.id,
        sessionId: session.id,
        studentId,
        studentName: `${student?.firstName} ${student?.lastName}`,
        subject: session.subject,
        scheduledStart: session.scheduledStart.toISOString(),
        scheduledEnd: session.scheduledEnd.toISOString(),
        message,
      },
    },
  ]);

  logger.info('Created tutor assignment request', {
    requestId: request.id,
    sessionId,
    studentId,
    tutorId,
  });

  return request;
}

/**
 * Accept a tutor assignment request
 * Validates: Requirements 14.5
 */
export async function acceptRequest(
  requestId: string,
  tutorId: string
): Promise<TutorAssignmentRequest> {
  // Get request details
  const request = await prisma.tutorAssignmentRequest.findUnique({
    where: { id: requestId },
    include: {
      session: {
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
      },
    },
  });

  if (!request) {
    throw new NotFoundError('Request not found');
  }

  // Verify the request is for this tutor
  if (request.tutorId !== tutorId) {
    throw new AuthorizationError('This request is not for you');
  }

  // Verify request is still pending
  if (request.status !== 'PENDING') {
    throw new ValidationError(`Cannot accept request with status: ${request.status}`);
  }

  // Verify session doesn't already have a tutor
  if (request.session.tutorId) {
    throw new ConflictError('Session already has a tutor assigned');
  }

  // Check tutor availability one more time
  const duration = (request.session.scheduledEnd.getTime() - request.session.scheduledStart.getTime()) / (1000 * 60 * 60);
  const isAvailable = await checkAvailability(tutorId, request.session.scheduledStart, duration);

  if (!isAvailable) {
    throw new ConflictError('You are no longer available during this time slot');
  }

  // Check for conflicting sessions
  const conflictingSessions = await prisma.tutoringSession.findMany({
    where: {
      tutorId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        {
          AND: [
            { scheduledStart: { lte: request.session.scheduledStart } },
            { scheduledEnd: { gt: request.session.scheduledStart } },
          ],
        },
        {
          AND: [
            { scheduledStart: { lt: request.session.scheduledEnd } },
            { scheduledEnd: { gte: request.session.scheduledEnd } },
          ],
        },
        {
          AND: [
            { scheduledStart: { gte: request.session.scheduledStart } },
            { scheduledEnd: { lte: request.session.scheduledEnd } },
          ],
        },
      ],
    },
  });

  if (conflictingSessions.length > 0) {
    throw new ConflictError('You have a conflicting session at this time');
  }

  // Get tutor profile for price calculation
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
  });

  if (!tutorProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Calculate price
  const memberCount = request.session.class.members.length;
  const price = parseFloat(tutorProfile.hourlyRate.toString()) * duration * memberCount;

  // Use a transaction to update both request and session
  const [updatedRequest] = await prisma.$transaction([
    // Update request status
    prisma.tutorAssignmentRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      include: {
        session: {
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
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        tutor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    // Assign tutor to session and update status to CONFIRMED
    prisma.tutoringSession.update({
      where: { id: request.sessionId },
      data: {
        tutorId,
        price,
        status: 'CONFIRMED',
      },
    }),
    // Decline any other pending requests for this session
    prisma.tutorAssignmentRequest.updateMany({
      where: {
        sessionId: request.sessionId,
        id: { not: requestId },
        status: 'PENDING',
      },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    }),
  ]);

  // Create notifications for tutor and all class members
  const notifications = [];
  const sessionDateStr = request.session.scheduledStart.toLocaleDateString();
  const sessionTimeStr = `${request.session.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${request.session.scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const tutorName = `${updatedRequest.tutor.firstName} ${updatedRequest.tutor.lastName}`;

  // Notify the requesting student
  notifications.push({
    userId: request.studentId,
    title: 'Tutor Request Accepted',
    message: `${tutorName} has accepted your request to teach ${request.session.subject} on ${sessionDateStr} at ${sessionTimeStr}.`,
    type: 'REQUEST_ACCEPTED',
    data: {
      requestId: request.id,
      sessionId: request.sessionId,
      tutorId,
      tutorName,
      subject: request.session.subject,
      scheduledStart: request.session.scheduledStart.toISOString(),
      scheduledEnd: request.session.scheduledEnd.toISOString(),
    },
  });

  // Notify all other class members
  for (const member of request.session.class.members) {
    if (member.studentId !== request.studentId) {
      notifications.push({
        userId: member.studentId,
        title: 'Tutor Assigned',
        message: `${tutorName} has been assigned to your ${request.session.subject} session on ${sessionDateStr} at ${sessionTimeStr}.`,
        type: 'TUTOR_ASSIGNED',
        data: {
          sessionId: request.sessionId,
          tutorId,
          tutorName,
          subject: request.session.subject,
          scheduledStart: request.session.scheduledStart.toISOString(),
          scheduledEnd: request.session.scheduledEnd.toISOString(),
        },
      });
    }
  }

  await createBulkNotifications(notifications);

  logger.info('Accepted tutor assignment request', {
    requestId,
    sessionId: request.sessionId,
    tutorId,
    studentId: request.studentId,
  });

  return updatedRequest;
}

/**
 * Decline a tutor assignment request
 * Validates: Requirements 14.6
 */
export async function declineRequest(
  requestId: string,
  tutorId: string,
  reason?: string
): Promise<TutorAssignmentRequest> {
  // Get request details
  const request = await prisma.tutorAssignmentRequest.findUnique({
    where: { id: requestId },
    include: {
      session: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      tutor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!request) {
    throw new NotFoundError('Request not found');
  }

  // Verify the request is for this tutor
  if (request.tutorId !== tutorId) {
    throw new AuthorizationError('This request is not for you');
  }

  // Verify request is still pending
  if (request.status !== 'PENDING') {
    throw new ValidationError(`Cannot decline request with status: ${request.status}`);
  }

  // Update request status to DECLINED
  const updatedRequest = await prisma.tutorAssignmentRequest.update({
    where: { id: requestId },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
    },
    include: {
      session: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      tutor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Create notification for the student
  const sessionDateStr = request.session.scheduledStart.toLocaleDateString();
  const sessionTimeStr = `${request.session.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${request.session.scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const tutorName = `${request.tutor.firstName} ${request.tutor.lastName}`;

  await createBulkNotifications([
    {
      userId: request.studentId,
      title: 'Tutor Request Declined',
      message: `${tutorName} has declined your request to teach ${request.session.subject} on ${sessionDateStr} at ${sessionTimeStr}.${reason ? ` Reason: "${reason}"` : ''}`,
      type: 'REQUEST_DECLINED',
      data: {
        requestId: request.id,
        sessionId: request.sessionId,
        tutorId,
        tutorName,
        subject: request.session.subject,
        scheduledStart: request.session.scheduledStart.toISOString(),
        scheduledEnd: request.session.scheduledEnd.toISOString(),
        reason,
      },
    },
  ]);

  logger.info('Declined tutor assignment request', {
    requestId,
    sessionId: request.sessionId,
    tutorId,
    studentId: request.studentId,
    reason,
  });

  return updatedRequest;
}

/**
 * Get all requests for a tutor
 * Validates: Requirements 14.3
 */
export async function getTutorRequests(
  tutorId: string,
  status?: RequestStatus
): Promise<TutorAssignmentRequest[]> {
  const whereConditions: any = {
    tutorId,
  };

  if (status) {
    whereConditions.status = status;
  }

  const requests = await prisma.tutorAssignmentRequest.findMany({
    where: whereConditions,
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              educationLevel: true,
              subjects: true,
            },
          },
        },
      },
      student: {
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
      createdAt: 'desc',
    },
  });

  return requests;
}
