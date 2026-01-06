import { PrismaClient } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  logger
} from '@repo/utils';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface DateSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[]; // day: monday, tuesday, etc.
}

export interface TutorAvailability {
  tutorId: string;
  dateSlots: DateSlot[];
  weeklySchedule?: WeeklySchedule; // For recurring availability
}

export interface StudentTimetable {
  studentId: string;
  classes: ClassSchedule[];
  sessions: SessionSchedule[];
}

export interface ClassSchedule {
  classId: string;
  className: string;
  subject: string;
  schedule: DateSlot[];
}

export interface SessionSchedule {
  sessionId: string;
  subject: string;
  tutorName: string;
  start: Date;
  end: Date;
  location?: string;
  status: string;
}

export interface ScheduleConflict {
  type: 'session' | 'class' | 'availability';
  id: string;
  start: Date;
  end: Date;
  description: string;
}

// ============================================================================
// TUTOR AVAILABILITY MANAGEMENT
// ============================================================================

/**
 * Save tutor availability slots for specific dates
 * Validates: Requirements for tutor scheduling
 */
export async function saveTutorAvailability(
  tutorId: string,
  slots: DateSlot[]
): Promise<{ success: boolean; count: number }> {
  // Validate tutor exists
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
  });

  if (!tutorProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Validate slots
  for (const slot of slots) {
    if (!slot.date || !slot.start || !slot.end) {
      throw new ValidationError('Each slot must have date, start, and end time');
    }
    if (slot.start >= slot.end) {
      throw new ValidationError(`Start time must be before end time for slot on ${slot.date}`);
    }
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) {
      throw new ValidationError(`Invalid date format: ${slot.date}. Expected YYYY-MM-DD`);
    }
    
    // Validate time format (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(slot.start) || !/^\d{2}:\d{2}$/.test(slot.end)) {
      throw new ValidationError('Invalid time format. Expected HH:mm');
    }
  }

  // Delete existing availability for these dates
  const dates = slots.map(s => new Date(s.date));
  await prisma.tutorAvailability.deleteMany({
    where: {
      tutorId,
      specificDate: { in: dates },
    },
  });

  // Create new availability slots
  const availabilityData = slots.map(slot => ({
    tutorId,
    tutorProfileId: tutorProfile.id,
    specificDate: new Date(slot.date),
    startTime: slot.start,
    endTime: slot.end,
    isRecurring: false,
    isActive: true,
  }));

  await prisma.tutorAvailability.createMany({
    data: availabilityData,
  });

  logger.info('Tutor availability saved', { tutorId, slotsCount: slots.length });

  return { success: true, count: slots.length };
}

/**
 * Get tutor availability slots for a date range
 */
export async function getTutorAvailability(
  tutorId: string,
  startDate?: string,
  endDate?: string
): Promise<DateSlot[]> {
  const where: any = {
    tutorId,
    isActive: true,
    specificDate: { not: null },
  };

  if (startDate || endDate) {
    where.specificDate = {};
    if (startDate) where.specificDate.gte = new Date(startDate);
    if (endDate) where.specificDate.lte = new Date(endDate);
  }

  const availabilities = await prisma.tutorAvailability.findMany({
    where,
    orderBy: { specificDate: 'asc' },
  });

  const filtered = availabilities.filter(avail => avail.specificDate !== null);
  
  return filtered.map(avail => ({
    date: avail.specificDate!.toISOString().split('T')[0],
    start: avail.startTime,
    end: avail.endTime,
  })) as DateSlot[];
}

/**
 * Get available time slots for a tutor on a specific date
 * Excludes already booked sessions
 */
export async function getAvailableSlots(
  tutorId: string,
  date: string,
  duration: number = 60 // in minutes
): Promise<TimeSlot[]> {
  // Get tutor's availability for the date
  const allSlots = await getTutorAvailability(tutorId, date, date);
  const availabilitySlots = allSlots.filter(slot => slot.date === date);
  
  if (availabilitySlots.length === 0) {
    return [];
  }

  // Get booked sessions for the date
  const startOfDay = new Date(date + 'T00:00:00Z');
  const endOfDay = new Date(date + 'T23:59:59Z');
  
  const bookedSessions = await prisma.tutoringSession.findMany({
    where: {
      tutorId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      scheduledStart: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      scheduledStart: true,
      scheduledEnd: true,
    },
  });

  // Generate available slots
  const availableSlots: TimeSlot[] = [];
  
  for (const availSlot of availabilitySlots) {
    const slotStart = timeToMinutes(availSlot.start);
    const slotEnd = timeToMinutes(availSlot.end);
    
    // Generate slots every 30 minutes
    for (let minutes = slotStart; minutes + duration <= slotEnd; minutes += 30) {
      const start = minutesToTime(minutes);
      const end = minutesToTime(minutes + duration);
      
      // Check if this slot conflicts with any booked session
      const hasConflict = bookedSessions.some(session => {
        const sessionStart = session.scheduledStart.getHours() * 60 + session.scheduledStart.getMinutes();
        const sessionEnd = session.scheduledEnd.getHours() * 60 + session.scheduledEnd.getMinutes();
        
        return (minutes < sessionEnd && minutes + duration > sessionStart);
      });
      
      if (!hasConflict) {
        availableSlots.push({ start, end });
      }
    }
  }
  
  return availableSlots;
}

/**
 * Delete tutor availability slots for specific dates
 */
export async function deleteTutorAvailability(
  tutorId: string,
  dates: string[]
): Promise<{ success: boolean; deleted: number }> {
  const datesToDelete = dates.map(d => new Date(d));

  const result = await prisma.tutorAvailability.deleteMany({
    where: {
      tutorId,
      specificDate: { in: datesToDelete },
    },
  });

  logger.info('Tutor availability deleted', { tutorId, deletedCount: result.count });

  return { success: true, deleted: result.count };
}

// ============================================================================
// STUDENT TIMETABLE MANAGEMENT
// ============================================================================

/**
 * Get student's complete timetable (classes + sessions)
 */
export async function getStudentTimetable(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudentTimetable> {
  // Get student's classes
  const classMembers = await prisma.classMember.findMany({
    where: {
      studentId,
      isActive: true,
    },
    include: {
      class: {
        include: {
          sessions: {
            where: {
              scheduledStart: startDate ? { gte: new Date(startDate) } : undefined,
              scheduledEnd: endDate ? { lte: new Date(endDate) } : undefined,
              status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
            },
            include: {
              tutor: {
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

  const classes: ClassSchedule[] = [];
  const sessions: SessionSchedule[] = [];

  for (const member of classMembers) {
    const classData = member.class as typeof member.class & { subjects: string[] };
    
    // Add class info (with multiple subjects)
    classes.push({
      classId: classData.id,
      className: classData.name,
      subject: classData.subjects.join(', '), // Join multiple subjects
      schedule: [], // Classes don't have fixed schedules, only sessions
    });

    // Add sessions for this class
    for (const session of classData.sessions) {
      sessions.push({
        sessionId: session.id,
        subject: session.subject,
        tutorName: session.tutor 
          ? `${session.tutor.firstName} ${session.tutor.lastName}`
          : 'TBD',
        start: session.scheduledStart,
        end: session.scheduledEnd,
        location: session.location || undefined,
        status: session.status,
      });
    }
  }

  return {
    studentId,
    classes,
    sessions,
  };
}

/**
 * Check if student has schedule conflicts for a new session
 */
export async function checkStudentConflicts(
  studentId: string,
  proposedStart: Date,
  proposedEnd: Date
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = [];

  // Check for conflicting sessions
  const existingSessions = await prisma.tutoringSession.findMany({
    where: {
      class: {
        members: {
          some: {
            studentId,
            isActive: true,
          },
        },
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        // Proposed session starts during existing session
        {
          AND: [
            { scheduledStart: { lte: proposedStart } },
            { scheduledEnd: { gt: proposedStart } },
          ],
        },
        // Proposed session ends during existing session
        {
          AND: [
            { scheduledStart: { lt: proposedEnd } },
            { scheduledEnd: { gte: proposedEnd } },
          ],
        },
        // Proposed session completely contains existing session
        {
          AND: [
            { scheduledStart: { gte: proposedStart } },
            { scheduledEnd: { lte: proposedEnd } },
          ],
        },
      ],
    },
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
  });

  for (const session of existingSessions) {
    conflicts.push({
      type: 'session',
      id: session.id,
      start: session.scheduledStart,
      end: session.scheduledEnd,
      description: `Session: ${session.subject} (${session.class.name})`,
    });
  }

  return conflicts;
}

// ============================================================================
// CLASS SCHEDULE MANAGEMENT
// ============================================================================

/**
 * Get class schedule (all sessions)
 */
export async function getClassSchedule(
  classId: string,
  startDate?: string,
  endDate?: string
): Promise<SessionSchedule[]> {
  const sessions = await prisma.tutoringSession.findMany({
    where: {
      classId,
      scheduledStart: startDate ? { gte: new Date(startDate) } : undefined,
      scheduledEnd: endDate ? { lte: new Date(endDate) } : undefined,
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    },
    include: {
      tutor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      scheduledStart: 'asc',
    },
  });

  return sessions.map(session => ({
    sessionId: session.id,
    subject: session.subject,
    tutorName: session.tutor 
      ? `${session.tutor.firstName} ${session.tutor.lastName}`
      : 'TBD',
    start: session.scheduledStart,
    end: session.scheduledEnd,
    location: session.location || undefined,
    status: session.status,
  }));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
export function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}
