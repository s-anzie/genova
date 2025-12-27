import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, RequestStatus } from '@prisma/client';
import {
  getAvailableTutors,
  createRequest,
  acceptRequest,
  declineRequest,
  getTutorRequests,
} from '../services/student-assignment-request.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError, NotFoundError } from '@repo/utils';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/sessions/:sessionId/available-tutors
 * Get available tutors for an unassigned session
 * Validates: Requirements 14.1
 */
router.get('/sessions/:sessionId/available-tutors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const tutors = await getAvailableTutors(sessionId);

    res.status(200).json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/:sessionId/request-tutor
 * Create assignment request for a specific tutor
 * Validates: Requirements 14.1
 */
router.post('/sessions/:sessionId/request-tutor', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { sessionId } = req.params;
    const { tutorId, message } = req.body;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    if (!tutorId) {
      throw new ValidationError('Tutor ID is required');
    }

    const request = await createRequest(
      sessionId,
      req.user.userId,
      tutorId,
      message
    );

    res.status(201).json({
      success: true,
      data: request,
      message: 'Tutor assignment request created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/assignment-requests/:requestId/accept
 * Accept a tutor assignment request (tutor only)
 * Validates: Requirements 14.1
 */
router.post('/assignment-requests/:requestId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { requestId } = req.params;

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    const session = await acceptRequest(requestId, req.user.userId);

    res.status(200).json({
      success: true,
      data: session,
      message: 'Assignment request accepted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/assignment-requests/:requestId/decline
 * Decline a tutor assignment request (tutor only)
 * Validates: Requirements 14.1
 */
router.post('/assignment-requests/:requestId/decline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    await declineRequest(requestId, req.user.userId, reason);

    res.status(200).json({
      success: true,
      message: 'Assignment request declined successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tutors/assignment-requests
 * Get all assignment requests for the authenticated tutor
 * Validates: Requirements 14.1
 */
router.get('/tutors/assignment-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { status } = req.query;

    // Validate status if provided
    let requestStatus: RequestStatus | undefined;
    if (status) {
      const validStatuses = Object.values(RequestStatus);
      if (!validStatuses.includes(status as RequestStatus)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      requestStatus = status as RequestStatus;
    }

    const requests = await getTutorRequests(req.user.userId, requestStatus);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
