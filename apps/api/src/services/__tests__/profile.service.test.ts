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
} from '../profile.service';
import { register } from '../auth.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Profile Service', () => {
  let studentUserId: string;
  let tutorUserId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create a student user
    const studentResult = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'User',
      role: Role.STUDENT,
      birthDate: new Date('2000-01-01'),
    });
    studentUserId = studentResult.user.id;

    // Create a tutor user
    const tutorResult = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Tutor',
      lastName: 'User',
      role: Role.TUTOR,
    });
    tutorUserId = tutorResult.user.id;
  }, 15000); // Increase timeout to 15 seconds

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Student Profile', () => {
    it('should create a student profile with valid data', async () => {
      const profileData: CreateStudentProfileData = {
        userId: studentUserId,
        educationLevel: 'high_school',
        schoolName: 'Test High School',
        learningGoals: 'Improve math skills',
        preferredSubjects: ['mathematics', 'physics'],
        budgetPerHour: 25,
      };

      const profile = await createStudentProfile(profileData);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(studentUserId);
      expect(profile.educationLevel).toBe('high_school');
      expect(profile.schoolName).toBe('Test High School');
      expect(profile.preferredSubjects).toEqual(['mathematics', 'physics']);
    }, 10000);

    it('should reject creating duplicate student profile', async () => {
      const profileData: CreateStudentProfileData = {
        userId: studentUserId,
        educationLevel: 'high_school',
      };

      await createStudentProfile(profileData);

      await expect(createStudentProfile(profileData)).rejects.toThrow('Student profile already exists');
    });

    it('should reject invalid education level', async () => {
      const profileData: CreateStudentProfileData = {
        userId: studentUserId,
        educationLevel: 'invalid_level',
      };

      await expect(createStudentProfile(profileData)).rejects.toThrow('Education level must be one of');
    });

    it('should get student profile by user ID', async () => {
      const profileData: CreateStudentProfileData = {
        userId: studentUserId,
        educationLevel: 'university',
      };

      await createStudentProfile(profileData);
      const profile = await getStudentProfile(studentUserId);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(studentUserId);
      expect(profile.educationLevel).toBe('university');
      expect(profile.user).toBeDefined();
      expect(profile.user.email).toBe('student@example.com');
    });

    it('should update student profile', async () => {
      const profileData: CreateStudentProfileData = {
        userId: studentUserId,
        educationLevel: 'high_school',
      };

      await createStudentProfile(profileData);

      const updatedProfile = await updateStudentProfile(studentUserId, {
        educationLevel: 'university',
        schoolName: 'Test University',
        preferredSubjects: ['computer_science'],
      });

      expect(updatedProfile.educationLevel).toBe('university');
      expect(updatedProfile.schoolName).toBe('Test University');
      expect(updatedProfile.preferredSubjects).toEqual(['computer_science']);
    });
  });

  describe('Tutor Profile', () => {
    it('should create a tutor profile with valid data', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        bio: 'Experienced math tutor',
        experienceYears: 5,
        hourlyRate: 50,
        subjects: ['mathematics', 'physics'],
        educationLevels: ['high_school', 'university'],
        languages: ['english', 'french'],
        teachingMode: 'BOTH',
        serviceRadius: 10,
      };

      const profile = await createTutorProfile(profileData);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(tutorUserId);
      expect(profile.hourlyRate.toString()).toBe('50');
      expect(profile.subjects).toEqual(['mathematics', 'physics']);
      expect(profile.teachingMode).toBe('BOTH');
      expect(profile.isVerified).toBe(false);
    });

    it('should reject hourly rate below minimum', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 3,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await expect(createTutorProfile(profileData)).rejects.toThrow('Hourly rate must be between 5 and 500');
    });

    it('should reject hourly rate above maximum', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 600,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await expect(createTutorProfile(profileData)).rejects.toThrow('Hourly rate must be between 5 and 500');
    });

    it('should reject profile without subjects', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 50,
        subjects: [],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await expect(createTutorProfile(profileData)).rejects.toThrow('At least one subject is required');
    });

    it('should get tutor profile by user ID', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await createTutorProfile(profileData);
      const profile = await getTutorProfile(tutorUserId);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(tutorUserId);
      expect(profile.user).toBeDefined();
      expect(profile.user.email).toBe('tutor@example.com');
    });

    it('should update tutor profile', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await createTutorProfile(profileData);

      const updatedProfile = await updateTutorProfile(tutorUserId, {
        hourlyRate: 75,
        bio: 'Updated bio',
        subjects: ['mathematics', 'physics', 'chemistry'],
      });

      expect(updatedProfile.hourlyRate.toString()).toBe('75');
      expect(updatedProfile.bio).toBe('Updated bio');
      expect(updatedProfile.subjects).toEqual(['mathematics', 'physics', 'chemistry']);
    });

    it('should upload verification documents', async () => {
      const profileData: CreateTutorProfileData = {
        userId: tutorUserId,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await createTutorProfile(profileData);

      const documentUrls = [
        'https://example.com/diploma1.pdf',
        'https://example.com/diploma2.pdf',
      ];

      const updatedProfile = await uploadVerificationDocuments(tutorUserId, documentUrls);

      expect(updatedProfile.verificationDocuments).toEqual(documentUrls);
    });
  });

  describe('User Management', () => {
    it('should update user basic information', async () => {
      const updatedUser = await updateUser(studentUserId, {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
        city: 'Paris',
        country: 'France',
      });

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.phone).toBe('+1234567890');
      expect(updatedUser.city).toBe('Paris');
      expect(updatedUser.country).toBe('France');
    });

    it('should update user avatar', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const updatedUser = await updateUserAvatar(studentUserId, avatarUrl);

      expect(updatedUser.avatarUrl).toBe(avatarUrl);
    });

    it('should get public user information', async () => {
      const user = await getUserById(studentUserId);

      expect(user).toBeDefined();
      expect(user.id).toBe(studentUserId);
      expect(user.firstName).toBe('Student');
      expect(user.lastName).toBe('User');
      expect(user.role).toBe(Role.STUDENT);
      expect((user as any).email).toBeUndefined(); // Email should not be in public info
    });

    it('should reject getting non-existent user', async () => {
      await expect(getUserById('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('Profile Validation', () => {
    it('should reject creating student profile for tutor user', async () => {
      const profileData: CreateStudentProfileData = {
        userId: tutorUserId,
        educationLevel: 'high_school',
      };

      await expect(createStudentProfile(profileData)).rejects.toThrow('User must have STUDENT role');
    });

    it('should reject creating tutor profile for student user', async () => {
      const profileData: CreateTutorProfileData = {
        userId: studentUserId,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['english'],
        teachingMode: 'ONLINE',
      };

      await expect(createTutorProfile(profileData)).rejects.toThrow('User must have TUTOR role');
    });
  });
});
