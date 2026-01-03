import { logger } from '@repo/utils';
import { processExpiredSubscriptions } from './subscription.service';
import { scheduleDailySessionGeneration, stopDailySessionGeneration } from './background-jobs.service';
import { initializeAttendanceSchedulers, cleanupAttendanceSchedulers } from './attendance-scheduler.service';

/**
 * Initialize all cron jobs
 * 
 * This initializes:
 * - Daily session generation job (runs at 2 AM UTC)
 * - Attendance notifications (session started, check-in reminders)
 * - Expired subscription processing (placeholder for future implementation)
 */
export async function initializeCronJobs() {
  logger.info('Initializing cron jobs');
  
  // Initialize daily session generation job
  scheduleDailySessionGeneration();
  
  // Initialize attendance notification schedulers (async)
  await initializeAttendanceSchedulers();
  
  logger.info('All cron jobs initialized');
  logger.info('To process expired subscriptions, call POST /api/subscriptions/process-expired');
}

/**
 * Stop all cron jobs
 */
export async function stopCronJobs() {
  logger.info('Stopping all cron jobs');
  
  // Stop daily session generation job
  stopDailySessionGeneration();
  
  // Cleanup attendance schedulers
  await cleanupAttendanceSchedulers();
  
  logger.info('All cron jobs stopped');
}

/**
 * Manually trigger expired subscription processing
 * This can be called from an API endpoint or external cron job
 */
export async function triggerExpiredSubscriptionProcessing() {
  logger.info('Manually triggering expired subscription processing');
  try {
    const result = await processExpiredSubscriptions();
    logger.info('Expired subscriptions processed', result);
    return result;
  } catch (error) {
    logger.error('Failed to process expired subscriptions', error);
    throw error;
  }
}
