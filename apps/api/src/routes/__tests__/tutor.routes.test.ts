import request from 'supertest';
import express from 'express';
import tutorRoutes from '../tutor.routes';
import * as tutorSearchService from '../../services/tutor-search.service';

// Mock the tutor search service
jest.mock('../../services/tutor-search.service');

const app = express();
app.use(express.json());
app.use('/api/tutors', tutorRoutes);

// Error handler
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
);

describe('Tutor Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tutors/search', () => {
    it('should search for tutors with valid criteria', async () => {
      const mockResults = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
          bio: 'Experienced tutor',
          hourlyRate: 50,
          subjects: ['mathematics'],
          educationLevels: ['high_school'],
          languages: ['en'],
          teachingMode: 'ONLINE',
          averageRating: 4.5,
          totalReviews: 10,
          isVerified: true,
          matchingScore: 85,
        },
      ];

      (tutorSearchService.searchTutors as jest.Mock).mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/tutors/search')
        .send({
          subject: 'mathematics',
          educationLevel: 'high_school',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].subjects).toContain('mathematics');
    });

    it('should return validation error for invalid price range', async () => {
      const response = await request(app)
        .post('/api/tutors/search')
        .send({
          minPrice: 100,
          maxPrice: 50,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Minimum price cannot be greater');
    });

    it('should return validation error for invalid rating', async () => {
      const response = await request(app)
        .post('/api/tutors/search')
        .send({
          minRating: 6,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('rating must be between 0 and 5');
    });

    it('should return validation error when distance filter lacks coordinates', async () => {
      const response = await request(app)
        .post('/api/tutors/search')
        .send({
          maxDistance: 10,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Latitude and longitude are required');
    });

    it('should search with all criteria', async () => {
      const mockResults = [
        {
          id: 'tutor-1',
          userId: 'user-1',
          firstName: 'Jane',
          lastName: 'Smith',
          avatarUrl: null,
          bio: 'Expert tutor',
          hourlyRate: 60,
          subjects: ['physics'],
          educationLevels: ['university'],
          languages: ['en', 'fr'],
          teachingMode: 'BOTH',
          averageRating: 4.8,
          totalReviews: 25,
          isVerified: true,
          matchingScore: 92,
          distance: 5,
        },
      ];

      (tutorSearchService.searchTutors as jest.Mock).mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/tutors/search')
        .send({
          subject: 'physics',
          educationLevel: 'university',
          minPrice: 50,
          maxPrice: 100,
          minRating: 4.5,
          maxDistance: 10,
          latitude: 48.8566,
          longitude: 2.3522,
          languages: ['en', 'fr'],
          teachingMode: 'BOTH',
          availability: {
            day: 'monday',
            start: '10:00',
            end: '12:00',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(tutorSearchService.searchTutors).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'physics',
          educationLevel: 'university',
          minPrice: 50,
          maxPrice: 100,
          minRating: 4.5,
          maxDistance: 10,
          latitude: 48.8566,
          longitude: 2.3522,
        })
      );
    });
  });

  describe('GET /api/tutors/:id', () => {
    it('should return tutor details by ID', async () => {
      const mockTutor = {
        id: 'tutor-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null,
        bio: 'Experienced tutor',
        experienceYears: 5,
        hourlyRate: 50,
        subjects: ['mathematics'],
        educationLevels: ['high_school'],
        languages: ['en'],
        teachingMode: 'ONLINE',
        serviceRadius: null,
        diplomas: [],
        availability: {},
        totalHoursTaught: 100,
        averageRating: 4.5,
        totalReviews: 10,
        isVerified: true,
        city: 'Paris',
        country: 'France',
        memberSince: new Date('2024-01-01'),
      };

      (tutorSearchService.getTutorDetails as jest.Mock).mockResolvedValue(mockTutor);

      const response = await request(app).get('/api/tutors/tutor-1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('tutor-1');
      expect(response.body.data.firstName).toBe('John');
    });

    it('should return 404 when tutor not found', async () => {
      const error = new Error('Tutor not found');
      (error as any).statusCode = 404;
      (error as any).code = 'NOT_FOUND';

      (tutorSearchService.getTutorDetails as jest.Mock).mockRejectedValue(error);

      const response = await request(app).get('/api/tutors/non-existent').expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Tutor not found');
    });
  });

  describe('GET /api/tutors/user/:userId', () => {
    it('should return tutor details by user ID', async () => {
      const mockTutor = {
        id: 'tutor-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Smith',
        avatarUrl: null,
        bio: 'Expert tutor',
        experienceYears: 8,
        hourlyRate: 70,
        subjects: ['physics', 'chemistry'],
        educationLevels: ['university'],
        languages: ['en', 'fr'],
        teachingMode: 'BOTH',
        serviceRadius: 15,
        diplomas: [],
        availability: {},
        totalHoursTaught: 200,
        averageRating: 4.8,
        totalReviews: 30,
        isVerified: true,
        city: 'Lyon',
        country: 'France',
        memberSince: new Date('2023-06-01'),
      };

      (tutorSearchService.getTutorDetailsByUserId as jest.Mock).mockResolvedValue(mockTutor);

      const response = await request(app).get('/api/tutors/user/user-1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user-1');
      expect(response.body.data.firstName).toBe('Jane');
    });

    it('should return 404 when tutor not found by user ID', async () => {
      const error = new Error('Tutor not found');
      (error as any).statusCode = 404;
      (error as any).code = 'NOT_FOUND';

      (tutorSearchService.getTutorDetailsByUserId as jest.Mock).mockRejectedValue(error);

      const response = await request(app).get('/api/tutors/user/non-existent').expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Tutor not found');
    });
  });
});
