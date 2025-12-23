import request from 'supertest';
import app from '../../index';
import { register } from '../../services/auth.service';
import { createStudentProfile, createTutorProfile } from '../../services/profile.service';
import { createClass } from '../../services/class.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';

describe('Session Routes', () => {
  let studentToken: string;
  let tutorToken: string;
  let studentUserId: string;
  let tutorUserId: string;
  let classId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create and authenticate student
    const student = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student',
      role: Role.STUDENT,
    });
    studentUserId = student.user.id;
    studentToken = student.accessToken;

    await createStudentProfile({
      userId: studentUserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create and authenticate tutor
    const tutor = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Tutor',
      role: Role.TUTOR,
    });
    tutorUserId = tutor.user.id;
    tutorToken = tutor.accessToken;

    await createTutorProfile({
      userId: tutorUserId,
      hourlyRate: 50,
      subjects: ['mathematics', 'physics'],
      educationLevels: ['high_school', 'university'],
      languages: ['en', 'fr'],
      teachingMode: 'BOTH',
    });

    // Create a class
    const classData = await createClass(studentUserId, {
      name: 'Math Study Group',
      educationLevel: 'high_school',
      subject: 'mathematics',
      meetingType: 'ONLINE',
    });
    classId = classData.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/sessions', () => {
    it('should create a session with valid data', async () => {
      const now = new Date();
      const sessionData = {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
        subject: 'mathematics',
        description: 'Algebra review',
        price: 50,
        onlineMeetingLink: 'https://meet.example.com/session1',
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.classId).toBe(classId);
      expect(response.body.data.tutorId).toBe(tutorUserId);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should reject session creation without authentication', async () => {
      const now = new Date();
      const sessionData = {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
        subject: 'mathematics',
        price: 50,
      };

      await request(app).post('/api/sessions').send(sessionData).expect(401);
    });

    it('should reject session creation with missing required fields', async () => {
      const sessionData = {
        classId,
        tutorId: tutorUserId,
        // Missing scheduledStart, scheduledEnd, subject, price
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(sessionData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/sessions', () => {
    it('should get all sessions for authenticated user', async () => {
      const now = new Date();

      // Create a session
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter sessions by status', async () => {
      const now = new Date();

      // Create two sessions
      const session1Response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      // Confirm one session
      await request(app)
        .post(`/api/sessions/${session1Response.body.data.id}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(200);

      // Get only confirmed sessions
      const response = await request(app)
        .get('/api/sessions?status=CONFIRMED')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('CONFIRMED');
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should get session by ID', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/sessions/:id', () => {
    it('should update session details', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          description: 'Updated description',
          price: 60,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(parseFloat(response.body.data.price)).toBe(60);
    });
  });

  describe('POST /api/sessions/:id/confirm', () => {
    it('should confirm a pending session', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should reject confirmation by non-tutor', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('POST /api/sessions/:id/cancel', () => {
    it('should cancel a session', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/sessions/${sessionId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Student unavailable',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.data.cancellationReason).toBe('Student unavailable');
    });
  });

  describe('PUT /api/sessions/:id/status', () => {
    it('should update session status', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      // Confirm first
      await request(app)
        .post(`/api/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(200);

      // Then complete
      const response = await request(app)
        .put(`/api/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          status: 'COMPLETED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });

    it('should reject invalid status', async () => {
      const now = new Date();

      const createResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const sessionId = createResponse.body.data.id;

      await request(app)
        .put(`/api/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });
  });

  describe('GET /api/sessions/class/:classId', () => {
    it('should get all sessions for a class', async () => {
      const now = new Date();

      // Create two sessions
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000).toISOString(),
          subject: 'mathematics',
          price: 50,
        });

      const response = await request(app)
        .get(`/api/sessions/class/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });
});
