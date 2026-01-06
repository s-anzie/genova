import { PrismaClient, ClassTutorAssignment, TutoringSession, RecurrencePattern } from '@prisma/client';
import { logger } from '@repo/utils';

const prisma = new PrismaClient();

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
 * Calculate week number from a start date
 * Week 1 is the week containing the start date
 */
function getWeekNumber(startDate: Date, currentDate: Date): number {
  const start = getWeekStart(startDate);
  const current = getWeekStart(currentDate);
  const diffTime = current.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks + 1; // Week 1 is the first week
}

/**
 * Apply recurrence pattern to determine tutor for a specific session
 * Validates: Requirements 5.1
 */
export async function getNextTutor(
  timeSlotId: string,
  sessionDate: Date,
  assignments: ClassTutorAssignment[]
): Promise<string | null> {
  // Filter active and accepted assignments for this time slot
  const activeAssignments = assignments.filter(a => 
    a.isActive && 
    a.status === 'ACCEPTED' &&
    (a.timeSlotId === timeSlotId || a.timeSlotId === null) &&
    (!a.startDate || new Date(a.startDate) <= sessionDate) &&
    (!a.endDate || new Date(a.endDate) >= sessionDate)
  );

  if (activeAssignments.length === 0) {
    return null;
  }

  // Sort by createdAt to maintain consistent order (Requirement 5.7)
  activeAssignments.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Get all sessions for this time slot to determine session index
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
    return null;
  }

  const subjectName = timeSlot.levelSubject?.subject.name || 'Unknown';

  // Get all sessions for this class/subject/time slot pattern
  const allSessions = await prisma.tutoringSession.findMany({
    where: {
      classId: timeSlot.classId,
      subject: subjectName,
      scheduledStart: {
        gte: activeAssignments[0]?.startDate || new Date(0),
      },
    },
    orderBy: {
      scheduledStart: 'asc',
    },
  });

  // Filter sessions that match this time slot's day and time
  const matchingSessions = allSessions.filter(session => {
    const sessionDay = session.scheduledStart.getDay();
    const sessionStartTime = `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`;
    return sessionDay === timeSlot.dayOfWeek && sessionStartTime === timeSlot.startTime;
  });

  const sessionIndex = matchingSessions.findIndex(s => 
    s.scheduledStart.getTime() === sessionDate.getTime()
  );

  if (sessionIndex === -1) {
    logger.warn('Session not found in matching sessions list', { sessionDate, timeSlotId });
    return null;
  }

  // Apply patterns in order
  for (const assignment of activeAssignments) {
    const tutorId = applyPatternLogic(
      assignment,
      sessionDate,
      sessionIndex,
      activeAssignments
    );

    if (tutorId) {
      return tutorId;
    }
  }

  return null;
}

/**
 * Apply pattern-specific logic to determine if this assignment applies
 */
function applyPatternLogic(
  assignment: ClassTutorAssignment,
  sessionDate: Date,
  sessionIndex: number,
  allAssignments: ClassTutorAssignment[]
): string | null {
  switch (assignment.recurrencePattern) {
    case RecurrencePattern.ROUND_ROBIN:
      return applyRoundRobin(assignment, sessionIndex, allAssignments);
    
    case RecurrencePattern.WEEKLY:
      return applyWeekly(assignment, sessionDate);
    
    case RecurrencePattern.CONSECUTIVE_DAYS:
      return applyConsecutiveDays(assignment, sessionIndex, allAssignments);
    
    case RecurrencePattern.MANUAL:
      return null; // Manual pattern does not auto-assign
    
    default:
      logger.warn('Unknown recurrence pattern', { pattern: assignment.recurrencePattern });
      return null;
  }
}

/**
 * Apply ROUND_ROBIN pattern
 * Validates: Requirements 5.2
 */
function applyRoundRobin(
  assignment: ClassTutorAssignment,
  sessionIndex: number,
  allAssignments: ClassTutorAssignment[]
): string | null {
  // Get all ROUND_ROBIN assignments
  const roundRobinAssignments = allAssignments.filter(
    a => a.recurrencePattern === RecurrencePattern.ROUND_ROBIN
  );

  if (roundRobinAssignments.length === 0) {
    return null;
  }

  // Distribute evenly using modulo
  const tutorIndex = sessionIndex % roundRobinAssignments.length;
  return roundRobinAssignments[tutorIndex]?.tutorId || null;
}

/**
 * Apply WEEKLY pattern
 * Validates: Requirements 5.3
 */
function applyWeekly(
  assignment: ClassTutorAssignment,
  sessionDate: Date
): string | null {
  if (!assignment.recurrenceConfig) {
    logger.warn('WEEKLY pattern requires recurrenceConfig', { assignmentId: assignment.id });
    return null;
  }

  const config = assignment.recurrenceConfig as any;
  const startDate = assignment.startDate || assignment.createdAt;
  const weekNumber = getWeekNumber(startDate, sessionDate);

  // Check if config has weeks array
  if (config.weeks && Array.isArray(config.weeks)) {
    if (config.weeks.includes(weekNumber)) {
      return assignment.tutorId;
    }
  }

  // Check if config has alternating pattern
  if (config.pattern === 'alternating') {
    const startWeek = config.startWeek || 1;
    // Alternating means every other week starting from startWeek
    if ((weekNumber - startWeek) % 2 === 0) {
      return assignment.tutorId;
    }
  }

  return null;
}

/**
 * Apply CONSECUTIVE_DAYS pattern
 * Validates: Requirements 5.4
 */
function applyConsecutiveDays(
  assignment: ClassTutorAssignment,
  sessionIndex: number,
  allAssignments: ClassTutorAssignment[]
): string | null {
  if (!assignment.recurrenceConfig) {
    logger.warn('CONSECUTIVE_DAYS pattern requires recurrenceConfig', { assignmentId: assignment.id });
    return null;
  }

  const config = assignment.recurrenceConfig as any;
  const consecutiveDays = config.consecutiveDays || 1;

  // Get all CONSECUTIVE_DAYS assignments
  const consecutiveAssignments = allAssignments.filter(
    a => a.recurrencePattern === RecurrencePattern.CONSECUTIVE_DAYS
  );

  if (consecutiveAssignments.length === 0) {
    return null;
  }

  // Find which tutor's turn it is
  const assignmentIndex = consecutiveAssignments.findIndex(a => a.id === assignment.id);
  if (assignmentIndex === -1) {
    return null;
  }

  // Calculate which tutor should teach based on consecutive days
  const cycleLength = consecutiveAssignments.length * consecutiveDays;
  const positionInCycle = sessionIndex % cycleLength;
  const tutorTurn = Math.floor(positionInCycle / consecutiveDays);

  if (tutorTurn === assignmentIndex) {
    return assignment.tutorId;
  }

  return null;
}

/**
 * Apply recurrence patterns to a batch of sessions
 * Validates: Requirements 5.1, 5.6, 5.7
 */
export async function applyPattern(
  sessions: TutoringSession[],
  assignments: ClassTutorAssignment[]
): Promise<Map<string, string>> {
  const sessionTutorMap = new Map<string, string>();

  for (const session of sessions) {
    // Find time slot for this session
    const timeSlots = await prisma.classTimeSlot.findMany({
      where: {
        classId: session.classId,
        levelSubjectId: { not: null },
        isActive: true,
      },
      include: {
        levelSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Find matching time slot by day and time and subject
    const sessionDay = session.scheduledStart.getDay();
    const sessionStartTime = `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`;

    const matchingTimeSlot = timeSlots.find(ts => 
      ts.dayOfWeek === sessionDay && 
      ts.startTime === sessionStartTime &&
      ts.levelSubject?.subject.name === session.subject
    );

    if (!matchingTimeSlot) {
      logger.warn('No matching time slot found for session', { 
        sessionId: session.id,
        sessionDay,
        sessionStartTime,
      });
      continue;
    }

    // Get tutor for this session
    const tutorId = await getNextTutor(
      matchingTimeSlot.id,
      session.scheduledStart,
      assignments
    );

    if (tutorId) {
      sessionTutorMap.set(session.id, tutorId);
    }
  }

  return sessionTutorMap;
}
