import { PrismaClient, Badge, UserBadge, BadgeCategory } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError,
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface BadgeCriteria {
  type: string;
  threshold: number;
  period?: string;
}

export interface CreateBadgeData {
  name: string;
  description?: string;
  iconUrl?: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
}

export interface BadgeWithEarnedStatus extends Badge {
  earned: boolean;
  earnedAt?: Date;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: Badge;
}

/**
 * Create a new badge
 * Admin function to create badge definitions
 */
export async function createBadge(data: CreateBadgeData): Promise<Badge> {
  // Validate badge name is unique
  const existingBadge = await prisma.badge.findUnique({
    where: { name: data.name },
  });

  if (existingBadge) {
    throw new ValidationError(`Badge with name "${data.name}" already exists`);
  }

  // Create badge
  const badge = await prisma.badge.create({
    data: {
      name: data.name,
      description: data.description,
      iconUrl: data.iconUrl,
      category: data.category,
      criteria: data.criteria as any,
    },
  });

  return badge;
}

/**
 * Get all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const badges = await prisma.badge.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return badges;
}

/**
 * Get badges for a specific category
 */
export async function getBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
  const badges = await prisma.badge.findMany({
    where: {
      OR: [
        { category },
        { category: 'BOTH' },
      ],
    },
    orderBy: {
      name: 'asc',
    },
  });

  return badges;
}

/**
 * Get all badges with earned status for a user
 */
export async function getBadgesWithStatus(userId: string): Promise<BadgeWithEarnedStatus[]> {
  const allBadges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  const userBadgeMap = new Map(
    userBadges.map(ub => [ub.badgeId, ub.earnedAt])
  );

  return allBadges.map(badge => ({
    ...badge,
    earned: userBadgeMap.has(badge.id),
    earnedAt: userBadgeMap.get(badge.id),
  }));
}

/**
 * Get earned badges for a user
 * Validates: Requirements 11.5
 */
export async function getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: {
      earnedAt: 'desc',
    },
  });

  return userBadges;
}

/**
 * Award a badge to a user
 * Validates: Requirements 11.4
 */
export async function awardBadge(
  userId: string,
  badgeId: string,
  skipNotification: boolean = false
): Promise<UserBadge> {
  // Check if badge exists
  const badge = await prisma.badge.findUnique({
    where: { id: badgeId },
  });

  if (!badge) {
    throw new NotFoundError('Badge not found');
  }

  // Check if user already has the badge
  const existingUserBadge = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId,
      },
    },
  });

  if (existingUserBadge) {
    return existingUserBadge; // Already has badge, return existing
  }

  // Award badge
  const userBadge = await prisma.userBadge.create({
    data: {
      userId,
      badgeId,
    },
  });

  // Add loyalty points (Requirement 11.4)
  await prisma.user.update({
    where: { id: userId },
    data: {
      walletBalance: {
        increment: 100, // 100 loyalty points
      },
    },
  });

  // Send notification (Requirement 11.4)
  if (!skipNotification) {
    await prisma.notification.create({
      data: {
        userId,
        title: 'Badge Earned!',
        message: `Congratulations! You've earned the ${badge.name} badge.`,
        type: 'badge_earned',
        data: {
          badgeId: badge.id,
          badgeName: badge.name,
          loyaltyPoints: 100,
        },
      },
    });
  }

  return userBadge;
}

/**
 * Check and award Assidu badge
 * Validates: Requirements 11.1
 */
export async function checkAssiduBadge(userId: string): Promise<void> {
  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'STUDENT') {
    return; // Only students can earn Assidu badge
  }

  // Calculate attendance rate for the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const attendances = await prisma.attendance.findMany({
    where: {
      studentId: userId,
      session: {
        scheduledStart: {
          gte: oneMonthAgo,
        },
        status: 'COMPLETED',
      },
    },
  });

  if (attendances.length === 0) {
    return; // No sessions to evaluate
  }

  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = (presentCount / attendances.length) * 100;

  // Award badge if attendance rate is 95% or higher (Requirement 11.1)
  if (attendanceRate >= 95) {
    // Get or create Assidu badge
    let badge = await prisma.badge.findFirst({
      where: { name: 'Assidu' },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: 'Assidu',
          description: 'Awarded for achieving 95% or higher attendance rate over one month',
          category: 'STUDENT',
          criteria: {
            type: 'attendance_rate',
            threshold: 95,
            period: '1_month',
          },
        },
      });
    }

    await awardBadge(userId, badge.id);
  }
}

/**
 * Check and award Mentor badge
 * Validates: Requirements 11.2
 */
export async function checkMentorBadge(userId: string): Promise<void> {
  // Get user role and tutor profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      tutorProfile: true,
    },
  });

  if (!user || user.role !== 'TUTOR' || !user.tutorProfile) {
    return; // Only tutors can earn Mentor badge
  }

  const totalHours = Number(user.tutorProfile.totalHoursTaught);

  // Award badge if tutor has completed 100 hours (Requirement 11.2)
  if (totalHours >= 100) {
    // Get or create Mentor badge
    let badge = await prisma.badge.findFirst({
      where: { name: 'Mentor' },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: 'Mentor',
          description: 'Awarded for completing 100 hours of tutoring',
          category: 'TUTOR',
          criteria: {
            type: 'hours_taught',
            threshold: 100,
          },
        },
      });
    }

    await awardBadge(userId, badge.id);
  }
}

/**
 * Check and award Pédagogue badge
 * Validates: Requirements 11.3
 */
export async function checkPedagogueBadge(userId: string): Promise<void> {
  // Get user role and tutor profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      tutorProfile: true,
    },
  });

  if (!user || user.role !== 'TUTOR' || !user.tutorProfile) {
    return; // Only tutors can earn Pédagogue badge
  }

  const averageRating = Number(user.tutorProfile.averageRating);
  const totalReviews = user.tutorProfile.totalReviews;

  // Award badge if tutor has 4.5+ rating over 20 sessions (Requirement 11.3)
  if (averageRating >= 4.5 && totalReviews >= 20) {
    // Get or create Pédagogue badge
    let badge = await prisma.badge.findFirst({
      where: { name: 'Pédagogue' },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: 'Pédagogue',
          description: 'Awarded for receiving an average rating of 4.5 or higher over 20 sessions',
          category: 'TUTOR',
          criteria: {
            type: 'average_rating',
            threshold: 4.5,
            minReviews: 20,
          },
        },
      });
    }

    await awardBadge(userId, badge.id);
  }
}

/**
 * Check and award Expert Vérifié badge
 * Validates: Requirements 18.2
 */
export async function checkExpertVerifieBadge(userId: string): Promise<void> {
  // Get user role and tutor profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      tutorProfile: true,
    },
  });

  if (!user || user.role !== 'TUTOR' || !user.tutorProfile) {
    return; // Only tutors can earn Expert Vérifié badge
  }

  // Award badge if tutor is verified (Requirement 18.2)
  if (user.tutorProfile.isVerified) {
    // Get or create Expert Vérifié badge
    let badge = await prisma.badge.findFirst({
      where: { name: 'Expert Vérifié' },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: 'Expert Vérifié',
          description: 'Awarded for completing tutor verification process',
          category: 'TUTOR',
          criteria: {
            type: 'verification',
            threshold: 1,
          },
        },
      });
    }

    await awardBadge(userId, badge.id);
  }
}

/**
 * Check all badge eligibility for a user
 * This is a convenience function that checks all badge types
 */
export async function checkAllBadges(userId: string): Promise<void> {
  await checkAssiduBadge(userId);
  await checkMentorBadge(userId);
  await checkPedagogueBadge(userId);
  await checkExpertVerifieBadge(userId);
}

/**
 * Get loyalty points balance for a user
 */
export async function getLoyaltyPoints(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return Number(user.walletBalance);
}

/**
 * Get badge statistics for a user
 */
export async function getBadgeStatistics(userId: string): Promise<{
  totalBadges: number;
  earnedBadges: number;
  loyaltyPoints: number;
  recentBadges: UserBadgeWithDetails[];
}> {
  const [allBadges, earnedBadges, user] = await Promise.all([
    prisma.badge.count(),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: 5,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    }),
  ]);

  return {
    totalBadges: allBadges,
    earnedBadges: earnedBadges.length,
    loyaltyPoints: user ? Number(user.walletBalance) : 0,
    recentBadges: earnedBadges,
  };
}

/**
 * Initialize default badges
 * This should be run during system setup
 */
export async function initializeDefaultBadges(): Promise<void> {
  const defaultBadges: CreateBadgeData[] = [
    {
      name: 'Assidu',
      description: 'Awarded for achieving 95% or higher attendance rate over one month',
      category: 'STUDENT',
      criteria: {
        type: 'attendance_rate',
        threshold: 95,
        period: '1_month',
      },
    },
    {
      name: 'Mentor',
      description: 'Awarded for completing 100 hours of tutoring',
      category: 'TUTOR',
      criteria: {
        type: 'hours_taught',
        threshold: 100,
      },
    },
    {
      name: 'Pédagogue',
      description: 'Awarded for receiving an average rating of 4.5 or higher over 20 sessions',
      category: 'TUTOR',
      criteria: {
        type: 'average_rating',
        threshold: 4.5,
      },
    },
    {
      name: 'Progressiste',
      description: 'Awarded for achieving 10% or more improvement in academic performance',
      category: 'STUDENT',
      criteria: {
        type: 'improvement',
        threshold: 10,
      },
    },
    {
      name: 'Expert Vérifié',
      description: 'Awarded for completing tutor verification process',
      category: 'TUTOR',
      criteria: {
        type: 'verification',
        threshold: 1,
      },
    },
  ];

  for (const badgeData of defaultBadges) {
    const existing = await prisma.badge.findFirst({
      where: { name: badgeData.name },
    });

    if (!existing) {
      await createBadge(badgeData);
    }
  }
}
