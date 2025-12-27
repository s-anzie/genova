import { maintainSessionWindow, getMaintenanceStats } from '../session-maintenance.service';

describe('Session Maintenance Service', () => {
  describe('maintainSessionWindow', () => {
    it('should complete without errors when no active classes exist', async () => {
      const result = await maintainSessionWindow();

      expect(result).toHaveProperty('classesProcessed');
      expect(result).toHaveProperty('sessionsGenerated');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('duration');
      expect(result.classesProcessed).toBeGreaterThanOrEqual(0);
      expect(result.sessionsGenerated).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should return a valid MaintenanceResult structure', async () => {
      const result = await maintainSessionWindow();

      expect(typeof result.classesProcessed).toBe('number');
      expect(typeof result.sessionsGenerated).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('getMaintenanceStats', () => {
    it('should return maintenance statistics', async () => {
      const stats = await getMaintenanceStats();

      expect(stats).toHaveProperty('activeClasses');
      expect(stats).toHaveProperty('classesWithTimeSlots');
      expect(stats).toHaveProperty('upcomingSessions');
      expect(typeof stats.activeClasses).toBe('number');
      expect(typeof stats.classesWithTimeSlots).toBe('number');
      expect(typeof stats.upcomingSessions).toBe('number');
    });
  });
});
