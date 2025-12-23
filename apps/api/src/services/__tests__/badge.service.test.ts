import { PrismaClient, BadgeCategory } from '@prisma/client';
import {
  createBadge,
  getAllBadges,
  getBadgesByCategory,
  getBadgesWithStatus,
  getUserBadges,
  awardBadge,
  checkAssiduBadge,
  checkMentorBadge,
  checkPedagogueBadge,
  checkExpertVerifieBadge,
  checkAllBadges,
  getLoyaltyPoints,
  getBadgeStatistics,
  CreateBadgeData,
} from '../badge.service';
import { ValidationError, NotFoundError } from '@repo/utils';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    badge: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    userBadge: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    BadgeCategory: {
      STUDENT: 'STUDENT',
      TUTOR: 'TUTOR',
      BOTH: 'BOTH',
    },
  };
});

const prisma = new PrismaClient();

describe('Badge Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBadge', () => {
    const validBadgeData: CreateBadgeData = {
      name: 'Test Badge',
      description: 'A test badge',
      category: 'STUDENT' as BadgeCategory,
      criteria: {
        type: 'test',
        threshold: 10,
      },
    };

    it('should create a badge successfully', async () => {
      const mockBadge = {
        id: 'badge-123',
        ...validBadgeData,
        iconUrl: null,
      };

      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.badge.create as jest.Mock).mockResolvedValue(mockBadge);

      const result = await createBadge(validBadgeData);

      expect(result).toEqual(mockBadge);
      expect(prisma.badge.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if badge name already exists', async () => {
      const existingBadge = {
        id: 'badge-123',
        name: 'Test Badge',
      };

      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(existingBadge);

      await expect(createBadge(validBadgeData)).rejects.toThrow(ValidationError);
      await expect(createBadge(validBadgeData)).rejects.toThrow('Badge with name "Test Badge" already exists');
    });
  });

  describe('getAllBadges', () => {
    it('should return all badges', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'Badge 1',
          description: 'First badge',
          category: 'STUDENT',
          criteria: {},
        },
        {
          id: 'badge-2',
          name: 'Badge 2',
          description: 'Second badge',
          category: 'TUTOR',
          criteria: {},
        },
      ];

      (prisma.badge.findMany as jest.Mock).mockResolvedValue(mockBadges);

      const result = await getAllBadges();

      expect(result).toEqual(mockBadges);
      expect(prisma.badge.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return badges for a specific category', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'Student Badge',
          category: 'STUDENT',
        },
      ];

      (prisma.badge.findMany as jest.Mock).mockResolvedValue(mockBadges);

      const result = await getBadgesByCategory('STUDENT' as BadgeCategory);

      expect(result).toEqual(mockBadges);
      expect(prisma.badge.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { category: 'STUDENT' },
            { category: 'BOTH' },
          ],
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getBadgesWithStatus', () => {
    const userId = 'user-123';

    it('should return all badges with earned status', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'Badge 1',
          description: 'First badge',
          category: 'STUDENT',
          criteria: {},
          iconUrl: null,
        },
        {
          id: 'badge-2',
          name: 'Badge 2',
          description: 'Second badge',
          category: 'STUDENT',
          criteria: {},
          iconUrl: null,
        },
      ];

      const mockUserBadges = [
        {
          id: 'user-badge-1',
          userId,
          badgeId: 'badge-1',
          earnedAt: new Date('2025-01-15'),
          badge: mockBadges[0],
        },
      ];

      (prisma.badge.findMany as jest.Mock).mockResolvedValue(mockBadges);
      (prisma.userBadge.findMany as jest.Mock).mockResolvedValue(mockUserBadges);

      const result = await getBadgesWithStatus(userId);

      expect(result).toHaveLength(2);
      expect(result[0].earned).toBe(true);
      expect(result[0].earnedAt).toEqual(new Date('2025-01-15'));
      expect(result[1].earned).toBe(false);
      expect(result[1].earnedAt).toBeUndefined();
    });
  });

  describe('getUserBadges', () => {
    const userId = 'user-123';

    it('should return earned badges for a user', async () => {
      const mockUserBadges = [
        {
          id: 'user-badge-1',
          userId,
          badgeId: 'badge-1',
          earnedAt: new Date('2025-01-15'),
          badge: {
            id: 'badge-1',
            name: 'Badge 1',
            description: 'First badge',
            category: 'STUDENT',
            criteria: {},
            iconUrl: null,
          },
        },
      ];

      (prisma.userBadge.findMany as jest.Mock).mockResolvedValue(mockUserBadges);

      const result = await getUserBadges(userId);

      expect(result).toEqual(mockUserBadges);
      expect(prisma.userBadge.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });
    });
  });

  describe('awardBadge', () => {
    const userId = 'user-123';
    const badgeId = 'badge-123';

    const mockBadge = {
      id: badgeId,
      name: 'Test Badge',
      description: 'A test badge',
      category: 'STUDENT',
      criteria: {},
      iconUrl: null,
    };

    it('should award a badge successfully', async () => {
      const mockUserBadge = {
        id: 'user-badge-123',
        userId,
        badgeId,
        earnedAt: new Date(),
      };

      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue(mockUserBadge);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const result = await awardBadge(userId, badgeId);

      expect(result).toEqual(mockUserBadge);
      expect(prisma.userBadge.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: 100,
          },
        },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should return existing badge if already awarded', async () => {
      const existingUserBadge = {
        id: 'user-badge-123',
        userId,
        badgeId,
        earnedAt: new Date('2025-01-01'),
      };

      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(existingUserBadge);

      const result = await awardBadge(userId, badgeId);

      expect(result).toEqual(existingUserBadge);
      expect(prisma.userBadge.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if badge does not exist', async () => {
      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(awardBadge(userId, badgeId)).rejects.toThrow(NotFoundError);
      await expect(awardBadge(userId, badgeId)).rejects.toThrow('Badge not found');
    });

    it('should skip notification if skipNotification is true', async () => {
      const mockUserBadge = {
        id: 'user-badge-123',
        userId,
        badgeId,
        earnedAt: new Date(),
      };

      (prisma.badge.findUnique as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue(mockUserBadge);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await awardBadge(userId, badgeId, true);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('checkAssiduBadge', () => {
    const userId = 'user-123';

    it('should award Assidu badge for 95% attendance', async () => {
      const mockUser = {
        id: userId,
        role: 'STUDENT',
      };

      const mockAttendances = [
        { id: '1', status: 'PRESENT' },
        { id: '2', status: 'PRESENT' },
        { id: '3', status: 'PRESENT' },
        { id: '4', status: 'PRESENT' },
        { id: '5', status: 'PRESENT' },
        { id: '6', status: 'PRESENT' },
        { id: '7', status: 'PRESENT' },
        { id: '8', status: 'PRESENT' },
        { id: '9', status: 'PRESENT' },
        { id: '10', status: 'PRESENT' },
        { id: '11', status: 'PRESENT' },
        { id: '12', status: 'PRESENT' },
        { id: '13', status: 'PRESENT' },
        { id: '14', status: 'PRESENT' },
        { id: '15', status: 'PRESENT' },
        { id: '16', status: 'PRESENT' },
        { id: '17', status: 'PRESENT' },
        { id: '18', status: 'PRESENT' },
        { id: '19', status: 'PRESENT' },
        { id: '20', status: 'ABSENT' }, // 95% = 19/20
      ];

      const mockBadge = {
        id: 'badge-assidu',
        name: 'Assidu',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockAttendances);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      await checkAssiduBadge(userId);

      expect(prisma.userBadge.create).toHaveBeenCalled();
    });

    it('should not award badge for attendance below 95%', async () => {
      const mockUser = {
        id: userId,
        role: 'STUDENT',
      };

      const mockAttendances = [
        { id: '1', status: 'PRESENT' },
        { id: '2', status: 'PRESENT' },
        { id: '3', status: 'ABSENT' },
        { id: '4', status: 'ABSENT' },
      ]; // 50% attendance

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockAttendances);

      await checkAssiduBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });

    it('should not award badge for non-students', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkAssiduBadge(userId);

      expect(prisma.attendance.findMany).not.toHaveBeenCalled();
    });
  });

  describe('checkMentorBadge', () => {
    const userId = 'user-123';

    it('should award Mentor badge for 100 hours taught', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          totalHoursTaught: 100,
        },
      };

      const mockBadge = {
        id: 'badge-mentor',
        name: 'Mentor',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      await checkMentorBadge(userId);

      expect(prisma.userBadge.create).toHaveBeenCalled();
    });

    it('should not award badge for less than 100 hours', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          totalHoursTaught: 50,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkMentorBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });

    it('should not award badge for non-tutors', async () => {
      const mockUser = {
        id: userId,
        role: 'STUDENT',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkMentorBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('checkPedagogueBadge', () => {
    const userId = 'user-123';

    it('should award Pédagogue badge for 4.5+ rating over 20 sessions', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          averageRating: 4.5,
          totalReviews: 20,
        },
      };

      const mockBadge = {
        id: 'badge-pedagogue',
        name: 'Pédagogue',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      await checkPedagogueBadge(userId);

      expect(prisma.userBadge.create).toHaveBeenCalled();
    });

    it('should not award badge for rating below 4.5', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          averageRating: 4.0,
          totalReviews: 20,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkPedagogueBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });

    it('should not award badge for less than 20 reviews', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          averageRating: 4.5,
          totalReviews: 10,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkPedagogueBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('checkExpertVerifieBadge', () => {
    const userId = 'user-123';

    it('should award Expert Vérifié badge for verified tutors', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          isVerified: true,
        },
      };

      const mockBadge = {
        id: 'badge-expert',
        name: 'Expert Vérifié',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(mockBadge);
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userBadge.create as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      await checkExpertVerifieBadge(userId);

      expect(prisma.userBadge.create).toHaveBeenCalled();
    });

    it('should not award badge for unverified tutors', async () => {
      const mockUser = {
        id: userId,
        role: 'TUTOR',
        tutorProfile: {
          isVerified: false,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await checkExpertVerifieBadge(userId);

      expect(prisma.badge.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('checkAllBadges', () => {
    const userId = 'user-123';

    it('should check all badge types', async () => {
      const mockUser = {
        id: userId,
        role: 'STUDENT',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);

      await checkAllBadges(userId);

      expect(prisma.user.findUnique).toHaveBeenCalled();
    });
  });

  describe('getLoyaltyPoints', () => {
    const userId = 'user-123';

    it('should return loyalty points balance', async () => {
      const mockUser = {
        id: userId,
        walletBalance: 500,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getLoyaltyPoints(userId);

      expect(result).toBe(500);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getLoyaltyPoints(userId)).rejects.toThrow(NotFoundError);
      await expect(getLoyaltyPoints(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getBadgeStatistics', () => {
    const userId = 'user-123';

    it('should return badge statistics', async () => {
      const mockEarnedBadges = [
        {
          id: 'user-badge-1',
          userId,
          badgeId: 'badge-1',
          earnedAt: new Date('2025-01-15'),
          badge: {
            id: 'badge-1',
            name: 'Badge 1',
          },
        },
      ];

      const mockUser = {
        id: userId,
        walletBalance: 300,
      };

      (prisma.badge.count as jest.Mock).mockResolvedValue(10);
      (prisma.userBadge.findMany as jest.Mock).mockResolvedValue(mockEarnedBadges);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getBadgeStatistics(userId);

      expect(result.totalBadges).toBe(10);
      expect(result.earnedBadges).toBe(1);
      expect(result.loyaltyPoints).toBe(300);
      expect(result.recentBadges).toEqual(mockEarnedBadges);
    });
  });
});
