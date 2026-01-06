import { Router, Request, Response, NextFunction } from 'express';
import {
  createLearningGoal,
  getStudentGoals,
  getLearningGoalById,
  updateLearningGoal,
  deleteLearningGoal,
  getGoalProgress,
  getGoalStatistics,
  CreateLearningGoalData,
  UpdateLearningGoalData,
} from '../services/goal.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/goals
 * Create a new learning goal
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { classId, levelSubjectId, title, description, targetScore, deadline } = req.body;

    // Validate required fields
    if (!levelSubjectId || !title || targetScore === undefined || !deadline) {
      throw new ValidationError('levelSubjectId, title, target score, and deadline are required');
    }

    const goalData: CreateLearningGoalData = {
      classId,
      levelSubjectId,
      title,
      description,
      targetScore: parseFloat(targetScore),
      deadline: new Date(deadline),
    };

    const goal = await createLearningGoal(req.user.userId, goalData);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals
 * Get all learning goals for the authenticated student
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { levelSubjectId, isCompleted, includeOverdue } = req.query;

    const filters: any = {};
    if (levelSubjectId) filters.levelSubjectId = levelSubjectId as string;
    if (isCompleted !== undefined) filters.isCompleted = isCompleted === 'true';
    if (includeOverdue !== undefined) filters.includeOverdue = includeOverdue === 'true';

    const goals = await getStudentGoals(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/statistics
 * Get goal statistics for the authenticated student
 */
router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const statistics = await getGoalStatistics(req.user.userId);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/:id
 * Get a specific learning goal
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Goal ID is required');
    }

    const goal = await getLearningGoalById(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/:id/progress
 * Get progress for a specific learning goal
 */
router.get('/:id/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Goal ID is required');
    }

    const progress = await getGoalProgress(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goals/:id
 * Update a learning goal
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Goal ID is required');
    }

    const { title, description, targetScore, currentScore, deadline, isCompleted } = req.body;

    const updateData: UpdateLearningGoalData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetScore !== undefined) updateData.targetScore = parseFloat(targetScore);
    if (currentScore !== undefined) updateData.currentScore = parseFloat(currentScore);
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const goal = await updateLearningGoal(id, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a learning goal
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Goal ID is required');
    }

    await deleteLearningGoal(id, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Learning goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
