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
import { ValidationError } from '@repo/utils';
import {
  convertLegacyEducationLevel,
  convertLegacyLanguages,
  getTeachingLevelSubjectsFromLegacy,
  parseExperienceYears,
} from '../services/legacy-conversion.service';
import { prisma } from '../lib/prisma';
import { convertLegacySubjects } from '../services/legacy-conversion.service';
const router = Router();

/**
 * POST /api/profiles/student
 * Create or update a student profile (with backward compatibility)
 */
router.post('/student', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    let data: CreateStudentProfileData;

    // Check if using new format or legacy format
    if (req.body.educationLevelId) {
      // New format
      console.log('📱 Student profile: Using new format');
      data = {
        userId,
        educationSystemId: req.body.educationSystemId,
        educationLevelId: req.body.educationLevelId,
        educationStreamId: req.body.educationStreamId,
        schoolName: req.body.schoolName,
        parentEmail: req.body.parentEmail,
        parentPhone: req.body.parentPhone,
        budgetPerHour: req.body.budgetPerHour,
        preferredLevelSubjectIds: req.body.preferredLevelSubjectIds || [],
      };
    } else {
      // Legacy format - convert to new format
      console.log('📱 Student profile: Converting from legacy format');
      console.log('Legacy data:', {
        educationLevel: req.body.educationLevel,
        educationDetails: req.body.educationDetails,
        preferredSubjects: req.body.preferredSubjects,
      });

      const educationDetails = req.body.educationDetails || {};
      const { educationSystemId, educationLevelId, educationStreamId } = 
        await convertLegacyEducationLevel(
          req.body.educationLevel,
          educationDetails.system
        );

      console.log('Converted education:', { educationSystemId, educationLevelId, educationStreamId });

      // Convert preferred subjects if provided
      let preferredLevelSubjectIds: string[] = [];
      if (req.body.preferredSubjects && req.body.preferredSubjects.length > 0) {
        preferredLevelSubjectIds = await convertLegacySubjects(
          req.body.preferredSubjects,
          educationLevelId
        );
        console.log(`Converted ${req.body.preferredSubjects.length} subjects to ${preferredLevelSubjectIds.length} level subjects`);
      }

      data = {
        userId,
        educationSystemId,
        educationLevelId,
        educationStreamId,
        schoolName: req.body.schoolName,
        parentEmail: req.body.parentEmail,
        parentPhone: req.body.parentPhone,
        budgetPerHour: req.body.budgetPerHour,
        preferredLevelSubjectIds,
      };
    }

    if (!data.educationLevelId) {
      throw new ValidationError('Education level is required', 'educationLevelId');
    }

    // Check if profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      console.log('📱 Student profile already exists, updating...');
      profile = await updateStudentProfile(userId, {
        educationSystemId: data.educationSystemId,
        educationLevelId: data.educationLevelId,
        educationStreamId: data.educationStreamId,
        schoolName: data.schoolName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        budgetPerHour: data.budgetPerHour,
        preferredLevelSubjectIds: data.preferredLevelSubjectIds,
      });
    } else {
      // Create new profile
      console.log('📱 Creating new student profile...');
      profile = await createStudentProfile(data);
    }

    res.status(existingProfile ? 200 : 201).json({
      success: true,
      data: profile,
      message: existingProfile ? 'Student profile updated successfully' : 'Student profile created successfully',
    });
  } catch (error) {
    console.error('❌ Failed to create/update student profile:', error);
    next(error);
  }
});

/**
 * POST /api/profiles/tutor
 * Create a tutor profile (with backward compatibility)
 */
router.post('/tutor', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    let data: CreateTutorProfileData;

    // Check format: new structured format, teachingLevelSubjectIds, or legacy
    if (req.body.educationSystemId && req.body.levelIds && req.body.subjectIds) {
      // New structured format from onboarding
      console.log('📱 Tutor profile: Using new structured format');
      console.log('Structured data:', {
        systemId: req.body.educationSystemId,
        levelIds: req.body.levelIds,
        streamIds: req.body.streamIds,
        subjectIds: req.body.subjectIds,
      });

      // Convert to teachingLevelSubjectIds
      const teachingLevelSubjectIds: string[] = [];

      // For each level, find or create LevelSubjects that match the subjects
      for (const levelId of req.body.levelIds) {
        for (const subjectId of req.body.subjectIds) {
          // Try to find existing LevelSubject
          let levelSubject = await prisma.levelSubject.findFirst({
            where: {
              levelId,
              subjectId,
            },
          });

          // If not found, create it
          if (!levelSubject) {
            console.log(`Creating LevelSubject for level ${levelId} and subject ${subjectId}`);
            levelSubject = await prisma.levelSubject.create({
              data: {
                levelId,
                subjectId,
                isCore: false,
              },
            });
          }

          teachingLevelSubjectIds.push(levelSubject.id);
        }
      }

      console.log(`Converted to ${teachingLevelSubjectIds.length} teaching level subjects`);

      // Convert languages
      const teachingLanguageIds = await convertLegacyLanguages(req.body.languages || []);
      console.log(`Converted to ${teachingLanguageIds.length} teaching languages`);

      data = {
        userId,
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds,
        teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas || [],
      };
    } else if (req.body.teachingLevelSubjectIds) {
      // Direct teachingLevelSubjectIds format
      console.log('📱 Tutor profile: Using direct format');
      data = {
        userId,
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds: req.body.teachingLevelSubjectIds,
        teachingLanguageIds: req.body.teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas || [],
      };
    } else {
      // Legacy format - convert to new format
      console.log('📱 Tutor profile: Converting from legacy format');
      console.log('Legacy data:', {
        subjects: req.body.subjects,
        educationLevels: req.body.educationLevels,
        languages: req.body.languages,
      });

      // Get default system (French) for conversion
      const defaultSystem = await prisma.educationSystem.findFirst({
        where: { code: 'FRENCH' },
      });

      if (!defaultSystem) {
        throw new ValidationError('Default education system not found', 'system');
      }

      // Convert teaching subjects and levels
      const teachingLevelSubjectIds = await getTeachingLevelSubjectsFromLegacy(
        req.body.subjects || [],
        req.body.educationLevels || [],
        defaultSystem.id
      );

      console.log(`Converted to ${teachingLevelSubjectIds.length} teaching level subjects`);

      // Convert languages
      const teachingLanguageIds = await convertLegacyLanguages(req.body.languages || []);
      console.log(`Converted to ${teachingLanguageIds.length} teaching languages`);

      // Parse experience years
      const experienceYears = parseExperienceYears(req.body.experienceYears);

      data = {
        userId,
        bio: req.body.bio,
        experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds,
        teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas || [],
      };
    }

    if (!data.hourlyRate) {
      throw new ValidationError('Hourly rate is required', 'hourlyRate');
    }

    // Check if profile already exists
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      console.log('📱 Tutor profile already exists, updating...');
      profile = await updateTutorProfile(userId, {
        bio: data.bio,
        experienceYears: data.experienceYears,
        hourlyRate: data.hourlyRate,
        teachingLevelSubjectIds: data.teachingLevelSubjectIds,
        teachingLanguageIds: data.teachingLanguageIds,
        teachingMode: data.teachingMode,
        serviceRadius: data.serviceRadius,
        diplomas: data.diplomas,
      });
    } else {
      // Create new profile
      console.log('📱 Creating new tutor profile...');
      profile = await createTutorProfile(data);
    }

    res.status(existingProfile ? 200 : 201).json({
      success: true,
      data: profile,
      message: existingProfile ? 'Tutor profile updated successfully' : 'Tutor profile created successfully',
    });
  } catch (error) {
    console.error('❌ Failed to create/update tutor profile:', error);
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
    console.log(`📥 [GET /profiles/student/:userId] Request for userId: ${userId}`);
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const profile = await getStudentProfile(userId);

    console.log(`✅ [GET /profiles/student/:userId] Returning profile for userId: ${userId}`);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.log(`❌ [GET /profiles/student/:userId] Error:`, error);
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
    
    console.log('📥 [PUT /profiles/student] Request body:', {
      hasLevelSubjects: !!req.body.preferredLevelSubjectIds,
      levelSubjectsCount: req.body.preferredLevelSubjectIds?.length || 0,
      hasStreamSubjects: !!req.body.preferredStreamSubjectIds,
      streamSubjectsCount: req.body.preferredStreamSubjectIds?.length || 0,
    });
    
    const data: UpdateStudentProfileData = {
      educationSystemId: req.body.educationSystemId,
      educationLevelId: req.body.educationLevelId,
      educationStreamId: req.body.educationStreamId,
      schoolName: req.body.schoolName,
      parentEmail: req.body.parentEmail,
      parentPhone: req.body.parentPhone,
      budgetPerHour: req.body.budgetPerHour,
      preferredLevelSubjectIds: req.body.preferredLevelSubjectIds,
      preferredStreamSubjectIds: req.body.preferredStreamSubjectIds,
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
    
    console.log('📥 PUT /tutor - Request body:', JSON.stringify(req.body, null, 2));
    
    let updateData: UpdateTutorProfileData;

    // Check format: new structured format or direct teachingLevelSubjectIds
    if (req.body.educationSystemId && req.body.levelIds && req.body.subjectIds) {
      // New structured format from edit page
      console.log('📱 Tutor profile update: Using new structured format');
      console.log('Structured data:', {
        systemId: req.body.educationSystemId,
        levelIds: req.body.levelIds,
        streamIds: req.body.streamIds,
        subjectIds: req.body.subjectIds,
        languages: req.body.languages,
      });

      // Convert to teachingLevelSubjectIds
      const teachingLevelSubjectIds: string[] = [];

      // For each level, find or create LevelSubjects that match the subjects
      for (const levelId of req.body.levelIds) {
        for (const subjectId of req.body.subjectIds) {
          // Try to find existing LevelSubject
          let levelSubject = await prisma.levelSubject.findFirst({
            where: {
              levelId,
              subjectId,
            },
          });

          // If not found, create it
          if (!levelSubject) {
            console.log(`Creating LevelSubject for level ${levelId} and subject ${subjectId}`);
            levelSubject = await prisma.levelSubject.create({
              data: {
                levelId,
                subjectId,
                isCore: false,
              },
            });
          }

          teachingLevelSubjectIds.push(levelSubject.id);
        }
      }

      console.log(`✅ Converted to ${teachingLevelSubjectIds.length} teaching level subjects:`, teachingLevelSubjectIds);

      // Convert languages
      const teachingLanguageIds = await convertLegacyLanguages(req.body.languages || []);
      console.log(`✅ Converted to ${teachingLanguageIds.length} teaching languages:`, teachingLanguageIds);

      updateData = {
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds,
        teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas,
        teachingSkillsDetails: req.body.teachingSkillsDetails,
      };
    } else {
      // Direct teachingLevelSubjectIds format
      console.log('📱 Tutor profile update: Using direct format');
      updateData = {
        bio: req.body.bio,
        experienceYears: req.body.experienceYears,
        hourlyRate: req.body.hourlyRate,
        teachingLevelSubjectIds: req.body.teachingLevelSubjectIds,
        teachingLanguageIds: req.body.teachingLanguageIds,
        teachingMode: req.body.teachingMode,
        serviceRadius: req.body.serviceRadius,
        diplomas: req.body.diplomas,
        teachingSkillsDetails: req.body.teachingSkillsDetails,
      };
    }

    console.log('📤 Calling updateTutorProfile with:', JSON.stringify(updateData, null, 2));

    const profile = await updateTutorProfile(userId, updateData);

    console.log('✅ Profile updated successfully, returning:', {
      teachingSubjectsCount: profile.teachingSubjects?.length,
      teachingLanguagesCount: profile.teachingLanguages?.length,
    });

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Tutor profile updated successfully',
    });
  } catch (error) {
    console.error('❌ PUT /tutor error:', error);
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
      countryCode: req.body.countryCode,
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
