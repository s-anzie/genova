import { PrismaClient, Role } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from '@repo/utils';
import { checkExpertVerifieBadge } from './badge.service';
import { recalculatePricesForTutor } from './session-generator.service';

const prisma = new PrismaClient();

// Types
export interface CreateStudentProfileData {
  userId: string;
  educationSystemId?: string;
  educationLevelId?: string;
  educationStreamId?: string;
  schoolName?: string;
  parentEmail?: string;
  parentPhone?: string;
  budgetPerHour?: number;
  preferredLevelSubjectIds?: string[]; // Array of LevelSubject IDs
  preferredStreamSubjectIds?: string[]; // Array of StreamSubject IDs
}

export interface UpdateStudentProfileData {
  educationSystemId?: string;
  educationLevelId?: string;
  educationStreamId?: string;
  schoolName?: string;
  parentEmail?: string;
  parentPhone?: string;
  budgetPerHour?: number;
  preferredLevelSubjectIds?: string[]; // Array of LevelSubject IDs
  preferredStreamSubjectIds?: string[]; // Array of StreamSubject IDs
}

export interface CreateTutorProfileData {
  userId: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate: number;
  teachingLevelSubjectIds: string[]; // Array of LevelSubject IDs
  teachingLanguageIds: string[]; // Array of Language IDs
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius?: number;
  diplomas?: Diploma[];
}

export interface UpdateTutorProfileData {
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  teachingLevelSubjectIds?: string[]; // Array of LevelSubject IDs
  teachingLanguageIds?: string[]; // Array of Language IDs
  teachingMode?: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius?: number;
  diplomas?: Diploma[];
  teachingSkillsDetails?: any; // JSON structure for detailed teaching skills
}

export interface Diploma {
  name: string;
  institution: string;
  year: number;
  verified: boolean;
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  preferredLanguage?: string;
}

/**
 * Validate hourly rate is within acceptable range
 */
function validateHourlyRate(rate: number): void {
  if (rate < 5 || rate > 500) {
    throw new ValidationError('Hourly rate must be between 5 and 500 currency units', 'hourlyRate');
  }
}

/**
 * Validate education level
 */
function validateEducationLevel(level: string): void {
  const validLevels = ['primary', 'middle_school', 'high_school', 'university', 'graduate'];
  if (!validLevels.includes(level)) {
    throw new ValidationError(`Education level must be one of: ${validLevels.join(', ')}`, 'educationLevel');
  }
}

/**
 * Validate teaching mode
 */
function validateTeachingMode(mode: string): void {
  const validModes = ['IN_PERSON', 'ONLINE', 'BOTH'];
  if (!validModes.includes(mode)) {
    throw new ValidationError(`Teaching mode must be one of: ${validModes.join(', ')}`, 'teachingMode');
  }
}

/**
 * Create a student profile
 */
export async function createStudentProfile(data: CreateStudentProfileData) {
  // Verify user exists and is a student
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    include: { studentProfile: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== Role.STUDENT) {
    throw new ValidationError('User must have STUDENT role to create a student profile');
  }

  if (user.studentProfile) {
    throw new ValidationError('Student profile already exists');
  }

  // Check if user is a minor and require parent email
  if (user.birthDate) {
    const age = Math.floor((Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18 && !data.parentEmail) {
      throw new ValidationError('Parent email is required for users under 18 years old', 'parentEmail');
    }
  }

  // Create student profile
  const profile = await prisma.studentProfile.create({
    data: {
      userId: data.userId,
      educationSystemId: data.educationSystemId,
      educationLevelId: data.educationLevelId,
      educationStreamId: data.educationStreamId,
      schoolName: data.schoolName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      budgetPerHour: data.budgetPerHour,
      onboardingCompleted: true,
    },
  });

  // Create preferred level subjects if provided
  if (data.preferredLevelSubjectIds && data.preferredLevelSubjectIds.length > 0) {
    // Verify that all IDs are valid LevelSubject IDs
    const validLevelSubjects = await prisma.levelSubject.findMany({
      where: {
        id: {
          in: data.preferredLevelSubjectIds,
        },
      },
      select: { id: true },
    });

    const validIds = validLevelSubjects.map(ls => ls.id);

    // Only create preferences for valid LevelSubject IDs
    if (validIds.length > 0) {
      await prisma.studentPreferredSubject.createMany({
        data: validIds.map(levelSubjectId => ({
          studentProfileId: profile.id,
          levelSubjectId,
        })),
      });
    }

    // Log if some IDs were invalid
    if (validIds.length !== data.preferredLevelSubjectIds.length) {
      console.log(`⚠️ Some level subject IDs were invalid (${data.preferredLevelSubjectIds.length - validIds.length} ignored)`);
    }
  }

  // Create preferred stream subjects if provided
  if (data.preferredStreamSubjectIds && data.preferredStreamSubjectIds.length > 0) {
    // Verify that all IDs are valid StreamSubject IDs
    const validStreamSubjects = await prisma.streamSubject.findMany({
      where: {
        id: {
          in: data.preferredStreamSubjectIds,
        },
      },
      select: { id: true },
    });

    const validIds = validStreamSubjects.map(ss => ss.id);

    // Only create preferences for valid StreamSubject IDs
    if (validIds.length > 0) {
      await prisma.studentPreferredStreamSubject.createMany({
        data: validIds.map(streamSubjectId => ({
          studentProfileId: profile.id,
          streamSubjectId,
        })),
      });
    }

    // Log if some IDs were invalid
    if (validIds.length !== data.preferredStreamSubjectIds.length) {
      console.log(`⚠️ Some stream subject IDs were invalid (${data.preferredStreamSubjectIds.length - validIds.length} ignored)`);
    }
  }

  return profile;
}

/**
 * Create a tutor profile
 */
export async function createTutorProfile(data: CreateTutorProfileData) {
  // Verify user exists and is a tutor
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    include: { tutorProfile: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== Role.TUTOR) {
    throw new ValidationError('User must have TUTOR role to create a tutor profile');
  }

  if (user.tutorProfile) {
    throw new ValidationError('Tutor profile already exists');
  }

  // Validate hourly rate
  validateHourlyRate(data.hourlyRate);

  // Validate teaching mode
  validateTeachingMode(data.teachingMode);

  // Validate required fields
  if (!data.teachingLevelSubjectIds || data.teachingLevelSubjectIds.length === 0) {
    throw new ValidationError('At least one teaching subject is required', 'teachingLevelSubjectIds');
  }

  if (!data.teachingLanguageIds || data.teachingLanguageIds.length === 0) {
    throw new ValidationError('At least one language is required', 'teachingLanguageIds');
  }

  // Create tutor profile
  const profile = await prisma.tutorProfile.create({
    data: {
      userId: data.userId,
      bio: data.bio,
      experienceYears: data.experienceYears || 0,
      hourlyRate: data.hourlyRate,
      teachingMode: data.teachingMode,
      serviceRadius: data.serviceRadius,
      diplomas: (data.diplomas || []) as any,
      isVerified: false,
      verificationDocuments: [],
    },
  });

  // Create teaching subjects
  await prisma.tutorTeachingSubject.createMany({
    data: data.teachingLevelSubjectIds.map(levelSubjectId => ({
      tutorProfileId: profile.id,
      levelSubjectId,
    })),
  });

  // Create teaching languages
  await prisma.tutorTeachingLanguage.createMany({
    data: data.teachingLanguageIds.map(languageId => ({
      tutorProfileId: profile.id,
      teachingLanguageId: languageId,
    })),
  });

  return profile;
}

/**
 * Get student profile by user ID
 */
export async function getStudentProfile(userId: string) {
  console.log(`🔍 [getStudentProfile] Looking for profile with userId: ${userId}`);
  
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          birthDate: true,
          preferredLanguage: true,
          isVerified: true,
          subscriptionType: true,
          walletBalance: true,
          createdAt: true,
        },
      },
      educationSystem: {
        include: {
          country: true,
        },
      },
      educationLevel: true,
      educationStream: true,
      preferredLevelSubjects: {
        include: {
          levelSubject: {
            include: {
              subject: true,
            },
          },
        },
      },
      preferredStreamSubjects: {
        include: {
          streamSubject: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  console.log(`📋 [getStudentProfile] Profile found:`, {
    exists: !!profile,
    userId: profile?.userId,
    onboardingCompleted: profile?.onboardingCompleted,
  });

  if (!profile) {
    console.log(`❌ [getStudentProfile] No profile found for userId: ${userId}`);
    throw new NotFoundError('Student profile');
  }

  console.log(`✅ [getStudentProfile] Returning profile for userId: ${userId}`);
  return profile;
}

/**
 * Get tutor profile by user ID
 */
export async function getTutorProfile(userId: string) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          birthDate: true,
          preferredLanguage: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundError('Tutor profile not found');
  }

  return profile;
}

/**
 * Update student profile
 */
export async function updateStudentProfile(userId: string, data: UpdateStudentProfileData) {
  console.log('📝 [updateStudentProfile] Starting update for userId:', userId);
  console.log('📝 [updateStudentProfile] Data received:', {
    hasLevelSubjects: !!data.preferredLevelSubjectIds,
    levelSubjectsCount: data.preferredLevelSubjectIds?.length || 0,
    hasStreamSubjects: !!data.preferredStreamSubjectIds,
    streamSubjectsCount: data.preferredStreamSubjectIds?.length || 0,
  });

  // Verify profile exists
  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    throw new NotFoundError('Student profile not found');
  }

  console.log('✅ [updateStudentProfile] Profile found:', existingProfile.id);

  // Update profile
  const profile = await prisma.studentProfile.update({
    where: { userId },
    data: {
      educationSystemId: data.educationSystemId,
      educationLevelId: data.educationLevelId,
      educationStreamId: data.educationStreamId,
      schoolName: data.schoolName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      budgetPerHour: data.budgetPerHour,
      onboardingCompleted: true,
    },
  });

  console.log('✅ [updateStudentProfile] Profile updated');

  // Update preferred level subjects if provided
  if (data.preferredLevelSubjectIds !== undefined) {
    console.log('🔄 [updateStudentProfile] Updating level subjects:', data.preferredLevelSubjectIds);
    
    // Delete existing level subject preferences
    await prisma.studentPreferredSubject.deleteMany({
      where: { studentProfileId: existingProfile.id },
    });

    console.log('🗑️ [updateStudentProfile] Deleted existing level subjects');

    // Create new level subject preferences
    if (data.preferredLevelSubjectIds.length > 0) {
      // Verify that all IDs are valid LevelSubject IDs
      const validLevelSubjects = await prisma.levelSubject.findMany({
        where: {
          id: {
            in: data.preferredLevelSubjectIds,
          },
        },
        select: { id: true },
      });

      const validIds = validLevelSubjects.map(ls => ls.id);

      console.log('✅ [updateStudentProfile] Valid level subject IDs:', validIds);

      // Only create preferences for valid LevelSubject IDs
      if (validIds.length > 0) {
        await prisma.studentPreferredSubject.createMany({
          data: validIds.map(levelSubjectId => ({
            studentProfileId: existingProfile.id,
            levelSubjectId,
          })),
        });
        
        console.log('✅ [updateStudentProfile] Created', validIds.length, 'level subject preferences');
      }

      // Log if some IDs were invalid
      if (validIds.length !== data.preferredLevelSubjectIds.length) {
        console.log(`⚠️ Some level subject IDs were invalid (${data.preferredLevelSubjectIds.length - validIds.length} ignored)`);
      }
    }
  }

  // Update preferred stream subjects if provided
  if (data.preferredStreamSubjectIds !== undefined) {
    console.log('🔄 [updateStudentProfile] Updating stream subjects:', data.preferredStreamSubjectIds);
    
    // Delete existing stream subject preferences
    await prisma.studentPreferredStreamSubject.deleteMany({
      where: { studentProfileId: existingProfile.id },
    });

    console.log('🗑️ [updateStudentProfile] Deleted existing stream subjects');

    // Create new stream subject preferences
    if (data.preferredStreamSubjectIds.length > 0) {
      // Verify that all IDs are valid StreamSubject IDs
      const validStreamSubjects = await prisma.streamSubject.findMany({
        where: {
          id: {
            in: data.preferredStreamSubjectIds,
          },
        },
        select: { id: true },
      });

      const validIds = validStreamSubjects.map(ss => ss.id);

      console.log('✅ [updateStudentProfile] Valid stream subject IDs:', validIds);

      // Only create preferences for valid StreamSubject IDs
      if (validIds.length > 0) {
        await prisma.studentPreferredStreamSubject.createMany({
          data: validIds.map(streamSubjectId => ({
            studentProfileId: existingProfile.id,
            streamSubjectId,
          })),
        });
        
        console.log('✅ [updateStudentProfile] Created', validIds.length, 'stream subject preferences');
      }

      // Log if some IDs were invalid
      if (validIds.length !== data.preferredStreamSubjectIds.length) {
        console.log(`⚠️ Some stream subject IDs were invalid (${data.preferredStreamSubjectIds.length - validIds.length} ignored)`);
      }
    }
  }

  console.log('✅ [updateStudentProfile] Update complete');
  return profile;
}

/**
 * Update tutor profile
 */
export async function updateTutorProfile(userId: string, data: UpdateTutorProfileData) {
  // Verify profile exists
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Validate hourly rate if provided
  if (data.hourlyRate !== undefined) {
    validateHourlyRate(data.hourlyRate);
  }

  // Validate teaching mode if provided
  if (data.teachingMode) {
    validateTeachingMode(data.teachingMode);
  }

  // Check if hourly rate is changing
  const hourlyRateChanged = data.hourlyRate !== undefined && 
                            Number(data.hourlyRate) !== Number(existingProfile.hourlyRate);

  // Update profile
  const profile = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      bio: data.bio,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      teachingMode: data.teachingMode,
      serviceRadius: data.serviceRadius,
      diplomas: data.diplomas as any,
      teachingSkillsDetails: data.teachingSkillsDetails as any,
    },
  });

  // Update teaching subjects if provided
  if (data.teachingLevelSubjectIds !== undefined) {
    // Delete existing teaching subjects
    await prisma.tutorTeachingSubject.deleteMany({
      where: { tutorProfileId: existingProfile.id },
    });

    // Create new teaching subjects
    if (data.teachingLevelSubjectIds.length > 0) {
      await prisma.tutorTeachingSubject.createMany({
        data: data.teachingLevelSubjectIds.map(levelSubjectId => ({
          tutorProfileId: existingProfile.id,
          levelSubjectId,
        })),
      });
    }
  }

  // Update teaching languages if provided
  if (data.teachingLanguageIds !== undefined) {
    // Delete existing teaching languages
    await prisma.tutorTeachingLanguage.deleteMany({
      where: { tutorProfileId: existingProfile.id },
    });

    // Create new teaching languages
    if (data.teachingLanguageIds.length > 0) {
      await prisma.tutorTeachingLanguage.createMany({
        data: data.teachingLanguageIds.map(languageId => ({
          tutorProfileId: existingProfile.id,
          teachingLanguageId: languageId,
        })),
      });
    }
  }

  // If hourly rate changed, recalculate prices for future PENDING sessions (Requirement 6.3)
  if (hourlyRateChanged && data.hourlyRate !== undefined) {
    recalculatePricesForTutor(userId, data.hourlyRate).catch((err: Error) => {
      console.error('Error recalculating prices for tutor sessions:', err);
    });
  }

  return profile;
}

/**
 * Update user basic information
 */
export async function updateUser(userId: string, data: UpdateUserData) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      birthDate: data.birthDate,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      countryCode: data.countryCode,
      preferredLanguage: data.preferredLanguage,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      birthDate: true,
      address: true,
      city: true,
      postalCode: true,
      countryCode: true,
      preferredLanguage: true,
      role: true,
      subscriptionType: true,
      subscriptionExpiresAt: true,
      walletBalance: true,
      createdAt: true,
      updatedAt: true,
      isVerified: true,
      isActive: true,
    },
  });

  return updatedUser;
}

/**
 * Update user avatar URL
 */
export async function updateUserAvatar(userId: string, avatarUrl: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });

  return updatedUser;
}

/**
 * Upload verification documents for tutor
 */
export async function uploadVerificationDocuments(userId: string, documentUrls: string[]) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Tutor profile not found');
  }

  if (!documentUrls || documentUrls.length === 0) {
    throw new ValidationError('At least one document URL is required', 'documentUrls');
  }

  const updatedProfile = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      verificationDocuments: documentUrls,
    },
  });

  return updatedProfile;
}

/**
 * Verify a tutor (admin function)
 * Validates: Requirements 18.2
 */
export async function verifyTutor(userId: string, isVerified: boolean) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Tutor profile not found');
  }

  const updatedProfile = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      isVerified,
    },
  });

  // Check for Expert Vérifié badge if verified (Requirement 18.2)
  if (isVerified) {
    checkExpertVerifieBadge(userId).catch((err: Error) => {
      console.error('Error checking Expert Vérifié badge:', err);
    });
  }

  return updatedProfile;
}

/**
 * Get user by ID (public information only)
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      birthDate: true,
      address: true,
      city: true,
      postalCode: true,
      countryCode: true,
      preferredLanguage: true,
      role: true,
      subscriptionType: true,
      subscriptionExpiresAt: true,
      walletBalance: true,
      createdAt: true,
      updatedAt: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
