import { PrismaClient } from '@prisma/client';
import {
  createConsortium,
  getConsortiumById,
  getTutorConsortiums,
  updateConsortium,
  deleteConsortium,
  addConsortiumMember,
  removeConsortiumMember,
  updateRevenuePolicy,
  inviteTutorsByEmail,
  getConsortiumMembers,
  calculateRevenueShares,
  CreateConsortiumData,
  RevenueDistributionPolicy,
} from '../consortium.service';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '@repo/utils';

const prisma = new PrismaClient();

describe('Consortium Service', () => {
  let testTutor1: any;
  let testTutor2: any;
  let testTutor3: any;
  let testStudent: any;

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
            'tutor1@test.com',
            'tutor2@test.com',
            'tutor3@test.com',
            'student@test.com',
          ],
        },
      },
    });

    // Create test tutors
    testTutor1 = await prisma.user.create({
      data: {
        email: 'tutor1@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Tutor',
        lastName: 'One',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 50,
            subjects: ['Math', 'Physics'],
            educationLevels: ['high_school', 'university'],
            languages: ['en', 'fr'],
            teachingMode: 'BOTH',
            experienceYears: 5,
          },
        },
      },
    });

    testTutor2 = await prisma.user.create({
      data: {
        email: 'tutor2@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Tutor',
        lastName: 'Two',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 60,
            subjects: ['Chemistry', 'Biology'],
            educationLevels: ['high_school'],
            languages: ['en'],
            teachingMode: 'ONLINE',
            experienceYears: 3,
          },
        },
      },
    });

    testTutor3 = await prisma.user.create({
      data: {
        email: 'tutor3@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Tutor',
        lastName: 'Three',
        role: 'TUTOR',
        tutorProfile: {
          create: {
            hourlyRate: 45,
            subjects: ['English', 'History'],
            educationLevels: ['middle_school', 'high_school'],
            languages: ['en', 'es'],
            teachingMode: 'IN_PERSON',
            experienceYears: 7,
          },
        },
      },
    });

    testStudent = await prisma.user.create({
      data: {
        email: 'student@test.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
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
            'tutor1@test.com',
            'tutor2@test.com',
            'tutor3@test.com',
            'student@test.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('calculateRevenueShares', () => {
    it('should calculate equal shares correctly', () => {
      const policy: RevenueDistributionPolicy = { type: 'equal' };
      const memberIds = ['id1', 'id2', 'id3'];

      const shares = calculateRevenueShares(policy, memberIds);

      expect(shares['id1']).toBeCloseTo(33.33, 2);
      expect(shares['id2']).toBeCloseTo(33.33, 2);
      expect(shares['id3']).toBeCloseTo(33.33, 2);
    });

    it('should calculate custom shares correctly', () => {
      const policy: RevenueDistributionPolicy = {
        type: 'custom',
        customShares: {
          id1: 50,
          id2: 30,
          id3: 20,
        },
      };
      const memberIds = ['id1', 'id2', 'id3'];

      const shares = calculateRevenueShares(policy, memberIds);

      expect(shares['id1']).toBe(50);
      expect(shares['id2']).toBe(30);
      expect(shares['id3']).toBe(20);
    });

    it('should throw error for custom shares without customShares object', () => {
      const policy: RevenueDistributionPolicy = { type: 'custom' };
      const memberIds = ['id1', 'id2'];

      expect(() => calculateRevenueShares(policy, memberIds)).toThrow(ValidationError);
    });
  });

  describe('createConsortium', () => {
    it('should create a consortium with coordinator as first member', async () => {
      const consortiumData: CreateConsortiumData = {
        name: 'Test Consortium',
        description: 'A test consortium',
        revenueDistributionPolicy: { type: 'equal' },
      };

      const consortium = await createConsortium(testTutor1.id, consortiumData);

      expect(consortium).toBeDefined();
      expect(consortium.name).toBe('Test Consortium');
      expect(consortium.createdBy).toBe(testTutor1.id);
      expect(consortium.members).toHaveLength(1);
      expect(consortium.members[0].tutorId).toBe(testTutor1.id);
      expect(consortium.members[0].role).toBe('COORDINATOR');
      expect(consortium.members[0].revenueShare).toEqual(expect.any(Object));
    });

    it('should throw error if user is not a tutor', async () => {
      const consortiumData: CreateConsortiumData = {
        name: 'Invalid Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      };

      await expect(createConsortium(testStudent.id, consortiumData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw error if name is missing', async () => {
      const consortiumData: CreateConsortiumData = {
        name: '',
        revenueDistributionPolicy: { type: 'equal' },
      };

      await expect(createConsortium(testTutor1.id, consortiumData)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getConsortiumById', () => {
    let testConsortium: any;

    beforeAll(async () => {
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Get Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
    });

    it('should retrieve consortium by ID', async () => {
      const consortium = await getConsortiumById(testConsortium.id);

      expect(consortium).toBeDefined();
      expect(consortium.id).toBe(testConsortium.id);
      expect(consortium.name).toBe('Get Test Consortium');
    });

    it('should throw error for non-existent consortium', async () => {
      await expect(getConsortiumById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTutorConsortiums', () => {
    it('should retrieve all consortiums for a tutor', async () => {
      const consortiums = await getTutorConsortiums(testTutor1.id);

      expect(consortiums).toBeDefined();
      expect(Array.isArray(consortiums)).toBe(true);
      expect(consortiums.length).toBeGreaterThan(0);
    });
  });

  describe('updateConsortium', () => {
    let testConsortium: any;

    beforeAll(async () => {
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Update Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
    });

    it('should update consortium information', async () => {
      const updated = await updateConsortium(testConsortium.id, testTutor1.id, {
        name: 'Updated Consortium Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Consortium Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should throw error if user is not coordinator', async () => {
      await expect(
        updateConsortium(testConsortium.id, testTutor2.id, {
          name: 'Unauthorized Update',
        })
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('addConsortiumMember', () => {
    let testConsortium: any;

    beforeEach(async () => {
      // Create fresh consortium for each test
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Member Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
    });

    it('should add a member to consortium', async () => {
      const member = await addConsortiumMember(
        testConsortium.id,
        testTutor2.id,
        testTutor1.id
      );

      expect(member).toBeDefined();
      expect(member.tutorId).toBe(testTutor2.id);
      expect(member.role).toBe('MEMBER');
    });

    it('should recalculate revenue shares when adding member', async () => {
      await addConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);

      const members = await getConsortiumMembers(testConsortium.id);
      expect(members).toHaveLength(2);

      // With equal distribution, each should have 50%
      members.forEach(member => {
        expect(Number(member.revenueShare)).toBeCloseTo(50, 1);
      });
    });

    it('should throw error if tutor is already a member', async () => {
      await addConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);

      await expect(
        addConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id)
      ).rejects.toThrow(ConflictError);
    });

    it('should throw error if non-coordinator tries to add member', async () => {
      await expect(
        addConsortiumMember(testConsortium.id, testTutor3.id, testTutor2.id)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw error if trying to add a student', async () => {
      await expect(
        addConsortiumMember(testConsortium.id, testStudent.id, testTutor1.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeConsortiumMember', () => {
    let testConsortium: any;

    beforeEach(async () => {
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Remove Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
      await addConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);
      await addConsortiumMember(testConsortium.id, testTutor3.id, testTutor1.id);
    });

    it('should remove a member from consortium', async () => {
      await removeConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);

      const members = await getConsortiumMembers(testConsortium.id);
      expect(members).toHaveLength(2);
      expect(members.find(m => m.tutorId === testTutor2.id)).toBeUndefined();
    });

    it('should recalculate revenue shares after removing member', async () => {
      await removeConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);

      const members = await getConsortiumMembers(testConsortium.id);
      expect(members).toHaveLength(2);

      // With equal distribution and 2 members, each should have 50%
      members.forEach(member => {
        expect(Number(member.revenueShare)).toBeCloseTo(50, 1);
      });
    });

    it('should throw error if non-coordinator tries to remove member', async () => {
      await expect(
        removeConsortiumMember(testConsortium.id, testTutor3.id, testTutor2.id)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw error when removing coordinator as only member', async () => {
      // Remove all other members first
      await removeConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);
      await removeConsortiumMember(testConsortium.id, testTutor3.id, testTutor1.id);

      await expect(
        removeConsortiumMember(testConsortium.id, testTutor1.id, testTutor1.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateRevenuePolicy', () => {
    let testConsortium: any;

    beforeEach(async () => {
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Policy Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
      await addConsortiumMember(testConsortium.id, testTutor2.id, testTutor1.id);
    });

    it('should update revenue policy and recalculate shares', async () => {
      const newPolicy: RevenueDistributionPolicy = {
        type: 'custom',
        customShares: {
          [testTutor1.id]: 60,
          [testTutor2.id]: 40,
        },
      };

      const updated = await updateRevenuePolicy(
        testConsortium.id,
        testTutor1.id,
        newPolicy
      );

      expect(updated).toBeDefined();

      const members = await getConsortiumMembers(testConsortium.id);
      const member1 = members.find(m => m.tutorId === testTutor1.id);
      const member2 = members.find(m => m.tutorId === testTutor2.id);

      expect(Number(member1?.revenueShare)).toBe(60);
      expect(Number(member2?.revenueShare)).toBe(40);
    });

    it('should throw error if shares do not sum to 100%', async () => {
      const invalidPolicy: RevenueDistributionPolicy = {
        type: 'custom',
        customShares: {
          [testTutor1.id]: 60,
          [testTutor2.id]: 30, // Only sums to 90%
        },
      };

      await expect(
        updateRevenuePolicy(testConsortium.id, testTutor1.id, invalidPolicy)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if non-coordinator tries to update policy', async () => {
      const newPolicy: RevenueDistributionPolicy = { type: 'equal' };

      await expect(
        updateRevenuePolicy(testConsortium.id, testTutor2.id, newPolicy)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('inviteTutorsByEmail', () => {
    let testConsortium: any;

    beforeEach(async () => {
      testConsortium = await createConsortium(testTutor1.id, {
        name: 'Invite Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });
    });

    it('should invite tutors by email', async () => {
      const result = await inviteTutorsByEmail(
        testConsortium.id,
        ['tutor2@test.com', 'tutor3@test.com'],
        testTutor1.id
      );

      expect(result.invited).toHaveLength(2);
      expect(result.invited).toContain('tutor2@test.com');
      expect(result.invited).toContain('tutor3@test.com');
      expect(result.failed).toHaveLength(0);
    });

    it('should handle non-existent emails', async () => {
      const result = await inviteTutorsByEmail(
        testConsortium.id,
        ['nonexistent@test.com'],
        testTutor1.id
      );

      expect(result.invited).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed).toContain('nonexistent@test.com');
    });

    it('should handle student emails', async () => {
      const result = await inviteTutorsByEmail(
        testConsortium.id,
        ['student@test.com'],
        testTutor1.id
      );

      expect(result.invited).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed).toContain('student@test.com');
    });

    it('should throw error if non-coordinator tries to invite', async () => {
      await expect(
        inviteTutorsByEmail(testConsortium.id, ['tutor3@test.com'], testTutor2.id)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteConsortium', () => {
    it('should soft delete a consortium', async () => {
      const consortium = await createConsortium(testTutor1.id, {
        name: 'Delete Test Consortium',
        revenueDistributionPolicy: { type: 'equal' },
      });

      await deleteConsortium(consortium.id, testTutor1.id);

      const deleted = await prisma.consortium.findUnique({
        where: { id: consortium.id },
      });

      expect(deleted?.isActive).toBe(false);
    });

    it('should throw error if non-coordinator tries to delete', async () => {
      const consortium = await createConsortium(testTutor1.id, {
        name: 'Delete Auth Test',
        revenueDistributionPolicy: { type: 'equal' },
      });

      await expect(deleteConsortium(consortium.id, testTutor2.id)).rejects.toThrow(
        AuthorizationError
      );
    });
  });
});
