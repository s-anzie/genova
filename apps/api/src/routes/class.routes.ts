import { Router, Request, Response, NextFunction } from 'express';
import {
  createClass,
  getClassById,
  getUserClasses,
  updateClass,
  deleteClass,
  addClassMember,
  removeClassMember,
  generateClassInvitation,
  inviteStudentsByEmail,
  getClassMembers,
  CreateClassData,
  UpdateClassData,
} from '../services/class.service';
import { authenticate } from '../middleware/auth.middleware';
import { requireClassCreationAccess } from '../middleware/subscription.middleware';
import { ValidationError } from '@repo/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/classes
 * Create a new class
 */
router.post('/', requireClassCreationAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { 
      name, 
      description, 
      educationSystemId,
      educationLevelId, 
      educationStreamId,
      levelSubjectIds,
      streamSubjectIds,
      maxStudents, 
      meetingType, 
      meetingLocation,
    } = req.body;

    if (!name || !meetingType) {
      throw new ValidationError('Name and meeting type are required');
    }

    if (!educationSystemId || !educationLevelId) {
      throw new ValidationError('Education system and level are required');
    }

    const hasSubjects = (levelSubjectIds && levelSubjectIds.length > 0) || (streamSubjectIds && streamSubjectIds.length > 0);
    if (!hasSubjects) {
      throw new ValidationError('At least one subject is required');
    }

    const classData: CreateClassData = {
      name,
      description,
      educationSystemId,
      educationLevelId,
      educationStreamId,
      levelSubjectIds,
      streamSubjectIds,
      maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
      meetingType,
      meetingLocation,
    };

    const result = await createClass(req.user.userId, classData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Class created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/classes
 * Get all classes for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const classes = await getUserClasses(req.user.userId);

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/classes/:id
 * Get class details by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const classData = await getClassById(id as string);

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/classes/:id
 * Update class information
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description, maxStudents, meetingLocation, isActive } = req.body;

    const updateData: UpdateClassData = {
      name,
      description,
      maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
      meetingLocation,
      isActive,
    };

    const result = await updateClass(id as string, req.user.userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Class updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/classes/:id
 * Delete (deactivate) a class
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    await deleteClass(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/classes/:id/members
 * Get all members of a class
 */
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const members = await getClassMembers(id as string);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:id/members
 * Add a member to a class
 */
router.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw new ValidationError('Student ID is required');
    }

    const member = await addClassMember(id as string, studentId);

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
 * DELETE /api/classes/:id/members/:studentId
 * Remove a member from a class
 */
router.delete('/:id/members/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id, studentId } = req.params;

    await removeClassMember(id as string, studentId as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:id/invite
 * Generate invitation code or invite by email
 */
router.post('/:id/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { emails } = req.body;

    if (emails && Array.isArray(emails) && emails.length > 0) {
      // Invite by email
      const result = await inviteStudentsByEmail(id as string, emails, req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
        message: `Invited ${result.invited.length} students successfully`,
      });
    } else {
      // Generate invitation code
      const invitation = await generateClassInvitation(id as string, req.user.userId);

      res.status(200).json({
        success: true,
        data: invitation,
        message: 'Invitation code generated successfully',
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
