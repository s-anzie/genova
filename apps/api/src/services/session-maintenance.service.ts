import { PrismaClient } from '@prisma/client';
import { logger } from '@repo/utils';
import { fillSessionGaps } from './session-generator.service';

const prisma = new PrismaClient();

export interface MaintenanceResult {
  classesProcessed: number;
  sessionsGenerated: number;
  errors: Array<{ classId: string; error: string }>;
  duration: number;
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
 * Maintain rolling 4-week session window for all active classes
 * Validates: Requirements 8.2, 8.3
 * 
 * This function:
 * 1. Calculates current date and 4 weeks ahead
 * 2. For each active class, checks for missing sessions
 * 3. Generates sessions for missing weeks
 * 4. Logs generation statistics
 */
export async function maintainSessionWindow(): Promise<MaintenanceResult> {
  const startTime = Date.now();
  
  logger.info('Starting session window maintenance');
  
  // Calculate current date and 4 weeks ahead (Requirement 8.2)
  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  const fourWeeksAhead = new Date(currentWeekStart);
  fourWeeksAhead.setDate(fourWeeksAhead.getDate() + (4 * 7) - 1); // End of 4th week
  fourWeeksAhead.setHours(23, 59, 59, 999);
  
  logger.info('Maintenance window calculated', {
    currentWeekStart: currentWeekStart.toISOString(),
    fourWeeksAhead: fourWeeksAhead.toISOString(),
  });
  
  // Get all active classes with time slots (Requirement 8.2)
  const activeClasses = await prisma.class.findMany({
    where: {
      isActive: true,
    },
    include: {
      timeSlots: {
        where: {
          isActive: true,
        },
      },
    },
  });
  
  logger.info('Found active classes to process', {
    totalClasses: activeClasses.length,
    classesWithTimeSlots: activeClasses.filter(c => c.timeSlots.length > 0).length,
  });
  
  let totalSessionsGenerated = 0;
  const errors: Array<{ classId: string; error: string }> = [];
  
  // Process each active class (Requirement 8.2)
  for (const classData of activeClasses) {
    // Skip classes without time slots
    if (classData.timeSlots.length === 0) {
      logger.debug('Skipping class without time slots', { classId: classData.id });
      continue;
    }
    
    try {
      logger.info('Processing class for session generation', {
        classId: classData.id,
        className: classData.name,
        timeSlotCount: classData.timeSlots.length,
      });
      
      // Check for missing sessions and generate them (Requirement 8.3)
      const generatedSessions = await fillSessionGaps(
        classData.id,
        currentWeekStart,
        fourWeeksAhead
      );
      
      totalSessionsGenerated += generatedSessions.length;
      
      if (generatedSessions.length > 0) {
        logger.info('Generated sessions for class', {
          classId: classData.id,
          className: classData.name,
          sessionsGenerated: generatedSessions.length,
        });
      } else {
        logger.debug('No missing sessions for class', {
          classId: classData.id,
          className: classData.name,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to generate sessions for class', {
        classId: classData.id,
        className: classData.name,
        error: errorMessage,
      });
      
      errors.push({
        classId: classData.id,
        error: errorMessage,
      });
      
      // Continue processing other classes even if one fails
      continue;
    }
  }
  
  const duration = Date.now() - startTime;
  
  // Log generation statistics (Requirement 8.3)
  const result: MaintenanceResult = {
    classesProcessed: activeClasses.length,
    sessionsGenerated: totalSessionsGenerated,
    errors,
    duration,
  };
  
  logger.info('Session window maintenance completed', {
    classesProcessed: result.classesProcessed,
    sessionsGenerated: result.sessionsGenerated,
    errorCount: result.errors.length,
    durationMs: result.duration,
  });
  
  // Alert on failures if they persist (Requirement 8.3)
  if (errors.length > 0) {
    logger.warn('Session generation had errors', {
      errorCount: errors.length,
      errors: errors.map(e => ({ classId: e.classId, error: e.error })),
    });
    
    // In production, this should trigger alerts to administrators
    // For example: send email, Slack notification, PagerDuty alert, etc.
  }
  
  return result;
}

/**
 * Get maintenance statistics for monitoring
 */
export async function getMaintenanceStats(): Promise<{
  activeClasses: number;
  classesWithTimeSlots: number;
  upcomingSessions: number;
}> {
  const now = new Date();
  const fourWeeksAhead = new Date(now);
  fourWeeksAhead.setDate(fourWeeksAhead.getDate() + (4 * 7));
  
  const [activeClasses, classesWithTimeSlots, upcomingSessions] = await Promise.all([
    prisma.class.count({
      where: { isActive: true },
    }),
    prisma.class.count({
      where: {
        isActive: true,
        timeSlots: {
          some: {
            isActive: true,
          },
        },
      },
    }),
    prisma.tutoringSession.count({
      where: {
        scheduledStart: {
          gte: now,
          lte: fourWeeksAhead,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    }),
  ]);
  
  return {
    activeClasses,
    classesWithTimeSlots,
    upcomingSessions,
  };
}
