import { Router, Request, Response, NextFunction } from 'express';
import {
  createAcademicResult,
  getStudentResults,
  getSubjectProgress,
  getProgressDashboard,
  getProgressVisualizationData,
  updateAcademicResult,
  deleteAcademicResult,
  getStudentSubjects,
  CreateAcademicResultData,
} from '../services/progress.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/progress/results
 * Create a new academic result
 */
router.post('/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { levelSubjectId, streamSubjectId, examName, score, maxScore, examDate } = req.body;

    // Validate required fields
    if ((!levelSubjectId && !streamSubjectId) || !examName || score === undefined || maxScore === undefined || !examDate) {
      throw new ValidationError('Either levelSubjectId or streamSubjectId, exam name, score, max score, and exam date are required');
    }

    const resultData: CreateAcademicResultData = {
      levelSubjectId,
      streamSubjectId,
      examName,
      score: parseFloat(score),
      maxScore: parseFloat(maxScore),
      examDate: new Date(examDate),
    };

    const result = await createAcademicResult(req.user.userId, resultData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Academic result added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/results
 * Get all academic results for the authenticated student
 */
router.get('/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { subject, startDate, endDate } = req.query;

    const filters: any = {};
    if (subject) {
      filters.subject = subject as string;
    }
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const results = await getStudentResults(req.user.userId, filters);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/progress/results/:id
 * Update an academic result
 */
router.put('/results/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { levelSubjectId, examName, score, maxScore, examDate } = req.body;

    const updateData: Partial<CreateAcademicResultData> = {};

    if (levelSubjectId !== undefined) {
      updateData.levelSubjectId = levelSubjectId;
    }
    if (examName !== undefined) {
      updateData.examName = examName;
    }
    if (score !== undefined) {
      updateData.score = parseFloat(score);
    }
    if (maxScore !== undefined) {
      updateData.maxScore = parseFloat(maxScore);
    }
    if (examDate !== undefined) {
      updateData.examDate = new Date(examDate);
    }

    const result = await updateAcademicResult(id as string, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Academic result updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/progress/results/:id
 * Delete an academic result
 */
router.delete('/results/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    await deleteAcademicResult(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Academic result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/subjects
 * Get all subjects for the authenticated student
 */
router.get('/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const subjects = await getStudentSubjects(req.user.userId);

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/subject/:subject
 * Get progress data for a specific subject
 */
router.get('/subject/:subject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { subject } = req.params;

    const progress = await getSubjectProgress(req.user.userId, subject as string);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/dashboard
 * Get progress dashboard for the authenticated student
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const dashboard = await getProgressDashboard(req.user.userId);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/visualization
 * Get visualization data for progress charts
 */
router.get('/visualization', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { subject } = req.query;

    const data = await getProgressVisualizationData(
      req.user.userId,
      subject as string | undefined
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
