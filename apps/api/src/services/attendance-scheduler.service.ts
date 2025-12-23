import { PrismaClient } from '@prisma/client';
import { markAbsentStudents } from './attendance.service';
import { logger } from '@repo/utils';

const prisma = new PrismaClient();

/**
 * Process sessions that have ended and mark absent students
 * This should be run periodically (e.g., every 5 minutes)
 */
export async function processEndedSessions(): Promise<void> {
  try {
    const now = new Date();

    // Find confirmed sessions that have ended but haven't been processed
    const endedSessions = await prisma.tutoringSession.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledEnd: {
          lt: now,
        },
      },
      include: {
        attendances: true,
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

    logger.info(`Found ${endedSessions.length} ended sessions to process`);

    for (const session of endedSessions) {
      try {
        // Check if all class members have attendance records
        const classMembers = session.class.members.map(m => m.studentId);
        const studentsWithAttendance = session.attendances.map(a => a.studentId);
        const missingAttendance = classMembers.filter(
          studentId => !studentsWithAttendance.includes(studentId)
        );

        if (missingAttendance.length > 0) {
          logger.info(
            `Marking ${missingAttendance.length} students as absent for session ${session.id}`
          );
          await markAbsentStudents(session.id);
        }

        // Update session status to COMPLETED if not already
        if (session.status === 'CONFIRMED') {
          await prisma.tutoringSession.update({
            where: { id: session.id },
            data: { status: 'COMPLETED' },
          });
          logger.info(`Updated session ${session.id} status to COMPLETED`);
        }
      } catch (error) {
        logger.error(`Error processing session ${session.id}:`, error);
        // Continue processing other sessions
      }
    }

    logger.info('Finished processing ended sessions');
  } catch (error) {
    logger.error('Error in processEndedSessions:', error);
    throw error;
  }
}

/**
 * Start the attendance scheduler
 * Runs every 5 minutes to process ended sessions
 */
export function startAttendanceScheduler(): NodeJS.Timeout {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  logger.info('Starting attendance scheduler');

  // Run immediately on startup
  processEndedSessions().catch(error => {
    logger.error('Error in initial attendance processing:', error);
  });

  // Then run every 5 minutes
  const intervalId = setInterval(() => {
    processEndedSessions().catch(error => {
      logger.error('Error in scheduled attendance processing:', error);
    });
  }, INTERVAL_MS);

  return intervalId;
}

/**
 * Stop the attendance scheduler
 */
export function stopAttendanceScheduler(intervalId: NodeJS.Timeout): void {
  logger.info('Stopping attendance scheduler');
  clearInterval(intervalId);
}
