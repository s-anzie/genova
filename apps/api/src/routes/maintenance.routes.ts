import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { triggerSessionMaintenance } from '../services/background-jobs.service';
import { maintainSessionWindow, getMaintenanceStats } from '../services/session-maintenance.service';
import { logger } from '@repo/utils';

const router = Router();

/**
 * POST /api/maintenance/generate-sessions
 * Manually trigger session generation for all active classes
 * Admin only
 */
router.post(
  '/generate-sessions',
  authenticate,
  authorize('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Manual session generation triggered by admin');
      
      const result = await triggerSessionMaintenance();
      
      res.json({
        success: true,
        message: 'Session generation completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/maintenance/stats
 * Get maintenance statistics
 * Admin only
 */
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getMaintenanceStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
