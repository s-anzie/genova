import { PrismaClient, ClassTimeSlot, ClassTutorAssignment, RecurrencePattern, AssignmentStatus } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  logger
} from '@repo/utils';
import { cancelFutureSessionsForTimeSlot, generateSessionsForTimeSlot } from './session-generator.service';
import { createBulkNotifications } from './notification.service';

const prisma = new PrismaClient();

// Types
export interface CreateTimeSlotData {
  subject: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface UpdateTimeSlotData {
  subject?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export interface CancelTimeSlotData {
  timeSlotId: string;
  weekStart: Date; // Monday of the week
  reason?: string;
}

export interface TutorAssignmentData {
  subject: string;
  tutorId: string;
  timeSlotIds?: string[]; // Specific slots, or null for all slots of subject
  recurrencePattern: RecurrencePattern;
  recurrenceConfig?: any; // Pattern-specific configuration
  startDate?: Date;
  endDate?: Date;
}

export interface TimeSlotWithAssignments extends ClassTimeSlot {
  tutorAssignments: ClassTutorAssignment[];
  cancellations: any[];
}

/**
 * Validate time format (HH:MM)
 */
function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Check if two time slots overlap
 */
function timeSlotsOverlap(
  day1: number, start1: string, end1: string,
  day2: number, start2: string, end2: string
): boolean {
  if (day1 !== day2) return false;
  
  const start1Parts = start1.split(':');
  const end1Parts = end1.split(':');
  const start2Parts = start2.split(':');
  const end2Parts = end2.split(':');
  
  const start1Minutes = parseInt(start1Parts[0] || '0') * 60 + parseInt(start1Parts[1] || '0');
  const end1Minutes = parseInt(end1Parts[0] || '0') * 60 + parseInt(end1Parts[1] || '0');
  const start2Minutes = parseInt(start2Parts[0] || '0') * 60 + parseInt(start2Parts[1] || '0');
  const end2Minutes = parseInt(end2Parts[0] || '0') * 60 + parseInt(end2Parts[1] || '0');
  
  return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
}

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Create a time slot for a class
 * Validates: Requirements 2.1, 2.2
 */
export async function createTimeSlot(
  classId: string,
  userId: string,
  data: CreateTimeSlotData
): Promise<ClassTimeSlot> {
  // Check if class exists and user is the creator
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (classData.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can create time slots');
  }

  // Validate time format
  if (!validateTimeFormat(data.startTime) || !validateTimeFormat(data.endTime)) {
    throw new ValidationError('Invalid time format. Use HH:MM format (e.g., 14:00)');
  }

  // Validate start time is before end time
  const startParts = data.startTime.split(':');
  const endParts = data.endTime.split(':');
  const startMinutes = parseInt(startParts[0] || '0') * 60 + parseInt(startParts[1] || '0');
  const endMinutes = parseInt(endParts[0] || '0') * 60 + parseInt(endParts[1] || '0');
  
  if (startMinutes >= endMinutes) {
    throw new ValidationError('Start time must be before end time');
  }

  // Validate day of week
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new ValidationError('Day of week must be between 0 (Sunday) and 6 (Saturday)');
  }

  // Validate subject is in class subjects
  if (!classData.subjects.includes(data.subject)) {
    throw new ValidationError(`Subject "${data.subject}" is not assigned to this class`);
  }

  // Check for overlapping time slots
  const existingSlots = await prisma.classTimeSlot.findMany({
    where: {
      classId,
      isActive: true,
    },
  });

  for (const slot of existingSlots) {
    if (timeSlotsOverlap(
      data.dayOfWeek, data.startTime, data.endTime,
      slot.dayOfWeek, slot.startTime, slot.endTime
    )) {
      throw new ConflictError(
        `Time slot overlaps with existing slot: ${slot.subject} on ${getDayName(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`
      );
    }
  }

  // Create time slot
  const timeSlot = await prisma.classTimeSlot.create({
    data: {
      classId,
      subject: data.subject,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  return timeSlot;
}

/**
 * Get all time slots for a class
 */
export async function getClassTimeSlots(classId: string): Promise<TimeSlotWithAssignments[]> {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  const timeSlots = await prisma.classTimeSlot.findMany({
    where: {
      classId,
      isActive: true,
    },
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
      },
      cancellations: true,
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return timeSlots as TimeSlotWithAssignments[];
}

/**
 * Update a time slot
 */
export async function updateTimeSlot(
  timeSlotId: string,
  userId: string,
  data: UpdateTimeSlotData
): Promise<ClassTimeSlot> {
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: timeSlotId },
    include: { class: true },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  if (timeSlot.class.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can update time slots');
  }

  // Validate time format if provided
  if (data.startTime && !validateTimeFormat(data.startTime)) {
    throw new ValidationError('Invalid start time format. Use HH:MM format');
  }
  if (data.endTime && !validateTimeFormat(data.endTime)) {
    throw new ValidationError('Invalid end time format. Use HH:MM format');
  }

  // Validate start time is before end time
  const startTime = data.startTime || timeSlot.startTime;
  const endTime = data.endTime || timeSlot.endTime;
  const startParts = startTime.split(':');
  const endParts = endTime.split(':');
  const startMinutes = parseInt(startParts[0] || '0') * 60 + parseInt(startParts[1] || '0');
  const endMinutes = parseInt(endParts[0] || '0') * 60 + parseInt(endParts[1] || '0');
  
  if (startMinutes >= endMinutes) {
    throw new ValidationError('Start time must be before end time');
  }

  // Check for overlapping time slots (excluding current slot)
  const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : timeSlot.dayOfWeek;
  const existingSlots = await prisma.classTimeSlot.findMany({
    where: {
      classId: timeSlot.classId,
      isActive: true,
      id: { not: timeSlotId },
    },
  });

  for (const slot of existingSlots) {
    if (timeSlotsOverlap(
      dayOfWeek, startTime, endTime,
      slot.dayOfWeek, slot.startTime, slot.endTime
    )) {
      throw new ConflictError(
        `Time slot overlaps with existing slot: ${slot.subject} on ${getDayName(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`
      );
    }
  }

  // Update time slot
  const updatedSlot = await prisma.classTimeSlot.update({
    where: { id: timeSlotId },
    data,
  });

  return updatedSlot;
}

/**
 * Delete a time slot
 */
export async function deleteTimeSlot(
  timeSlotId: string,
  userId: string
): Promise<void> {
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: timeSlotId },
    include: { 
      class: true,
      tutorAssignments: { where: { isActive: true } },
    },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  if (timeSlot.class.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can delete time slots');
  }

  // Cancel all future sessions for this time slot (Requirement 1.3)
  await cancelFutureSessionsForTimeSlot(
    timeSlotId,
    `Time slot deleted: ${timeSlot.subject} on ${getDayName(timeSlot.dayOfWeek)} ${timeSlot.startTime}-${timeSlot.endTime}`
  );

  // Soft delete
  await prisma.classTimeSlot.update({
    where: { id: timeSlotId },
    data: { isActive: false },
  });

  // Deactivate associated tutor assignments
  if (timeSlot.tutorAssignments.length > 0) {
    await prisma.classTutorAssignment.updateMany({
      where: { timeSlotId },
      data: { isActive: false },
    });
  }
}

/**
 * Cancel a time slot for a specific week
 * Validates: Requirements 7.1, 7.2
 */
export async function cancelTimeSlotForWeek(
  userId: string,
  data: CancelTimeSlotData
): Promise<void> {
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: data.timeSlotId },
    include: { class: true },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  if (timeSlot.class.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can cancel time slots');
  }

  // Ensure weekStart is a Monday
  const weekStart = getWeekStart(data.weekStart);

  // Check if already cancelled
  const existing = await prisma.classSlotCancellation.findUnique({
    where: {
      timeSlotId_weekStart: {
        timeSlotId: data.timeSlotId,
        weekStart,
      },
    },
  });

  if (existing) {
    throw new ConflictError('This time slot is already cancelled for this week');
  }

  // Create cancellation
  const cancellation = await prisma.classSlotCancellation.create({
    data: {
      timeSlotId: data.timeSlotId,
      weekStart,
      reason: data.reason,
      createdBy: userId,
    },
  });

  // Cancel related sessions for this week (Requirement 7.1)
  await cancelSessionsForSlotCancellation(cancellation.id, timeSlot, weekStart);
}

/**
 * Reinstate a cancelled time slot for a specific week
 * Validates: Requirement 7.3
 */
export async function reinstateTimeSlotForWeek(
  timeSlotId: string,
  weekStart: Date,
  userId: string
): Promise<void> {
  const timeSlot = await prisma.classTimeSlot.findUnique({
    where: { id: timeSlotId },
    include: { class: true },
  });

  if (!timeSlot) {
    throw new NotFoundError('Time slot not found');
  }

  if (timeSlot.class.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can reinstate time slots');
  }

  const monday = getWeekStart(weekStart);

  const cancellation = await prisma.classSlotCancellation.findUnique({
    where: {
      timeSlotId_weekStart: {
        timeSlotId,
        weekStart: monday,
      },
    },
  });

  if (!cancellation) {
    throw new NotFoundError('No cancellation found for this time slot and week');
  }

  // Delete the cancellation
  await prisma.classSlotCancellation.delete({
    where: { id: cancellation.id },
  });

  // Regenerate sessions for this specific week (Requirement 7.3)
  await regenerateSessionsForWeek(timeSlotId, monday);
}

/**
 * Assign tutor to subject/time slots
 * Validates: Requirements 4.1, 4.2, 5.1
 */
export async function assignTutorToSubject(
  classId: string,
  userId: string,
  data: TutorAssignmentData
): Promise<ClassTutorAssignment> {
  // Check if class exists and user is the creator
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: { timeSlots: { where: { isActive: true } } },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  if (classData.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can assign tutors');
  }

  // Validate subject
  if (!classData.subjects.includes(data.subject)) {
    throw new ValidationError(`Subject "${data.subject}" is not assigned to this class`);
  }

  // Validate tutor exists and has expertise in subject
  const tutor = await prisma.user.findUnique({
    where: { id: data.tutorId },
    include: { tutorProfile: true },
  });

  if (!tutor || tutor.role !== 'TUTOR') {
    throw new NotFoundError('Tutor not found');
  }

  if (tutor.tutorProfile && !tutor.tutorProfile.subjects.includes(data.subject)) {
    throw new ValidationError(`Tutor does not have expertise in ${data.subject}`);
  }

  // If specific time slots provided, validate they exist and belong to the subject
  if (data.timeSlotIds && data.timeSlotIds.length > 0) {
    const slots = await prisma.classTimeSlot.findMany({
      where: {
        id: { in: data.timeSlotIds },
        classId,
        subject: data.subject,
        isActive: true,
      },
    });

    if (slots.length !== data.timeSlotIds.length) {
      throw new ValidationError('Some time slot IDs are invalid or do not match the subject');
    }
  }

  // Create tutor assignment
  // For simplicity, if multiple time slots, create one assignment per slot
  // In production, you might want more sophisticated handling based on recurrence pattern
  
  if (data.timeSlotIds && data.timeSlotIds.length > 0) {
    // Assign to specific slots
    const assignment = await prisma.classTutorAssignment.create({
      data: {
        classId,
        timeSlotId: data.timeSlotIds[0], // For now, assign to first slot
        subject: data.subject,
        tutorId: data.tutorId,
        recurrencePattern: data.recurrencePattern,
        recurrenceConfig: data.recurrenceConfig,
        startDate: data.startDate,
        endDate: data.endDate,
        status: AssignmentStatus.PENDING,
      },
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

    // TODO: Send notification to tutor for acceptance
    return assignment;
  } else {
    // Assign to all slots of the subject
    const assignment = await prisma.classTutorAssignment.create({
      data: {
        classId,
        timeSlotId: null,
        subject: data.subject,
        tutorId: data.tutorId,
        recurrencePattern: data.recurrencePattern,
        recurrenceConfig: data.recurrenceConfig,
        startDate: data.startDate,
        endDate: data.endDate,
        status: AssignmentStatus.PENDING,
      },
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

    return assignment;
  }
}

/**
 * Get tutor assignments for a class
 */
export async function getClassTutorAssignments(classId: string): Promise<ClassTutorAssignment[]> {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  const assignments = await prisma.classTutorAssignment.findMany({
    where: {
      classId,
      isActive: true,
    },
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
      timeSlot: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return assignments;
}

/**
 * Update tutor assignment status (accept/decline)
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  tutorId: string,
  status: AssignmentStatus
): Promise<ClassTutorAssignment> {
  const assignment = await prisma.classTutorAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  if (assignment.tutorId !== tutorId) {
    throw new AuthorizationError('Only the assigned tutor can update assignment status');
  }

  const updated = await prisma.classTutorAssignment.update({
    where: { id: assignmentId },
    data: { status },
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

  // TODO: Notify class creator of status change

  return updated;
}

/**
 * Remove tutor assignment
 */
export async function removeTutorAssignment(
  assignmentId: string,
  userId: string
): Promise<void> {
  const assignment = await prisma.classTutorAssignment.findUnique({
    where: { id: assignmentId },
    include: { class: true },
  });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  if (assignment.class.createdBy !== userId) {
    throw new AuthorizationError('Only the class creator can remove tutor assignments');
  }

  await prisma.classTutorAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false },
  });
}

/**
 * Get cancellations for a specific week
 */
export async function getWeekCancellations(
  classId: string,
  weekStart: Date
): Promise<any[]> {
  const monday = getWeekStart(weekStart);
  
  const cancellations = await prisma.classSlotCancellation.findMany({
    where: {
      weekStart: monday,
      timeSlot: {
        classId,
        isActive: true,
      },
    },
    include: {
      timeSlot: true,
    },
  });

  return cancellations;
}

/**
 * Helper function to get day name
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

/**
 * Cancel sessions for a specific slot cancellation
 * Validates: Requirements 7.1, 7.2, 7.4
 */
async function cancelSessionsForSlotCancellation(
  cancellationId: string,
  timeSlot: ClassTimeSlot & { class: any },
  weekStart: Date
): Promise<void> {
  // Calculate the week end (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Find all sessions for this time slot in this week
  const sessionsToCancel = await prisma.tutoringSession.findMany({
    where: {
      classId: timeSlot.classId,
      subject: timeSlot.subject,
      scheduledStart: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  });

  // Filter sessions that match this time slot's day of week and time
  const matchingSessions = sessionsToCancel.filter(session => {
    const sessionDay = session.scheduledStart.getDay();
    const sessionStartTime = `${session.scheduledStart.getHours().toString().padStart(2, '0')}:${session.scheduledStart.getMinutes().toString().padStart(2, '0')}`;
    const sessionEndTime = `${session.scheduledEnd.getHours().toString().padStart(2, '0')}:${session.scheduledEnd.getMinutes().toString().padStart(2, '0')}`;
    
    return sessionDay === timeSlot.dayOfWeek &&
           sessionStartTime === timeSlot.startTime &&
           sessionEndTime === timeSlot.endTime;
  });

  // Cancel each matching session with reference to slot cancellation (Requirement 7.2)
  const cancellationReason = `Slot cancelled for week of ${weekStart.toISOString().split('T')[0]}: ${timeSlot.subject} on ${getDayName(timeSlot.dayOfWeek)} ${timeSlot.startTime}-${timeSlot.endTime} (Cancellation ID: ${cancellationId})`;

  const updatePromises = matchingSessions.map(session =>
    prisma.tutoringSession.update({
      where: { id: session.id },
      data: {
        status: 'CANCELLED',
        cancellationReason,
      },
    })
  );

  await Promise.all(updatePromises);

  logger.info('Cancelled sessions for slot cancellation', {
    cancellationId,
    timeSlotId: timeSlot.id,
    weekStart: weekStart.toISOString(),
    cancelledCount: matchingSessions.length,
  });

  // Create notifications for all class members and assigned tutors (Requirement 7.4)
  if (matchingSessions.length > 0) {
    await createCancellationNotifications(matchingSessions, timeSlot, weekStart);
  }
}

/**
 * Create notifications for slot cancellation
 * Validates: Requirement 7.4
 */
async function createCancellationNotifications(
  cancelledSessions: any[],
  timeSlot: ClassTimeSlot & { class: any },
  weekStart: Date
): Promise<void> {
  // Get all class members
  const classMembers = await prisma.classMember.findMany({
    where: {
      classId: timeSlot.classId,
      isActive: true,
    },
    select: {
      studentId: true,
    },
  });

  // Collect unique tutor IDs from cancelled sessions
  const tutorIds = new Set<string>();
  cancelledSessions.forEach(session => {
    if (session.tutorId) {
      tutorIds.add(session.tutorId);
    }
  });

  const notifications = [];
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Create notifications for all class members
  for (const member of classMembers) {
    notifications.push({
      userId: member.studentId,
      title: 'Session Cancelled',
      message: `The ${timeSlot.subject} session on ${getDayName(timeSlot.dayOfWeek)} ${timeSlot.startTime}-${timeSlot.endTime} for the week of ${weekStartStr} has been cancelled.`,
      type: 'SESSION_CANCELLED',
      data: {
        classId: timeSlot.classId,
        timeSlotId: timeSlot.id,
        subject: timeSlot.subject,
        weekStart: weekStartStr,
      },
    });
  }

  // Create notifications for assigned tutors
  for (const tutorId of tutorIds) {
    notifications.push({
      userId: tutorId,
      title: 'Session Cancelled',
      message: `Your ${timeSlot.subject} session on ${getDayName(timeSlot.dayOfWeek)} ${timeSlot.startTime}-${timeSlot.endTime} for the week of ${weekStartStr} has been cancelled.`,
      type: 'SESSION_CANCELLED',
      data: {
        classId: timeSlot.classId,
        timeSlotId: timeSlot.id,
        subject: timeSlot.subject,
        weekStart: weekStartStr,
      },
    });
  }

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
    logger.info('Created cancellation notifications', {
      timeSlotId: timeSlot.id,
      weekStart: weekStartStr,
      notificationCount: notifications.length,
    });
  }
}

/**
 * Regenerate sessions for a specific week after slot reinstatement
 * Validates: Requirement 7.3
 */
async function regenerateSessionsForWeek(
  timeSlotId: string,
  weekStart: Date
): Promise<void> {
  // Generate sessions for this specific week (1 week ahead from the weekStart)
  const sessions = await generateSessionsForTimeSlot(timeSlotId, 1, weekStart);

  logger.info('Regenerated sessions for reinstated slot', {
    timeSlotId,
    weekStart: weekStart.toISOString(),
    generatedCount: sessions.length,
  });
}
