import { PrismaClient, TutoringSession, ClassTimeSlot, ClassSlotCancellation } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
  logger
} from '@repo/utils';
import { applyPattern, getNextTutor } from './recurrence-pattern.service';
import { createBulkNotifications } from './notification.service';

const prisma = new PrismaClient();

/**
 * Calculate the date for a specific day of week in a given week
 * @param weekStart - Monday of the week
 * @param dayOfWeek - 0 (Sunday) to 6 (Saturday)
 */
function getDateForDayOfWeek(weekStart: Date, dayOfWeek: number): Date {
  const date = new Date(weekStart);
  // weekStart is Monday (day 1), adjust for dayOfWeek
  const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 6 days after Monday
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Combine date with time string (HH:MM) to create DateTime
 */
function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
}

/**
 * Calculate duration in hours between two times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotalMinutes = (startHours || 0) * 60 + (startMinutes || 0);
  const endTotalMinutes = (endHours || 0) * 60 + (endMinutes || 0);
  return (endTotalMinutes - startTotalMinutes) / 60;
}

/**
 * Check if sessions exist for a given class and week
 * Validates: Requirements 1.1
 */
export async function checkSessionsExist(
  classId: string,
  weekStart: Date
): Promise<boolean> {
  const monday = getWeekStart(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const sessions = await prisma.tutoringSession.findFirst({
    where: {
      classId,
      scheduledStart: {
        gte: monday,
        lte: sunday,
      },
    },
  });

  return sessions !== null;
}

/**
 * Fill gaps in the session schedule for a class
 * Validates: Requirements 1.1, 1.2
 */
export async function fillSessionGaps(
  classId: string,
  startDate: Date,
  endDate: Date
): Promise<TutoringSession[]> {
  const generatedSessions: TutoringSession[] = [];
  
  // Get all active time slots for the class
  const timeSlots = await prisma.classTimeSlot.findMany({
    where: {
      classId,
      isActive: true,
    },
  });

  if (timeSlots.length === 0) {
    logger.info('No active time slots found for class', { classId });
    return [];
  }

  // Iterate through each week in the date range
  let currentWeekStart = getWeekStart(startDate);
  const endWeekStart = getWeekStart(endDate);

  while (currentWeekStart <= endWeekStart) {
    // Check if sessions already exist for this week
    const sessionsExist = await checkSessionsExist(classId, currentWeekStart);
    
    if (!sessionsExist) {
      // Generate sessions for this week
      for (const timeSlot of timeSlots) {
        const sessions = await generateSessionsForTimeSlot(
          timeSlot.id,
          1, // Generate for 1 week
          currentWeekStart
        );
        generatedSessions.push(...sessions);
      }
    }

    // Move to next week
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return generatedSessions;
}

/**
 * Generate sessions for a specific time slot
 * Validates: Requirements 1.1, 1.2
 */
export async function generateSessionsForTimeSlot(
  timeSlotId: string,
  weeksAhead: number,
  startFromWeek?: Date
): Promise<TutoringSession[]> {
  // Get time slot details
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: timeSlotId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
          },
        },
      },
      levelSubject: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  if (!timeSlot.isActive) {
    logger.info('Time slot is not active, skipping session generation', { timeSlotId });
    return [];
  }

  const subjectName = timeSlot.levelSubject?.subject.name || 'Unknown';
  const generatedSessions: TutoringSession[] = [];
  const startWeek = startFromWeek ? getWeekStart(startFromWeek) : getWeekStart(new Date());

  // Generate sessions for each week
  for (let weekOffset = 0; weekOffset < weeksAhead; weekOffset++) {
    const weekStart = new Date(startWeek);
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));

    // Check if this week is cancelled
    const cancellation = await prisma.classSlotCancellation.findUnique({
      where: {
        timeSlotId_weekStart: {
          timeSlotId: timeSlot.id,
          weekStart: getWeekStart(weekStart),
        },
      },
    });

    if (cancellation) {
      logger.info('Time slot is cancelled for this week, skipping', {
        timeSlotId,
        weekStart: weekStart.toISOString(),
      });
      continue;
    }

    // Calculate the actual date for this time slot's day of week
    const sessionDate = getDateForDayOfWeek(weekStart, timeSlot.dayOfWeek);
    const scheduledStart = combineDateAndTime(sessionDate, timeSlot.startTime);
    const scheduledEnd = combineDateAndTime(sessionDate, timeSlot.endTime);

    // Check if session already exists
    const existingSession = await prisma.tutoringSession.findFirst({
      where: {
        classId: timeSlot.classId,
        scheduledStart,
        scheduledEnd,
      },
    });

    if (existingSession) {
      logger.info('Session already exists, skipping', {
        sessionId: existingSession.id,
        scheduledStart: scheduledStart.toISOString(),
      });
      continue;
    }

    // Create session without tutor assignment initially
    // Status is PENDING, tutorId is null, price is 0 (Requirement 6.2)
    const session = await prisma.tutoringSession.create({
      data: {
        classId: timeSlot.classId,
        tutorId: null, // Will be assigned by recurrence pattern engine
        scheduledStart,
        scheduledEnd,
        subject: subjectName,
        price: 0, // Default price when no tutor assigned (Requirement 6.2)
        status: 'PENDING',
      },
    });

    generatedSessions.push(session);
    logger.info('Generated session', {
      sessionId: session.id,
      classId: timeSlot.classId,
      subject: subjectName,
      scheduledStart: scheduledStart.toISOString(),
    });
  }

  // Apply recurrence patterns to assign tutors (Requirements 5.1, 5.6, 5.7)
  if (generatedSessions.length > 0) {
    await applyTutorAssignments(generatedSessions);
    
    // Create notifications for class members (Requirement 11.1)
    await createSessionGenerationNotifications(generatedSessions, timeSlot.classId);
  }

  return generatedSessions;
}

/**
 * Generate sessions for all time slots in a class
 * Validates: Requirements 1.1, 1.2
 */
export async function generateSessionsForClass(
  classId: string,
  weeksAhead: number
): Promise<TutoringSession[]> {
  // Check if class exists
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (!classData.isActive) {
    logger.info('Class is not active, skipping session generation', { classId });
    return [];
  }

  // Get all active time slots for the class
  const timeSlots = await prisma.classTimeSlot.findMany({
    where: {
      classId,
      isActive: true,
    },
  });

  if (timeSlots.length === 0) {
    logger.info('No active time slots found for class', { classId });
    return [];
  }

  const allGeneratedSessions: TutoringSession[] = [];

  // Generate sessions for each time slot
  for (const timeSlot of timeSlots) {
    const sessions = await generateSessionsForTimeSlot(timeSlot.id, weeksAhead);
    allGeneratedSessions.push(...sessions);
  }

  logger.info('Generated sessions for class', {
    classId,
    totalSessions: allGeneratedSessions.length,
    weeksAhead,
  });

  return allGeneratedSessions;
}

/**
 * Cancel all future sessions for a time slot
 * Validates: Requirements 1.3
 */
export async function cancelFutureSessionsForTimeSlot(
  timeSlotId: string,
  cancellationReason?: string
): Promise<number> {
  const now = new Date();

  // Get the time slot to find associated sessions
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: timeSlotId },
    include: {
      levelSubject: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  const subjectName = timeSlot.levelSubject?.subject.name || 'Unknown';

  // Find all future sessions that match this time slot's schedule
  // We need to match by classId, subject, and day of week pattern
  const futureSessions = await prisma.tutoringSession.findMany({
    where: {
      classId: timeSlot.classId,
      subject: subjectName,
      scheduledStart: {
        gte: now,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  });

  // Filter sessions that match this time slot's day of week and time
  const sessionsToCancel = futureSessions.filter(session => {
    const sessionDay = session.scheduledStart.getDay();
    const sessionStartTime = `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`;
    const sessionEndTime = `${session.scheduledEnd.getHours().toString().padStart(2, '0')}:${session.scheduledEnd.getMinutes().toString().padStart(2, '0')}`;
    
    return sessionDay === timeSlot.dayOfWeek &&
           sessionStartTime === timeSlot.startTime &&
           sessionEndTime === timeSlot.endTime;
  });

  // Cancel each session
  const updatePromises = sessionsToCancel.map(session =>
    prisma.tutoringSession.update({
      where: { id: session.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || `Time slot deleted/deactivated: ${subjectName} on ${getDayName(timeSlot.dayOfWeek)} ${timeSlot.startTime}-${timeSlot.endTime}`,
      },
    })
  );

  await Promise.all(updatePromises);

  logger.info('Cancelled future sessions for time slot', {
    timeSlotId,
    cancelledCount: sessionsToCancel.length,
  });

  return sessionsToCancel.length;
}

/**
 * Helper function to get day name
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

/**
 * Create notifications for newly generated sessions
 * Validates: Requirement 11.1
 */
async function createSessionGenerationNotifications(
  sessions: TutoringSession[],
  classId: string
): Promise<void> {
  if (sessions.length === 0) {
    return;
  }

  // Get all active class members
  const classMembers = await prisma.classMember.findMany({
    where: {
      classId,
      isActive: true,
    },
    select: {
      studentId: true,
    },
  });

  if (classMembers.length === 0) {
    logger.info('No active class members found for notifications', { classId });
    return;
  }

  // Get class details for notification message
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      name: true,
    },
  });

  if (!classData) {
    logger.warn('Class not found for notification', { classId });
    return;
  }

  const notifications = [];

  // Create one notification per class member for the batch of sessions
  for (const member of classMembers) {
    const sessionCount = sessions.length;
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    if (!firstSession || !lastSession) {
      continue;
    }

    const startDateStr = firstSession.scheduledStart.toLocaleDateString();
    const endDateStr = lastSession.scheduledStart.toLocaleDateString();

    notifications.push({
      userId: member.studentId,
      title: 'New Sessions Generated',
      message: `${sessionCount} new session${sessionCount > 1 ? 's have' : ' has'} been generated for ${classData.name} from ${startDateStr} to ${endDateStr}.`,
      type: 'SESSION_GENERATED',
      data: {
        classId,
        className: classData.name,
        sessionCount,
        sessionIds: sessions.map(s => s.id),
        startDate: firstSession.scheduledStart.toISOString(),
        endDate: lastSession.scheduledStart.toISOString(),
      },
    });
  }

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
    logger.info('Created session generation notifications', {
      classId,
      sessionCount: sessions.length,
      notificationCount: notifications.length,
    });
  }
}

/**
 * Recalculate prices for all future PENDING sessions assigned to a tutor
 * Called when tutor's hourly rate changes
 * Validates: Requirement 6.3
 */
export async function recalculatePricesForTutor(
  tutorId: string,
  newHourlyRate: number
): Promise<number> {
  const now = new Date();

  // Get all future PENDING sessions for this tutor
  const futureSessions = await prisma.tutoringSession.findMany({
    where: {
      tutorId,
      status: 'PENDING',
      scheduledStart: {
        gte: now,
      },
    },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (futureSessions.length === 0) {
    logger.info('No future PENDING sessions found for tutor', { tutorId });
    return 0;
  }

  // Recalculate price for each session
  const updatePromises = futureSessions.map(async (session) => {
    // Calculate duration in hours
    const duration = calculateDuration(
      `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`,
      `${session.scheduledEnd.getHours().toString().padStart(2, '0')}:${session.scheduledEnd.getMinutes().toString().padStart(2, '0')}`
    );

    // Get student count
    const studentCount = session.class.members.length || 1;

    // Calculate new price: newHourlyRate × duration × studentCount (Requirement 6.3)
    const newPrice = newHourlyRate * duration * studentCount;

    // Update session price
    await prisma.tutoringSession.update({
      where: { id: session.id },
      data: { price: newPrice },
    });

    logger.info('Updated session price due to tutor rate change', {
      sessionId: session.id,
      tutorId,
      oldPrice: Number(session.price),
      newPrice,
      newHourlyRate,
      duration,
      studentCount,
    });

    return session.id;
  });

  await Promise.all(updatePromises);

  logger.info('Recalculated prices for tutor sessions', {
    tutorId,
    newHourlyRate,
    sessionsUpdated: futureSessions.length,
  });

  return futureSessions.length;
}

async function applyTutorAssignments(sessions: TutoringSession[]): Promise<void> {
  if (sessions.length === 0) {
    return;
  }

  // Get class ID from first session (all sessions should be from same class)
  const classId = sessions[0]?.classId;
  if (!classId) {
    return;
  }

  // Get all active tutor assignments for this class
  const assignments = await prisma.classTutorAssignment.findMany({
    where: {
      classId,
      isActive: true,
      status: 'ACCEPTED',
    },
    orderBy: {
      createdAt: 'asc', // Maintain order for pattern application (Requirement 5.7)
    },
  });

  if (assignments.length === 0) {
    logger.info('No active tutor assignments found for class', { classId });
    return;
  }

  // Apply patterns to get tutor assignments
  const sessionTutorMap = await applyPattern(sessions, assignments);

  // Update sessions with assigned tutors
  for (const [sessionId, tutorId] of sessionTutorMap.entries()) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      continue;
    }

    // Get tutor's hourly rate
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      include: { tutorProfile: true },
    });

    if (!tutor || !tutor.tutorProfile) {
      logger.warn('Tutor profile not found, skipping assignment', { tutorId, sessionId });
      continue;
    }

    // Calculate duration in hours
    const duration = calculateDuration(
      `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`,
      `${session.scheduledEnd.getHours().toString().padStart(2, '0')}:${session.scheduledEnd.getMinutes().toString().padStart(2, '0')}`
    );

    // Get student count from class members
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: {
          where: { isActive: true },
        },
      },
    });

    const studentCount = classData?.members.length || 1;
    
    // Calculate price: hourlyRate × duration × studentCount (Requirement 6.1)
    const hourlyRate = Number(tutor.tutorProfile.hourlyRate);
    const price = hourlyRate * duration * studentCount;

    // Update session with tutor and calculated price
    await prisma.tutoringSession.update({
      where: { id: sessionId },
      data: {
        tutorId,
        price,
        status: 'CONFIRMED', // Auto-confirm since tutor assignment is pre-accepted
      },
    });

    logger.info('Applied tutor assignment to session with calculated price', {
      sessionId,
      tutorId,
      hourlyRate,
      duration,
      studentCount,
      calculatedPrice: price,
    });
  }
}
