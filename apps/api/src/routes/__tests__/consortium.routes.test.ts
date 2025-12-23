import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';
import { generateAccessToken } from '../../services/auth.service';

const prisma = new PrismaClient();

describe('Consortium Routes', () => {
  let testTutor1: any;
  let testTutor2: any;
  let testStudent: any;
  let tutor1Token: string;
  let tutor2Token: string;
  let studentToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.consortiumMember.deleteMany({});
    await prisma.consortium.deleteMany({});
    await prisma.tutorProfile.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'consortium-tutor1@test.com',
            'consortium-tutor2@test.com',
            'consortium-student@test.com',
          ],
        },
      },
    });

    // Create test users
    testTutor1 = await prisma.user.create({
      data: {
        email: 'consortium-tutor1@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Consortium',
        lastName: 'Tutor1',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 50,
            subjects: ['Math'],
            educationLevels: ['high_school'],
            languages: ['en'],
            teachingMode: 'BOTH',
            experienceYears: 5,
          },
        },
      },
    });

    testTutor2 = await prisma.user.create({
      data: {
        email: 'consortium-tutor2@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Consortium',
        lastName: 'Tutor2',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 60,
            subjects: ['Physics'],
            educationLevels: ['high_school'],
            languages: ['en'],
            teachingMode: 'ONLINE',
            experienceYears: 3,
          },
        },
      },
    });

    testStudent = await prisma.user.create({
      data: {
        email: 'consortium-student@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Consortium',
        lastName: 'Student',
        role: 'STUDENT',
        studentProfile: {
          create: {
            educationLevel: 'high_school',
            preferredSubjects: ['Math'],
          },
        },
      },
    });

    // Generate tokens
    tutor1Token = generateAccessToken({
      userId: testTutor1.id,
      email: testTutor1.email,
      role: testTutor1.role,
    });
    tutor2Token = generateAccessToken({
      userId: testTutor2.id,
      email: testTutor2.email,
      role: testTutor2.role,
    });
    studentToken = generateAccessToken({
      userId: testStudent.id,
      email: testStudent.email,
      role: testStudent.role,
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.consortiumMember.deleteMany({});
    await prisma.consortium.deleteMany({});
    await prisma.tutorProfile.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'consortium-tutor1@test.com',
            'consortium-tutor2@test.com',
            'consortium-student@test.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/consortiums', () => {
    it('should create a new consortium', async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Test Consortium',
          description: 'A test consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Consortium');
      expect(response.body.data.members).toHaveLength(1);
    });

    it('should reject consortium creation by student', async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Invalid Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });

      expect(response.status).toBe(400);
    });

    it('should reject consortium creation without authentication', async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .send({
          name: 'Unauthorized Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/consortiums', () => {
    it('should get all consortiums for a tutor', async () => {
      const response = await request(app)
        .get('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/consortiums/:id', () => {
    let consortiumId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Get Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });
      consortiumId = response.body.data.id;
    });

    it('should get consortium by ID', async () => {
      const response = await request(app)
        .get(`/api/consortiums/${consortiumId}`)
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(consortiumId);
    });

    it('should return 404 for non-existent consortium', async () => {
      const response = await request(app)
        .get('/api/consortiums/non-existent-id')
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/consortiums/:id/members', () => {
    let consortiumId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Member Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });
      consortiumId = response.body.data.id;
    });

    it('should add a member to consortium', async () => {
      const response = await request(app)
        .post(`/api/consortiums/${consortiumId}/members`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          tutorId: testTutor2.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tutorId).toBe(testTutor2.id);
    });

    it('should reject adding member by non-coordinator', async () => {
      const response = await request(app)
        .post(`/api/consortiums/${consortiumId}/members`)
        .set('Authorization', `Bearer ${tutor2Token}`)
        .send({
          tutorId: testTutor2.id,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/consortiums/:id/policy', () => {
    let consortiumId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Policy Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });
      consortiumId = response.body.data.id;

      // Add second member
      await request(app)
        .post(`/api/consortiums/${consortiumId}/members`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          tutorId: testTutor2.id,
        });
    });

    it('should update revenue policy', async () => {
      const response = await request(app)
        .put(`/api/consortiums/${consortiumId}/policy`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          revenueDistributionPolicy: {
            type: 'custom',
            customShares: {
              [testTutor1.id]: 60,
              [testTutor2.id]: 40,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid revenue policy', async () => {
      const response = await request(app)
        .put(`/api/consortiums/${consortiumId}/policy`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          revenueDistributionPolicy: {
            type: 'custom',
            customShares: {
              [testTutor1.id]: 60,
              [testTutor2.id]: 30, // Only sums to 90%
            },
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/consortiums/:id/invite', () => {
    let consortiumId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Invite Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });
      consortiumId = response.body.data.id;
    });

    it('should invite tutors by email', async () => {
      const response = await request(app)
        .post(`/api/consortiums/${consortiumId}/invite`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          emails: ['consortium-tutor2@test.com'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invited).toContain('consortium-tutor2@test.com');
    });
  });

  describe('DELETE /api/consortiums/:id/members/:tutorId', () => {
    let consortiumId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Remove Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });
      consortiumId = response.body.data.id;

      // Add second member
      await request(app)
        .post(`/api/consortiums/${consortiumId}/members`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          tutorId: testTutor2.id,
        });
    });

    it('should remove a member from consortium', async () => {
      const response = await request(app)
        .delete(`/api/consortiums/${consortiumId}/members/${testTutor2.id}`)
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject removal by non-coordinator', async () => {
      const response = await request(app)
        .delete(`/api/consortiums/${consortiumId}/members/${testTutor2.id}`)
        .set('Authorization', `Bearer ${tutor2Token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/consortiums/:id', () => {
    it('should delete a consortium', async () => {
      const createResponse = await request(app)
        .post('/api/consortiums')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          name: 'Delete Test Consortium',
          revenueDistributionPolicy: { type: 'equal' },
        });

      const consortiumId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/consortiums/${consortiumId}`)
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
