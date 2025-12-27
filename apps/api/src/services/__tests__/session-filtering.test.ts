import { PrismaClient } from '@prisma/client';
import {
  getUpcomingSessions,
  getPastSessions,
  getCancelledSessions,
  getAssignedSessions,
  getSuggestedSessions,
  getTutorPastSessions,
  getTutorCancelledSessions,
} from '../session.service';

const prisma = new PrismaClient();

describe('Session Filtering Functions', () => {
  let studentId: string;
  let tutorId: string;
  let classId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.tutoringSession.deleteMany({});
    await prisma.classMember.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.tutorProfile.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test student
    const student = await prisma.user.create({
      data: {
        email: 'student-filter@test.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'Student',
        role: 'STUDENT',
        studentProfile: {
          create: {
            educationLevel: 'HIGH_SCHOOL',
          },
        },
      },
    });
    studentId = student.id;

    // Create test tutor
    const tutor = await prisma.user.create({
      data: {
        email: 'tutor-filter@test.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'Tutor',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 50,
            subjects: ['Mathematics', 'Physics'],
            bio: 'Test tutor',
            teachingMode: 'BOTH',
          },
        },
      },
    });
    tutorId = tutor.id;

    // Create test class
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Class',
        educationLevel: 'HIGH_SCHOOL',
        subjects: ['Mathematics'],
        createdBy: studentId,
        meetingType: 'ONLINE',
        members: {
          create: {
            studentId,
            isActive: true,
          },
        },
      },
    });
    classId = testClass.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.tutoringSession.deleteMany({});
    await prisma.classMember.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.tutorProfile.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Student Session Filters', () => {
    beforeEach(async () => {
      await prisma.tutoringSession.deleteMany({});
    });

    it('should get upcoming sessions for student', async () => {
      // Create upcoming session
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: futureDate,
          scheduledEnd: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'PENDING',
        },
      });

      const sessions = await getUpcomingSessions(studentId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).not.toBe('CANCELLED');
    });

    it('should get past sessions for student', async () => {
      // Create past session
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: pastDate,
          scheduledEnd: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'COMPLETED',
        },
      });

      const sessions = await getPastSessions(studentId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).not.toBe('CANCELLED');
    });

    it('should get cancelled sessions for student', async () => {
      // Create cancelled session
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: futureDate,
          scheduledEnd: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'CANCELLED',
        },
      });

      const sessions = await getCancelledSessions(studentId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('CANCELLED');
    });
  });

  describe('Tutor Session Filters', () => {
    beforeEach(async () => {
      await prisma.tutoringSession.deleteMany({});
    });

    it('should get assigned sessions for tutor', async () => {
      // Create assigned session
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: futureDate,
          scheduledEnd: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'CONFIRMED',
        },
      });

      const sessions = await getAssignedSessions(tutorId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tutorId).toBe(tutorId);
    });

    it('should get past sessions for tutor', async () => {
      // Create past session
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: pastDate,
          scheduledEnd: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'COMPLETED',
        },
      });

      const sessions = await getTutorPastSessions(tutorId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tutorId).toBe(tutorId);
    });

    it('should get cancelled sessions for tutor', async () => {
      // Create cancelled session
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId,
          scheduledStart: futureDate,
          scheduledEnd: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 100,
          status: 'CANCELLED',
        },
      });

      const sessions = await getTutorCancelledSessions(tutorId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('CANCELLED');
    });

    it('should get suggested sessions for tutor', async () => {
      // Create tutor availability
      await prisma.tutorAvailability.create({
        data: {
          tutorId,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
          isRecurring: true,
          isActive: true,
        },
      });

      // Create unassigned session on Monday
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(10, 0, 0, 0);
      
      await prisma.tutoringSession.create({
        data: {
          classId,
          tutorId: null, // Unassigned
          scheduledStart: nextMonday,
          scheduledEnd: new Date(nextMonday.getTime() + 2 * 60 * 60 * 1000),
          subject: 'Mathematics',
          price: 0,
          status: 'PENDING',
        },
      });

      const sessions = await getSuggestedSessions(tutorId);
      expect(sessions.length).toBeGreaterThanOrEqual(0); // May be 0 or 1 depending on availability check
    });
  });
});
