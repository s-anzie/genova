import { Router, Request, Response, NextFunction } from 'express';
import {
  createConsortium,
  getConsortiumById,
  getTutorConsortiums,
  updateConsortium,
  deleteConsortium,
  addConsortiumMember,
  removeConsortiumMember,
  updateRevenuePolicy,
  inviteTutorsByEmail,
  getConsortiumMembers,
  CreateConsortiumData,
  UpdateConsortiumData,
  RevenueDistributionPolicy,
} from '../services/consortium.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/consortiums
 * Create a new consortium
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { name, description, revenueDistributionPolicy } = req.body;

    // Validate required fields
    if (!name || !revenueDistributionPolicy) {
      throw new ValidationError('Name and revenue distribution policy are required');
    }

    const consortiumData: CreateConsortiumData = {
      name,
      description,
      revenueDistributionPolicy,
    };

    const result = await createConsortium(req.user.userId, consortiumData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Consortium created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/consortiums
 * Get all consortiums for the authenticated tutor
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const consortiums = await getTutorConsortiums(req.user.userId);

    res.status(200).json({
      success: true,
      data: consortiums,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/consortiums/:id
 * Get consortium details by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const consortium = await getConsortiumById(id as string);

    res.status(200).json({
      success: true,
      data: consortium,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/consortiums/:id
 * Update consortium information
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const updateData: UpdateConsortiumData = {
      name,
      description,
      isActive,
    };

    const result = await updateConsortium(id as string, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Consortium updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/consortiums/:id
 * Delete (deactivate) a consortium
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    await deleteConsortium(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Consortium deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/consortiums/:id/members
 * Get all members of a consortium
 */
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const members = await getConsortiumMembers(id as string);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/consortiums/:id/members
 * Add a member to a consortium
 */
router.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { tutorId } = req.body;

    if (!tutorId) {
      throw new ValidationError('Tutor ID is required');
    }

    const member = await addConsortiumMember(id as string, tutorId, req.user.userId);

    res.status(201).json({
      success: true,
      data: member,
      message: 'Member added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/consortiums/:id/members/:tutorId
 * Remove a member from a consortium
 */
router.delete('/:id/members/:tutorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id, tutorId } = req.params;

    await removeConsortiumMember(id as string, tutorId as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/consortiums/:id/policy
 * Update revenue distribution policy
 */
router.put('/:id/policy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { revenueDistributionPolicy } = req.body;

    if (!revenueDistributionPolicy) {
      throw new ValidationError('Revenue distribution policy is required');
    }

    const result = await updateRevenuePolicy(
      id as string,
      req.user.userId,
      revenueDistributionPolicy as RevenueDistributionPolicy
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Revenue policy updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/consortiums/:id/invite
 * Invite tutors by email
 */
router.post('/:id/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new ValidationError('Emails array is required');
    }

    const result = await inviteTutorsByEmail(id as string, emails, req.user.userId);

    res.status(200).json({
      success: true,
      data: result,
      message: `Invited ${result.invited.length} tutors successfully`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
