import { PrismaClient } from '@prisma/client';
import {
  generateSessionsForClass,
  generateSessionsForTimeSlot,
  checkSessionsExist,
  fillSessionGaps,
  cancelFutureSessionsForTimeSlot,
} from '../session-generator.service';

const prisma = new PrismaClient();

// Helper to clean up test data
async function cleanupTestData(classId: string) {
  await prisma.tutoringSession.deleteMany({ where: { classId } });
  await prisma.classSlotCancellation.deleteMany({
    where: { timeSlot: { classId } },
  });
  await prisma.classTutorAssignment.deleteMany({ where: { classId } });
  await prisma.classTimeSlot.deleteMany({ where: { classId } });
  await prisma.classMember.deleteMany({ where: { classId } });
  await prisma.class.deleteMany({ where: { id: classId } });
}

describe('Session Generator Service', () => {
  let testClassId: string;
  let testUserId: string;
  let testTimeSlotId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      },
    });
    testUserId = user.id;

    // Create a test class
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Class for Session Generation',
        createdBy: testUserId,
        educationLevel: { level: 'HIGH_SCHOOL' },
        subjects: ['Mathematics', 'Physics'],
        meetingType: 'ONLINE',
      },
    });
    testClassId = testClass.id;

    // Create a test time slot (Monday 14:00-16:00)
    const timeSlot = await prisma.classTimeSlot.create({
      data: {
        classId: testClassId,
        subject: 'Mathematics',
        dayOfWeek: 1, // Monday
        startTime: '14:00',
        endTime: '16:00',
      },
    });
    testTimeSlotId = timeSlot.id;
  });

  afterAll(async () => {
    await cleanupTestData(testClassId);
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('generateSessionsForTimeSlot', () => {
    it('should generate sessions for a time slot', async () => {
      const sessions = await generateSessionsForTimeSlot(testTimeSlotId, 2);
      
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.length).toBeLessThanOrEqual(2);
      
      // Verify session properties
      sessions.forEach(session => {
        expect(session.classId).toBe(testClassId);
        expect(session.subject).toBe('Mathematics');
        expect(session.status).toBe('PENDING');
        expect(session.tutorId).toBeNull();
        expect(session.price.toNumber()).toBe(0);
      });
    });

    it('should not create duplicate sessions', async () => {
      // Generate sessions first time
      const firstRun = await generateSessionsForTimeSlot(testTimeSlotId, 1);
      const firstCount = firstRun.length;
      
      // Try to generate again
      const secondRun = await generateSessionsForTimeSlot(testTimeSlotId, 1);
      
      // Should not create duplicates
      expect(secondRun.length).toBe(0);
      
      // Verify total count in database
      const allSessions = await prisma.tutoringSession.findMany({
        where: { classId: testClassId },
      });
      expect(allSessions.length).toBe(firstCount);
    });

    it('should skip cancelled weeks', async () => {
      // Get next Monday
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      // Cancel the time slot for next week
      await prisma.classSlotCancellation.create({
        data: {
          timeSlotId: testTimeSlotId,
          weekStart: nextMonday,
          reason: 'Test cancellation',
          createdBy: testUserId,
        },
      });

      // Try to generate sessions
      const sessions = await generateSessionsForTimeSlot(testTimeSlotId, 4, nextMonday);
      
      // Should skip the cancelled week
      const cancelledWeekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.scheduledStart);
        return sessionDate >= nextMonday && sessionDate < new Date(nextMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
      });
      
      expect(cancelledWeekSessions.length).toBe(0);
    });
  });

  describe('generateSessionsForClass', () => {
    it('should generate sessions for all time slots in a class', async () => {
      // Clean up existing sessions
      await prisma.tutoringSession.deleteMany({ where: { classId: testClassId } });
      
      const sessions = await generateSessionsForClass(testClassId, 2);
      
      expect(sessions.length).toBeGreaterThan(0);
      
      // All sessions should belong to the class
      sessions.forEach(session => {
        expect(session.classId).toBe(testClassId);
      });
    });
  });

  describe('checkSessionsExist', () => {
    it('should return true when sessions exist for a week', async () => {
      // Clean up and generate sessions
      await prisma.tutoringSession.deleteMany({ where: { classId: testClassId } });
      await generateSessionsForTimeSlot(testTimeSlotId, 1);
      
      const today = new Date();
      const exists = await checkSessionsExist(testClassId, today);
      
      expect(exists).toBe(true);
    });

    it('should return false when no sessions exist for a week', async () => {
      // Clean up all sessions
      await prisma.tutoringSession.deleteMany({ where: { classId: testClassId } });
      
      const today = new Date();
      const exists = await checkSessionsExist(testClassId, today);
      
      expect(exists).toBe(false);
    });
  });

  describe('cancelFutureSessionsForTimeSlot', () => {
    it('should cancel all future sessions for a time slot', async () => {
      // Clean up and generate sessions
      await prisma.tutoringSession.deleteMany({ where: { classId: testClassId } });
      await generateSessionsForTimeSlot(testTimeSlotId, 4);
      
      // Cancel future sessions
      const cancelledCount = await cancelFutureSessionsForTimeSlot(
        testTimeSlotId,
        'Test cancellation'
      );
      
      expect(cancelledCount).toBeGreaterThan(0);
      
      // Verify sessions are cancelled
      const cancelledSessions = await prisma.tutoringSession.findMany({
        where: {
          classId: testClassId,
          status: 'CANCELLED',
        },
      });
      
      expect(cancelledSessions.length).toBe(cancelledCount);
    });
  });

  describe('fillSessionGaps', () => {
    it('should fill missing weeks in the session schedule', async () => {
      // Clean up all sessions
      await prisma.tutoringSession.deleteMany({ where: { classId: testClassId } });
      
      const today = new Date();
      const fourWeeksLater = new Date(today);
      fourWeeksLater.setDate(today.getDate() + 28);
      
      // Fill gaps
      const sessions = await fillSessionGaps(testClassId, today, fourWeeksLater);
      
      expect(sessions.length).toBeGreaterThan(0);
      
      // Verify sessions were created
      const allSessions = await prisma.tutoringSession.findMany({
        where: { classId: testClassId },
      });
      
      expect(allSessions.length).toBe(sessions.length);
    });
  });
});
