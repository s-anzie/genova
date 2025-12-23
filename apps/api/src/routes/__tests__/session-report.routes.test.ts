import request from 'supertest';
import express from 'express';
import sessionRoutes from '../session.routes';
import * as sessionReportService from '../../services/session-report.service';
import { ValidationError, NotFoundError, AuthorizationError } from '@repo/utils';

// Mock the services
jest.mock('../../services/session.service');
jest.mock('../../services/session-report.service');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-123' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: { message: err.message } });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { message: err.message } });
  }
  if (err instanceof AuthorizationError) {
    return res.status(403).json({ error: { message: err.message } });
  }
  res.status(500).json({ error: { message: err.message } });
});

describe('Session Report Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions/:id/report', () => {
    it('should create a session report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        sessionId: 'session-123',
        tutorId: 'test-user-123',
        topicsCovered: 'Algebra',
        homeworkAssigned: 'Exercises 1-10',
        studentPerformance: {
          'student-1': { participation: 4, understanding: 5 },
        },
        notes: 'Good session',
        createdAt: new Date(),
      };

      (sessionReportService.createSessionReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .post('/api/sessions/session-123/report')
        .send({
          topicsCovered: 'Algebra',
          homeworkAssigned: 'Exercises 1-10',
          studentPerformance: {
            'student-1': { participation: 4, understanding: 5 },
          },
          notes: 'Good session',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockReport.id);
      expect(response.body.data.topicsCovered).toBe(mockReport.topicsCovered);
      expect(response.body.message).toBe('Session report submitted successfully');
    });

    it('should return 400 if student performance is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/report')
        .send({
          topicsCovered: 'Algebra',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Student performance ratings are required');
    });

    it('should return 404 if session not found', async () => {
      (sessionReportService.createSessionReport as jest.Mock).mockRejectedValue(
        new NotFoundError('Session')
      );

      const response = await request(app)
        .post('/api/sessions/session-123/report')
        .send({
          studentPerformance: {
            'student-1': { participation: 4, understanding: 5 },
          },
        });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('GET /api/sessions/:id/report', () => {
    it('should get a session report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        sessionId: 'session-123',
        tutorId: 'test-user-123',
        topicsCovered: 'Algebra',
        homeworkAssigned: 'Exercises 1-10',
        studentPerformance: {},
        notes: 'Good session',
        createdAt: new Date(),
      };

      (sessionReportService.getSessionReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app).get('/api/sessions/session-123/report');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockReport.id);
      expect(response.body.data.topicsCovered).toBe(mockReport.topicsCovered);
    });

    it('should return 404 if report not found', async () => {
      (sessionReportService.getSessionReport as jest.Mock).mockRejectedValue(
        new NotFoundError('Session report')
      );

      const response = await request(app).get('/api/sessions/session-123/report');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 403 if user is not authorized', async () => {
      (sessionReportService.getSessionReport as jest.Mock).mockRejectedValue(
        new AuthorizationError('Only the tutor or class members can view this report')
      );

      const response = await request(app).get('/api/sessions/session-123/report');

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Only the tutor or class members can view this report');
    });
  });

  describe('PUT /api/sessions/:id/report', () => {
    it('should update a session report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        sessionId: 'session-123',
        tutorId: 'test-user-123',
        topicsCovered: 'Updated topics',
        homeworkAssigned: 'Updated homework',
        studentPerformance: {},
        notes: 'Updated notes',
        createdAt: new Date(),
      };

      (sessionReportService.updateSessionReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .put('/api/sessions/session-123/report')
        .send({
          topicsCovered: 'Updated topics',
          homeworkAssigned: 'Updated homework',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topicsCovered).toBe('Updated topics');
      expect(response.body.message).toBe('Session report updated successfully');
    });

    it('should return 404 if report not found', async () => {
      (sessionReportService.updateSessionReport as jest.Mock).mockRejectedValue(
        new NotFoundError('Session report')
      );

      const response = await request(app)
        .put('/api/sessions/session-123/report')
        .send({
          topicsCovered: 'Updated topics',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('GET /api/sessions/reports/tutor', () => {
    it('should get all reports for a tutor', async () => {
      const mockReports = [
        {
          id: 'report-1',
          sessionId: 'session-1',
          tutorId: 'test-user-123',
          topicsCovered: 'Algebra',
          createdAt: new Date(),
        },
        {
          id: 'report-2',
          sessionId: 'session-2',
          tutorId: 'test-user-123',
          topicsCovered: 'Geometry',
          createdAt: new Date(),
        },
      ];

      (sessionReportService.getTutorReports as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app).get('/api/sessions/reports/tutor');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('report-1');
      expect(response.body.data[1].id).toBe('report-2');
    });

    it('should filter reports by date range', async () => {
      (sessionReportService.getTutorReports as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/sessions/reports/tutor')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        });

      expect(response.status).toBe(200);
      expect(sessionReportService.getTutorReports).toHaveBeenCalledWith('test-user-123', {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      });
    });
  });

  describe('GET /api/sessions/reports/student', () => {
    it('should get all reports for a student', async () => {
      const mockReports = [
        {
          id: 'report-1',
          sessionId: 'session-1',
          tutorId: 'tutor-123',
          topicsCovered: 'Algebra',
          createdAt: new Date(),
        },
      ];

      (sessionReportService.getStudentReports as jest.Mock).mockResolvedValue(mockReports);

      const response = await request(app).get('/api/sessions/reports/student');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('report-1');
    });
  });
});
