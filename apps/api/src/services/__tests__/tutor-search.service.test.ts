import { PrismaClient } from '@prisma/client';
import {
  searchTutors,
  getTutorDetails,
  getTutorDetailsByUserId,
  TutorSearchCriteria,
} from '../tutor-search.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    tutorProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Tutor Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchTutors', () => {
    it('should return tutors matching subject criteria', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'Experienced math tutor',
          hourlyRate: 50,
          subjects: ['mathematics', 'physics'],
          educationLevels: ['high_school', 'university'],
          languages: ['en', 'fr'],
          teachingMode: 'BOTH',
          averageRating: 4.5,
          totalReviews: 10,
          isVerified: true,
          availability: {
            monday: [{ start: '09:00', end: '17:00' }],
          },
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            avatarUrl: null,
            city: 'Paris',
            country: 'France',
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        subject: 'mathematics',
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].subjects).toContain('mathematics');
      expect(results[0].firstName).toBe('John');
    });

    it('should filter tutors by price range', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'Affordable tutor',
          hourlyRate: 30,
          subjects: ['mathematics'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 4.0,
          totalReviews: 5,
          isVerified: false,
          availability: {},
          user: {
            id: 'user-1',
            firstName: 'Jane',
            lastName: 'Smith',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        minPrice: 20,
        maxPrice: 40,
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].hourlyRate).toBeGreaterThanOrEqual(20);
      expect(results[0].hourlyRate).toBeLessThanOrEqual(40);
    });

    it('should filter tutors by minimum rating', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'Highly rated tutor',
          hourlyRate: 60,
          subjects: ['mathematics'],
          educationLevels: ['university'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 4.8,
          totalReviews: 20,
          isVerified: true,
          availability: {},
          user: {
            id: 'user-1',
            firstName: 'Alice',
            lastName: 'Johnson',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        minRating: 4.5,
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].averageRating).toBeGreaterThanOrEqual(4.5);
    });

    it('should sort results by matching score in descending order', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'Tutor 1',
          hourlyRate: 50,
          subjects: ['mathematics'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 3.0,
          totalReviews: 5,
          isVerified: false,
          availability: {},
          user: {
            id: 'user-1',
            firstName: 'Low',
            lastName: 'Score',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
        {
          id: 'tutor-2',
          userId: 'user-2',
          bio: 'Tutor 2',
          hourlyRate: 50,
          subjects: ['mathematics'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 5.0,
          totalReviews: 20,
          isVerified: true,
          availability: {},
          user: {
            id: 'user-2',
            firstName: 'High',
            lastName: 'Score',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        subject: 'mathematics',
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(2);
      expect(results[0].matchingScore).toBeGreaterThan(results[1].matchingScore);
      expect(results[0].firstName).toBe('High');
    });

    it('should filter by language', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'French tutor',
          hourlyRate: 40,
          subjects: ['french'],
          educationLevels: ['high_school'],
          languages: ['fr', 'en'],
          teachingMode: 'ONLINE',
          averageRating: 4.5,
          totalReviews: 10,
          isVerified: true,
          availability: {},
          user: {
            id: 'user-1',
            firstName: 'Pierre',
            lastName: 'Dupont',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
        {
          id: 'tutor-2',
          userId: 'user-2',
          bio: 'English only tutor',
          hourlyRate: 40,
          subjects: ['english'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 4.5,
          totalReviews: 10,
          isVerified: true,
          availability: {},
          user: {
            id: 'user-2',
            firstName: 'John',
            lastName: 'Smith',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        languages: ['fr'],
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].languages).toContain('fr');
      expect(results[0].firstName).toBe('Pierre');
    });

    it('should calculate matching score with correct weights', async () => {
      const mockTutors = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          bio: 'Test tutor',
          hourlyRate: 50,
          subjects: ['mathematics'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 5.0,
          totalReviews: 10,
          isVerified: true,
          availability: {
            monday: [{ start: '09:00', end: '17:00' }],
          },
          user: {
            id: 'user-1',
            firstName: 'Test',
            lastName: 'Tutor',
            avatarUrl: null,
            city: null,
            country: null,
          },
        },
      ];

      (prisma.tutorProfile.findMany as jest.Mock).mockResolvedValue(mockTutors);

      const criteria: TutorSearchCriteria = {
        educationLevel: 'high_school',
        languages: ['en'],
        availability: {
          day: 'monday',
          start: '10:00',
          end: '12:00',
        },
      };

      const results = await searchTutors(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].matchingScore).toBeGreaterThan(0);
      expect(results[0].matchingScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getTutorDetails', () => {
    it('should return tutor details by ID', async () => {
      const mockTutor = {
        id: 'tutor-1',
        userId: 'user-1',
        bio: 'Experienced tutor',
        experienceYears: 5,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['en'],
        teachingMode: 'BOTH',
        serviceRadius: 10,
        diplomas: [],
        availability: {},
        totalHoursTaught: 100,
        averageRating: 4.5,
        totalReviews: 10,
        isVerified: true,
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
          city: 'Paris',
          country: 'France',
          createdAt: new Date('2024-01-01'),
        },
      };

      (prisma.tutorProfile.findUnique as jest.Mock).mockResolvedValue(mockTutor);

      const result = await getTutorDetails('tutor-1');

      expect(result.id).toBe('tutor-1');
      expect(result.firstName).toBe('John');
      expect(result.hourlyRate).toBe(50);
      expect(result.isVerified).toBe(true);
    });

    it('should throw NotFoundError when tutor does not exist', async () => {
      (prisma.tutorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getTutorDetails('non-existent')).rejects.toThrow('Tutor not found');
    });
  });

  describe('getTutorDetailsByUserId', () => {
    it('should return tutor details by user ID', async () => {
      const mockTutor = {
        id: 'tutor-1',
        userId: 'user-1',
        bio: 'Experienced tutor',
        experienceYears: 5,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['en'],
        teachingMode: 'BOTH',
        serviceRadius: 10,
        diplomas: [],
        availability: {},
        totalHoursTaught: 100,
        averageRating: 4.5,
        totalReviews: 10,
        isVerified: true,
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
          city: 'Paris',
          country: 'France',
          createdAt: new Date('2024-01-01'),
        },
      };

      (prisma.tutorProfile.findUnique as jest.Mock).mockResolvedValue(mockTutor);

      const result = await getTutorDetailsByUserId('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.firstName).toBe('John');
    });

    it('should throw NotFoundError when tutor does not exist', async () => {
      (prisma.tutorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getTutorDetailsByUserId('non-existent')).rejects.toThrow(
        'Tutor not found'
      );
    });
  });
});
