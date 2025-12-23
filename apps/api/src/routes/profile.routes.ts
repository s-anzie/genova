import { Router, Request, Response, NextFunction } from 'express';
import { 
  createStudentProfile,
  createTutorProfile,
  getStudentProfile,
  getTutorProfile,
  updateStudentProfile,
  updateTutorProfile,
  updateUser,
  updateUserAvatar,
  uploadVerificationDocuments,
  getUserById,
  CreateStudentProfileData,
  CreateTutorProfileData,
  UpdateStudentProfileData,
  UpdateTutorProfileData,
  UpdateUserData,
} from '../services/profile.service';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError, AuthorizationError } from '@repo/utils';

const router = Router();

/**
 * POST /api/profiles/student
 * Create a student profile
 */
router.post('/student', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const data: CreateStudentProfileData = {
      userId,
      educationLevel: req.body.educationLevel,
      schoolName: req.body.schoolName,
      parentEmail: req.body.parentEmail,
      parentPhone: req.body.parentPhone,
      learningGoals: req.body.learningGoals,
      preferredSubjects: req.body.preferredSubjects,
      budgetPerHour: req.body.budgetPerHour,
    };

    if (!data.educationLevel) {
      throw new ValidationError('Education level is required', 'educationLevel');
    }

    const profile = await createStudentProfile(data);

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Student profile created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profiles/tutor
 * Create a tutor profile
 */
router.post('/tutor', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const data: CreateTutorProfileData = {
      userId,
      bio: req.body.bio,
      experienceYears: req.body.experienceYears,
      hourlyRate: req.body.hourlyRate,
      subjects: req.body.subjects,
      educationLevels: req.body.educationLevels,
      languages: req.body.languages,
      teachingMode: req.body.teachingMode,
      serviceRadius: req.body.serviceRadius,
      diplomas: req.body.diplomas,
      availability: req.body.availability,
    };

    if (!data.hourlyRate) {
      throw new ValidationError('Hourly rate is required', 'hourlyRate');
    }

    const profile = await createTutorProfile(data);

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Tutor profile created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/student/:userId
 * Get student profile by user ID
 */
router.get('/student/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    const profile = await getStudentProfile(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/tutor/:userId
 * Get tutor profile by user ID
 */
router.get('/tutor/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    const profile = await getTutorProfile(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profiles/student
 * Update student profile
 */
router.put('/student', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const data: UpdateStudentProfileData = {
      educationLevel: req.body.educationLevel,
      educationDetails: req.body.educationDetails,
      schoolName: req.body.schoolName,
      parentEmail: req.body.parentEmail,
      parentPhone: req.body.parentPhone,
      learningGoals: req.body.learningGoals,
      preferredSubjects: req.body.preferredSubjects,
      budgetPerHour: req.body.budgetPerHour,
    };

    const profile = await updateStudentProfile(userId, data);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Student profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profiles/tutor
 * Update tutor profile
 */
router.put('/tutor', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const data: UpdateTutorProfileData = {
      bio: req.body.bio,
      experienceYears: req.body.experienceYears,
      hourlyRate: req.body.hourlyRate,
      subjects: req.body.subjects,
      educationLevels: req.body.educationLevels,
      languages: req.body.languages,
      teachingMode: req.body.teachingMode,
      serviceRadius: req.body.serviceRadius,
      diplomas: req.body.diplomas,
      availability: req.body.availability,
      teachingSkillsDetails: req.body.teachingSkillsDetails,
    };

    const profile = await updateTutorProfile(userId, data);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Tutor profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profiles/me
 * Update current user's basic information
 */
router.put('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    const data: UpdateUserData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode,
      country: req.body.country,
      preferredLanguage: req.body.preferredLanguage,
    };

    const user = await updateUser(userId, data);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User information updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profiles/me/avatar
 * Update user avatar (placeholder - actual file upload would use multipart/form-data)
 */
router.post('/me/avatar', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      throw new ValidationError('Avatar URL is required', 'avatarUrl');
    }

    const user = await updateUserAvatar(userId, avatarUrl);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profiles/tutor/documents
 * Upload verification documents for tutor
 */
router.post('/tutor/documents', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { documentUrls } = req.body;

    if (!documentUrls || !Array.isArray(documentUrls)) {
      throw new ValidationError('Document URLs array is required', 'documentUrls');
    }

    const profile = await uploadVerificationDocuments(userId, documentUrls);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Verification documents uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/user/:userId
 * Get public user information by ID
 */
router.get('/user/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    const user = await getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
