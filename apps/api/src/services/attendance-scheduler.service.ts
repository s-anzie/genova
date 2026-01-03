import { PrismaClient } from '@prisma/client';
import { 
  notifyTutorSessionStarted, 
  notifyStudentsCheckIn,
  markAbsentStudents,
  processSessionPayments
} from './attendance.service';
import { createNotification } from './notification.service';
import { logger } from '@repo/utils';

const prisma = new PrismaClient();

/**
 * Check for sessions that just started and send notifications to tutors
 * Run this every minute
 */
export async function checkSessionsStarted(): Promise<void> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Find sessions that started in the last minute
    const sessions = await prisma.tutoringSession.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledStart: {
          gte: oneMinuteAgo,
          lte: now,
        },
      },
    });

    for (const session of sessions) {
      await notifyTutorSessionStarted(session.id);
      logger.info(`Sent session started notification for session ${session.id}`);
    }
  } catch (error) {
    logger.error('Error checking sessions started:', error);
  }
}

/**
 * Check for sessions that started 5 minutes ago and send check-in reminders to students
 * Run this every minute
 */
export async function checkStudentCheckInReminders(): Promise<void> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);

    // Find sessions that started 5 minutes ago
    const sessions = await prisma.tutoringSession.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledStart: {
          gte: sixMinutesAgo,
          lte: fiveMinutesAgo,
        },
      },
    });

    for (const session of sessions) {
      await notifyStudentsCheckIn(session.id);
      logger.info(`Sent check-in reminders for session ${session.id}`);
    }
  } catch (error) {
    logger.error('Error checking student check-in reminders:', error);
  }
}

/**
 * Check for sessions that ended more than 20 minutes ago and auto-complete them
 * This ensures payments are released even if tutor forgets to check out
 * Run this every 5 minutes
 */
export async function autoCompleteOverdueSessions(): Promise<void> {
  try {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

    // Find confirmed sessions that ended more than 20 minutes ago
    const sessions = await prisma.tutoringSession.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledEnd: {
          lte: twentyMinutesAgo,
        },
      },
      include: {
        tutor: true,
      },
    });

    for (const session of sessions) {
      try {
        // Mark absent students who didn't check in
        await markAbsentStudents(session.id);

        // Mark session as completed
        await prisma.tutoringSession.update({
          where: { id: session.id },
          data: {
            actualStart: session.actualStart || session.scheduledStart,
            actualEnd: session.scheduledEnd,
            status: 'COMPLETED',
          },
        });

        // Process payments based on attendance
        await processSessionPayments(session.id);
        
        // Notify tutor about auto-completion
        if (session.tutorId) {
          await createNotification({
            userId: session.tutorId,
            title: 'Session clôturée automatiquement',
            message: `Votre session de ${session.subject} a été clôturée automatiquement 20 minutes après sa fin. Les paiements ont été traités.`,
            type: 'SESSION_AUTO_COMPLETED',
            data: {
              sessionId: session.id,
              action: 'VIEW_SESSION',
            },
          });
        }
        
        logger.info(`Auto-completed overdue session ${session.id}`);
      } catch (error) {
        logger.error(`Error auto-completing session ${session.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error checking overdue sessions:', error);
  }
}

/**
 * Initialize all schedulers
 * Call this when the server starts
 */
export async function initializeAttendanceSchedulers(): Promise<void> {
  // Ensure Prisma is connected before starting schedulers with retry logic
  const maxRetries = 3;
  let retryCount = 0;
  let connected = false;

  while (retryCount < maxRetries && !connected) {
    try {
      await prisma.$connect();
      logger.info('Prisma client connected successfully');
      connected = true;
    } catch (error) {
      retryCount++;
      logger.error(`Failed to connect Prisma client (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        const delay = retryCount * 2000; // Exponential backoff: 2s, 4s, 6s
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (!connected) {
    logger.error('Failed to connect to database after multiple attempts. Attendance schedulers will not be initialized.');
    logger.info('The server will continue running, but attendance notifications will not work until database connection is restored.');
    return;
  }

  // Check for sessions that just started every minute
  setInterval(checkSessionsStarted, 60 * 1000);
  logger.info('Attendance scheduler: Session started notifications enabled');

  // Check for check-in reminders every minute
  setInterval(checkStudentCheckInReminders, 60 * 1000);
  logger.info('Attendance scheduler: Check-in reminder notifications enabled');

  // Check for overdue sessions every 5 minutes
  setInterval(autoCompleteOverdueSessions, 5 * 60 * 1000);
  logger.info('Attendance scheduler: Auto-complete overdue sessions enabled (20 min grace period)');

  // Run immediately on startup with a small delay to ensure database is ready
  setTimeout(() => {
    checkSessionsStarted();
    checkStudentCheckInReminders();
    autoCompleteOverdueSessions();
  }, 2000); // 2 second delay
}

/**
 * Cleanup function to disconnect Prisma client
 */
export async function cleanupAttendanceSchedulers(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting Prisma client:', error);
  }
}
