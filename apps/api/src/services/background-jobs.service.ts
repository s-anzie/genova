import * as cron from 'node-cron';
import { logger } from '@repo/utils';
import { maintainSessionWindow } from './session-maintenance.service';

let dailySessionGenerationJob: cron.ScheduledTask | null = null;

/**
 * Schedule daily session generation job
 * Runs daily at 2 AM to maintain rolling 4-week session window
 * Validates: Requirements 8.1, 8.2
 */
export function scheduleDailySessionGeneration(): void {
  // Stop existing job if running
  if (dailySessionGenerationJob) {
    dailySessionGenerationJob.stop();
    logger.info('Stopped existing daily session generation job');
  }

  // Schedule job to run daily at 2 AM
  // Cron format: minute hour day month dayOfWeek
  // '0 2 * * *' = At 02:00 every day
  dailySessionGenerationJob = cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled daily session generation job');
    
    try {
      const result = await maintainSessionWindow();
      
      logger.info('Daily session generation job completed successfully', {
        classesProcessed: result.classesProcessed,
        sessionsGenerated: result.sessionsGenerated,
        errors: result.errors.length,
        duration: result.duration,
      });
    } catch (error) {
      logger.error('Daily session generation job failed', error);
      // In production, this should trigger alerts to administrators
    }
  });

  logger.info('Daily session generation job scheduled (runs at 2 AM UTC)');
}

/**
 * Stop the daily session generation job
 */
export function stopDailySessionGeneration(): void {
  if (dailySessionGenerationJob) {
    dailySessionGenerationJob.stop();
    dailySessionGenerationJob = null;
    logger.info('Daily session generation job stopped');
  }
}

/**
 * Check if the daily session generation job is running
 */
export function isDailySessionGenerationRunning(): boolean {
  return dailySessionGenerationJob !== null;
}

/**
 * Manually trigger session window maintenance
 * Useful for testing or manual intervention
 */
export async function triggerSessionMaintenance() {
  logger.info('Manually triggering session window maintenance');
  
  try {
    const result = await maintainSessionWindow();
    
    logger.info('Manual session maintenance completed', {
      classesProcessed: result.classesProcessed,
      sessionsGenerated: result.sessionsGenerated,
      errors: result.errors.length,
      duration: result.duration,
    });
    
    return result;
  } catch (error) {
    logger.error('Manual session maintenance failed', error);
    throw error;
  }
}
