import { Router, Request, Response, NextFunction } from 'express';
import {
  createGoal,
  getStudentGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  completeGoal,
  getGoalsDashboard,
  getGoalSuggestions,
  CreateGoalData,
  UpdateGoalData,
} from '../services/goals.service';
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
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { subject, title, description, targetScore, deadline, priority } = req.body;

    // Validate required fields
    if (!subject || !title || targetScore === undefined || !deadline) {
      throw new ValidationError('Sujet, titre, score cible et date limite sont requis');
    }

    const goalData: CreateGoalData = {
      subject,
      title,
      description,
      targetScore: parseFloat(targetScore),
      deadline: new Date(deadline),
      priority,
    };

    const goal = await createGoal(req.user.userId, goalData);

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
 * Get all goals for the authenticated student
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { subject, status, priority } = req.query;

    const goals = await getStudentGoals(req.user.userId, {
      subject: subject as string,
      status: status as any,
      priority: priority as any,
    });

    res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/dashboard
 * Get goals dashboard with statistics
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const dashboard = await getGoalsDashboard(req.user.userId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/suggestions
 * Get goal suggestions based on academic results
 */
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const suggestions = await getGoalSuggestions(req.user.userId);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/:id
 * Get a specific goal by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { id } = req.params;
    const goal = await getGoalById(id, req.user.userId);

    res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goals/:id
 * Update a goal
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { id } = req.params;
    const updateData: UpdateGoalData = {};

    // Only include fields that are provided
    if (req.body.subject !== undefined) updateData.subject = req.body.subject;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.targetScore !== undefined) updateData.targetScore = parseFloat(req.body.targetScore);
    if (req.body.currentScore !== undefined) updateData.currentScore = parseFloat(req.body.currentScore);
    if (req.body.deadline !== undefined) updateData.deadline = new Date(req.body.deadline);
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const goal = await updateGoal(id, req.user.userId, updateData);

    res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { id } = req.params;
    await deleteGoal(id, req.user.userId);

    res.json({
      success: true,
      message: 'Objectif supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/goals/:id/complete
 * Mark a goal as completed
 */
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('Utilisateur non authentifié');
    }

    const { id } = req.params;
    const goal = await completeGoal(id, req.user.userId);

    res.json({
      success: true,
      data: goal,
      message: 'Félicitations! Objectif atteint! 🎉',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
