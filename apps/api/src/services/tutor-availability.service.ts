import { PrismaClient, TutorAvailability } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
  logger
} from '@repo/utils';

const prisma = new PrismaClient();

/**
 * Data structure for creating recurring availability
 */
export interface RecurringAvailabilityData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

/**
 * Data structure for creating one-time availability
 */
export interface OneTimeAvailabilityData {
  specificDate: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

/**
 * Validate time format (HH:MM)
 */
function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

/**
 * Validate that start time is before end time
 */
function validateTimeRange(startTime: string, endTime: string): boolean {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = (startHours || 0) * 60 + (startMinutes || 0);
  const endTotalMinutes = (endHours || 0) * 60 + (endMinutes || 0);
  
  return startTotalMinutes < endTotalMinutes;
}

/**
 * Create recurring weekly availability for a tutor
 * Validates: Requirements 2.1, 2.2
 */
export async function createRecurringAvailability(
  tutorId: string,
  data: RecurringAvailabilityData
): Promise<TutorAvailability> {
  // Validate inputs
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new ValidationError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
  }

  if (!validateTimeFormat(data.startTime)) {
    throw new ValidationError('startTime must be in HH:MM format');
  }

  if (!validateTimeFormat(data.endTime)) {
    throw new ValidationError('endTime must be in HH:MM format');
  }

  if (!validateTimeRange(data.startTime, data.endTime)) {
    throw new ValidationError('startTime must be before endTime');
  }

  // Verify tutor exists
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
  });

  if (!tutor) {
    throw new NotFoundError('Tutor not found');
  }

  if (tutor.role !== 'TUTOR') {
    throw new ValidationError('User is not a tutor');
  }

  // Create recurring availability
  const availability = await prisma.tutorAvailability.create({
    data: {
      tutorId,
      dayOfWeek: data.dayOfWeek,
      specificDate: null,
      startTime: data.startTime,
      endTime: data.endTime,
      isRecurring: true,
      isActive: true,
    },
  });

  logger.info('Created recurring availability', {
    availabilityId: availability.id,
    tutorId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
  });

  return availability;
}

/**
 * Create one-time availability for a tutor on a specific date
 * Validates: Requirements 3.1, 3.2
 */
export async function createOneTimeAvailability(
  tutorId: string,
  data: OneTimeAvailabilityData
): Promise<TutorAvailability> {
  // Validate inputs
  if (!validateTimeFormat(data.startTime)) {
    throw new ValidationError('startTime must be in HH:MM format');
  }

  if (!validateTimeFormat(data.endTime)) {
    throw new ValidationError('endTime must be in HH:MM format');
  }

  if (!validateTimeRange(data.startTime, data.endTime)) {
    throw new ValidationError('startTime must be before endTime');
  }

  if (!(data.specificDate instanceof Date) || isNaN(data.specificDate.getTime())) {
    throw new ValidationError('specificDate must be a valid date');
  }

  // Verify tutor exists
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
  });

  if (!tutor) {
    throw new NotFoundError('Tutor not found');
  }

  if (tutor.role !== 'TUTOR') {
    throw new ValidationError('User is not a tutor');
  }

  // Normalize the date to start of day
  const normalizedDate = new Date(data.specificDate);
  normalizedDate.setHours(0, 0, 0, 0);

  // Create one-time availability
  const availability = await prisma.tutorAvailability.create({
    data: {
      tutorId,
      dayOfWeek: null,
      specificDate: normalizedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      isRecurring: false,
      isActive: true,
    },
  });

  logger.info('Created one-time availability', {
    availabilityId: availability.id,
    tutorId,
    specificDate: normalizedDate.toISOString(),
    startTime: data.startTime,
    endTime: data.endTime,
  });

  return availability;
}

/**
 * Get all availability entries for a tutor
 * Validates: Requirements 2.4, 3.4
 */
export async function getTutorAvailability(
  tutorId: string
): Promise<TutorAvailability[]> {
  const availability = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      isActive: true,
    },
    orderBy: [
      { isRecurring: 'desc' }, // Recurring first
      { dayOfWeek: 'asc' },
      { specificDate: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return availability;
}

/**
 * Delete (deactivate) an availability entry
 * Validates: Requirements 2.5, 3.5
 */
export async function deleteAvailability(
  availabilityId: string,
  tutorId: string
): Promise<void> {
  // Verify the availability exists and belongs to the tutor
  const availability = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!availability) {
    throw new NotFoundError('Availability not found');
  }

  if (availability.tutorId !== tutorId) {
    throw new ValidationError('Availability does not belong to this tutor');
  }

  // Soft delete by setting isActive to false
  await prisma.tutorAvailability.update({
    where: { id: availabilityId },
    data: { isActive: false },
  });

  logger.info('Deleted availability', {
    availabilityId,
    tutorId,
  });
}

/**
 * Check if a tutor is available at a specific date and time
 * Validates: Requirements 2.3, 3.3
 * 
 * This function checks both recurring and one-time availability.
 * One-time availability takes priority over recurring patterns for the same time period.
 * 
 * @param tutorId - The tutor's ID
 * @param dateTime - The date and time to check
 * @param duration - Duration in hours
 * @returns true if tutor is available, false otherwise
 */
export async function checkAvailability(
  tutorId: string,
  dateTime: Date,
  duration: number
): Promise<boolean> {
  if (!(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
    throw new ValidationError('dateTime must be a valid date');
  }

  if (duration <= 0) {
    throw new ValidationError('duration must be greater than 0');
  }

  // Extract date components
  const dayOfWeek = dateTime.getDay(); // 0-6
  const normalizedDate = new Date(dateTime);
  normalizedDate.setHours(0, 0, 0, 0);

  // Extract time components
  const startHours = dateTime.getHours();
  const startMinutes = dateTime.getMinutes();
  const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;

  // Calculate end time
  const endDateTime = new Date(dateTime.getTime() + duration * 60 * 60 * 1000);
  const endHours = endDateTime.getHours();
  const endMinutes = endDateTime.getMinutes();
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

  // First, check for one-time availability on this specific date
  const oneTimeAvailability = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      isRecurring: false,
      specificDate: normalizedDate,
      isActive: true,
    },
  });

  // If one-time availability exists for this date, check if it covers the time range
  if (oneTimeAvailability.length > 0) {
    const hasOneTimeMatch = oneTimeAvailability.some(avail => 
      timeRangeOverlaps(startTime, endTime, avail.startTime, avail.endTime)
    );

    // One-time availability takes priority
    // If we found a match, return true
    // If we found one-time entries but no match, return false (one-time overrides recurring)
    return hasOneTimeMatch;
  }

  // No one-time availability for this date, check recurring availability
  const recurringAvailability = await prisma.tutorAvailability.findMany({
    where: {
      tutorId,
      isRecurring: true,
      dayOfWeek,
      isActive: true,
    },
  });

  // Check if any recurring availability covers the time range
  const hasRecurringMatch = recurringAvailability.some(avail =>
    timeRangeOverlaps(startTime, endTime, avail.startTime, avail.endTime)
  );

  return hasRecurringMatch;
}

/**
 * Helper function to check if two time ranges overlap
 * Returns true if the requested time range (requestStart-requestEnd) 
 * is fully covered by the availability time range (availStart-availEnd)
 */
function timeRangeOverlaps(
  requestStart: string,
  requestEnd: string,
  availStart: string,
  availEnd: string
): boolean {
  const [reqStartHours, reqStartMinutes] = requestStart.split(':').map(Number);
  const [reqEndHours, reqEndMinutes] = requestEnd.split(':').map(Number);
  const [availStartHours, availStartMinutes] = availStart.split(':').map(Number);
  const [availEndHours, availEndMinutes] = availEnd.split(':').map(Number);

  const reqStartTotal = (reqStartHours || 0) * 60 + (reqStartMinutes || 0);
  const reqEndTotal = (reqEndHours || 0) * 60 + (reqEndMinutes || 0);
  const availStartTotal = (availStartHours || 0) * 60 + (availStartMinutes || 0);
  const availEndTotal = (availEndHours || 0) * 60 + (availEndMinutes || 0);

  // Check if the requested time range is fully covered by the availability
  return reqStartTotal >= availStartTotal && reqEndTotal <= availEndTotal;
}
