import { 
  scheduleDailySessionGeneration, 
  stopDailySessionGeneration,
  isDailySessionGenerationRunning,
  triggerSessionMaintenance
} from '../background-jobs.service';
import * as sessionMaintenanceService from '../session-maintenance.service';

// Mock the session maintenance service
jest.mock('../session-maintenance.service');

describe('Background Jobs Service', () => {
  beforeEach(() => {
    // Stop any running jobs before each test
    stopDailySessionGeneration();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    stopDailySessionGeneration();
  });

  describe('scheduleDailySessionGeneration', () => {
    it('should schedule the daily session generation job', () => {
      scheduleDailySessionGeneration();
      
      expect(isDailySessionGenerationRunning()).toBe(true);
    });

    it('should stop existing job before scheduling a new one', () => {
      scheduleDailySessionGeneration();
      expect(isDailySessionGenerationRunning()).toBe(true);
      
      scheduleDailySessionGeneration();
      expect(isDailySessionGenerationRunning()).toBe(true);
    });
  });

  describe('stopDailySessionGeneration', () => {
    it('should stop the daily session generation job', () => {
      scheduleDailySessionGeneration();
      expect(isDailySessionGenerationRunning()).toBe(true);
      
      stopDailySessionGeneration();
      expect(isDailySessionGenerationRunning()).toBe(false);
    });

    it('should handle stopping when no job is running', () => {
      expect(isDailySessionGenerationRunning()).toBe(false);
      
      stopDailySessionGeneration();
      expect(isDailySessionGenerationRunning()).toBe(false);
    });
  });

  describe('triggerSessionMaintenance', () => {
    it('should manually trigger session maintenance', async () => {
      const mockResult = {
        classesProcessed: 5,
        sessionsGenerated: 20,
        errors: [],
        duration: 1000,
      };

      (sessionMaintenanceService.maintainSessionWindow as jest.Mock).mockResolvedValue(mockResult);

      const result = await triggerSessionMaintenance();

      expect(result).toEqual(mockResult);
      expect(sessionMaintenanceService.maintainSessionWindow).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from session maintenance', async () => {
      const mockError = new Error('Maintenance failed');
      (sessionMaintenanceService.maintainSessionWindow as jest.Mock).mockRejectedValue(mockError);

      await expect(triggerSessionMaintenance()).rejects.toThrow('Maintenance failed');
    });
  });
});
