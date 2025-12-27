import { PrismaClient } from '@prisma/client';
import {
  createRecurringAvailability,
  createOneTimeAvailability,
  getTutorAvailability,
  deleteAvailability,
  checkAvailability,
} from '../tutor-availability.service';

const prisma = new PrismaClient();

// Helper to clean up test data
async function cleanupTestData(tutorId: string) {
  await prisma.tutorAvailability.deleteMany({ where: { tutorId } });
  await prisma.tutorProfile.deleteMany({ where: { userId: tutorId } });
  await prisma.user.deleteMany({ where: { id: tutorId } });
}

describe('Tutor Availability Service', () => {
  let testTutorId: string;

  beforeAll(async () => {
    // Create a test tutor
    const tutor = await prisma.user.create({
      data: {
        email: `tutor-${Date.now()}@example.com`,
        passwordHash: 'test',
        firstName: 'Test',
        lastName: 'Tutor',
        role: 'TUTOR',
      },
    });
    testTutorId = tutor.id;

    // Create tutor profile
    await prisma.tutorProfile.create({
      data: {
        userId: testTutorId,
        hourlyRate: 50,
        subjects: ['Mathematics', 'Physics'],
        educationLevels: ['HIGH_SCHOOL'],
        languages: ['English'],
        teachingMode: 'BOTH',
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData(testTutorId);
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up availability entries after each test
    await prisma.tutorAvailability.deleteMany({ where: { tutorId: testTutorId } });
  });

  describe('createRecurringAvailability', () => {
    it('should create recurring availability with valid data', async () => {
      const availability = await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });

      expect(availability).toBeDefined();
      expect(availability.tutorId).toBe(testTutorId);
      expect(availability.dayOfWeek).toBe(1);
      expect(availability.startTime).toBe('09:00');
      expect(availability.endTime).toBe('17:00');
      expect(availability.isRecurring).toBe(true);
      expect(availability.specificDate).toBeNull();
      expect(availability.isActive).toBe(true);
    });

    it('should reject invalid dayOfWeek', async () => {
      await expect(
        createRecurringAvailability(testTutorId, {
          dayOfWeek: 7, // Invalid
          startTime: '09:00',
          endTime: '17:00',
        })
      ).rejects.toThrow('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    });

    it('should reject invalid time format', async () => {
      await expect(
        createRecurringAvailability(testTutorId, {
          dayOfWeek: 1,
          startTime: '9:00', // Invalid format
          endTime: '17:00',
        })
      ).rejects.toThrow('startTime must be in HH:MM format');
    });

    it('should reject startTime after endTime', async () => {
      await expect(
        createRecurringAvailability(testTutorId, {
          dayOfWeek: 1,
          startTime: '17:00',
          endTime: '09:00',
        })
      ).rejects.toThrow('startTime must be before endTime');
    });
  });

  describe('createOneTimeAvailability', () => {
    it('should create one-time availability with valid data', async () => {
      const specificDate = new Date('2025-12-30');
      
      const availability = await createOneTimeAvailability(testTutorId, {
        specificDate,
        startTime: '10:00',
        endTime: '14:00',
      });

      expect(availability).toBeDefined();
      expect(availability.tutorId).toBe(testTutorId);
      expect(availability.dayOfWeek).toBeNull();
      expect(availability.specificDate).toBeDefined();
      expect(availability.startTime).toBe('10:00');
      expect(availability.endTime).toBe('14:00');
      expect(availability.isRecurring).toBe(false);
      expect(availability.isActive).toBe(true);
    });

    it('should reject invalid time format', async () => {
      await expect(
        createOneTimeAvailability(testTutorId, {
          specificDate: new Date('2025-12-30'),
          startTime: '10:00',
          endTime: '2:00 PM', // Invalid format
        })
      ).rejects.toThrow('endTime must be in HH:MM format');
    });
  });

  describe('getTutorAvailability', () => {
    it('should return all active availability entries', async () => {
      // Create multiple availability entries
      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });

      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '16:00',
      });

      await createOneTimeAvailability(testTutorId, {
        specificDate: new Date('2025-12-30'),
        startTime: '10:00',
        endTime: '14:00',
      });

      const availability = await getTutorAvailability(testTutorId);

      expect(availability.length).toBe(3);
      expect(availability.every(a => a.isActive)).toBe(true);
    });

    it('should not return deleted availability', async () => {
      const avail = await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });

      await deleteAvailability(avail.id, testTutorId);

      const availability = await getTutorAvailability(testTutorId);
      expect(availability.length).toBe(0);
    });
  });

  describe('deleteAvailability', () => {
    it('should soft delete availability', async () => {
      const avail = await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });

      await deleteAvailability(avail.id, testTutorId);

      const deleted = await prisma.tutorAvailability.findUnique({
        where: { id: avail.id },
      });

      expect(deleted).toBeDefined();
      expect(deleted?.isActive).toBe(false);
    });

    it('should reject deletion by wrong tutor', async () => {
      const avail = await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });

      await expect(
        deleteAvailability(avail.id, 'wrong-tutor-id')
      ).rejects.toThrow('Availability does not belong to this tutor');
    });
  });

  describe('checkAvailability', () => {
    it('should return true for matching recurring availability', async () => {
      // Create recurring availability for Monday 09:00-17:00
      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });

      // Check availability on a Monday at 10:00 for 2 hours
      const nextMonday = new Date('2025-12-29T10:00:00'); // Monday
      const isAvailable = await checkAvailability(testTutorId, nextMonday, 2);

      expect(isAvailable).toBe(true);
    });

    it('should return false when no availability matches', async () => {
      // Create recurring availability for Monday
      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });

      // Check availability on a Tuesday
      const tuesday = new Date('2025-12-30T10:00:00'); // Tuesday
      const isAvailable = await checkAvailability(testTutorId, tuesday, 2);

      expect(isAvailable).toBe(false);
    });

    it('should prioritize one-time over recurring availability', async () => {
      // Create recurring availability for Monday 09:00-17:00
      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });

      // Create one-time availability for specific Monday 10:00-12:00
      const specificMonday = new Date('2025-12-29');
      await createOneTimeAvailability(testTutorId, {
        specificDate: specificMonday,
        startTime: '10:00',
        endTime: '12:00',
      });

      // Check at 10:00 for 1 hour - should match one-time
      const checkTime = new Date('2025-12-29T10:00:00');
      const isAvailable = await checkAvailability(testTutorId, checkTime, 1);
      expect(isAvailable).toBe(true);

      // Check at 14:00 for 1 hour - should NOT match (one-time overrides recurring)
      const checkTime2 = new Date('2025-12-29T14:00:00');
      const isAvailable2 = await checkAvailability(testTutorId, checkTime2, 1);
      expect(isAvailable2).toBe(false);
    });

    it('should return false when time extends beyond availability', async () => {
      await createRecurringAvailability(testTutorId, {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });

      // Check at 16:00 for 2 hours (extends to 18:00, beyond 17:00)
      const checkTime = new Date('2025-12-29T16:00:00');
      const isAvailable = await checkAvailability(testTutorId, checkTime, 2);

      expect(isAvailable).toBe(false);
    });
  });
});
