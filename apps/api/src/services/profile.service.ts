import { PrismaClient, Role } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from '@repo/utils';
import { checkExpertVerifieBadge } from './badge.service';

const prisma = new PrismaClient();

// Types
export interface CreateStudentProfileData {
  userId: string;
  educationLevel: string;
  schoolName?: string;
  parentEmail?: string;
  parentPhone?: string;
  learningGoals?: string;
  preferredSubjects?: string[];
  budgetPerHour?: number;
}

export interface UpdateStudentProfileData {
  educationLevel?: string;
  educationDetails?: any; // JSON structure for detailed education info
  schoolName?: string;
  parentEmail?: string;
  parentPhone?: string;
  learningGoals?: string;
  preferredSubjects?: string[];
  budgetPerHour?: number;
}

export interface CreateTutorProfileData {
  userId: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate: number;
  subjects: string[];
  educationLevels: string[];
  languages: string[];
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius?: number;
  diplomas?: Diploma[];
  availability?: WeeklySchedule;
}

export interface UpdateTutorProfileData {
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  subjects?: string[];
  educationLevels?: string[];
  languages?: string[];
  teachingMode?: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadius?: number;
  diplomas?: Diploma[];
  availability?: WeeklySchedule;
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
  country?: string;
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

  // Validate education level
  validateEducationLevel(data.educationLevel);

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
      educationLevel: data.educationLevel,
      schoolName: data.schoolName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      learningGoals: data.learningGoals,
      preferredSubjects: data.preferredSubjects || [],
      budgetPerHour: data.budgetPerHour,
    },
  });

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
  if (!data.subjects || data.subjects.length === 0) {
    throw new ValidationError('At least one subject is required', 'subjects');
  }

  if (!data.educationLevels || data.educationLevels.length === 0) {
    throw new ValidationError('At least one education level is required', 'educationLevels');
  }

  if (!data.languages || data.languages.length === 0) {
    throw new ValidationError('At least one language is required', 'languages');
  }

  // Create tutor profile
  const profile = await prisma.tutorProfile.create({
    data: {
      userId: data.userId,
      bio: data.bio,
      experienceYears: data.experienceYears || 0,
      hourlyRate: data.hourlyRate,
      subjects: data.subjects,
      educationLevels: data.educationLevels,
      languages: data.languages,
      teachingMode: data.teachingMode,
      serviceRadius: data.serviceRadius,
      diplomas: (data.diplomas || []) as any,
      availability: (data.availability || {}) as any,
      isVerified: false,
      verificationDocuments: [],
    },
  });

  return profile;
}

/**
 * Get student profile by user ID
 */
export async function getStudentProfile(userId: string) {
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
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundError('Student profile not found');
  }

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
  // Verify profile exists
  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!existingProfile) {
    throw new NotFoundError('Student profile not found');
  }

  // Validate education level if provided
  if (data.educationLevel) {
    validateEducationLevel(data.educationLevel);
  }

  // Update profile
  const profile = await prisma.studentProfile.update({
    where: { userId },
    data: {
      educationLevel: data.educationLevel,
      educationDetails: data.educationDetails as any,
      schoolName: data.schoolName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      learningGoals: data.learningGoals,
      preferredSubjects: data.preferredSubjects,
      budgetPerHour: data.budgetPerHour,
    },
  });

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

  // Update profile
  const profile = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      bio: data.bio,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      subjects: data.subjects,
      educationLevels: data.educationLevels,
      languages: data.languages,
      teachingMode: data.teachingMode,
      serviceRadius: data.serviceRadius,
      diplomas: data.diplomas as any,
      availability: data.availability as any,
      teachingSkillsDetails: data.teachingSkillsDetails as any,
    },
  });

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
      country: data.country,
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
      country: true,
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
      country: true,
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
