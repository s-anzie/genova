import { PrismaClient, SubscriptionType, Role } from '@prisma/client';
import * as subscriptionService from '../subscription.service';

const prisma = new PrismaClient();

describe('Subscription Service', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-subscription-${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: Role.STUDENT,
        subscriptionType: SubscriptionType.FREE,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('getSubscriptionTier', () => {
    it('should return correct tier configuration for BASIC', () => {
      const tier = subscriptionService.getSubscriptionTier(SubscriptionType.BASIC);
      expect(tier.type).toBe(SubscriptionType.BASIC);
      expect(tier.price).toBe(5);
      expect(tier.features.maxActiveClasses).toBe(1);
      expect(tier.features.examBankAccess).toBe(false);
    });

    it('should return correct tier configuration for PREMIUM', () => {
      const tier = subscriptionService.getSubscriptionTier(SubscriptionType.PREMIUM);
      expect(tier.type).toBe(SubscriptionType.PREMIUM);
      expect(tier.price).toBe(15);
      expect(tier.features.maxActiveClasses).toBe(-1);
      expect(tier.features.examBankAccess).toBe(true);
    });

    it('should return correct tier configuration for PRO', () => {
      const tier = subscriptionService.getSubscriptionTier(SubscriptionType.PRO);
      expect(tier.type).toBe(SubscriptionType.PRO);
      expect(tier.price).toBe(30);
      expect(tier.features.platformCommission).toBe(0.10);
    });
  });

  describe('getSubscriptionFeatures', () => {
    it('should return features for FREE tier', () => {
      const features = subscriptionService.getSubscriptionFeatures(SubscriptionType.FREE);
      expect(features.maxActiveClasses).toBe(0);
      expect(features.examBankAccess).toBe(false);
      expect(features.prioritySupport).toBe(false);
      expect(features.platformCommission).toBe(0.15);
    });

    it('should return features for PREMIUM tier', () => {
      const features = subscriptionService.getSubscriptionFeatures(SubscriptionType.PREMIUM);
      expect(features.maxActiveClasses).toBe(-1);
      expect(features.examBankAccess).toBe(true);
      expect(features.prioritySupport).toBe(true);
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return false for exam bank access on FREE tier', async () => {
      const hasAccess = await subscriptionService.hasFeatureAccess(testUserId, 'examBankAccess');
      expect(hasAccess).toBe(false);
    });

    it('should return true for exam bank access on PREMIUM tier', async () => {
      // Upgrade user to premium
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      const hasAccess = await subscriptionService.hasFeatureAccess(testUserId, 'examBankAccess');
      expect(hasAccess).toBe(true);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });

    it('should return false for expired subscription', async () => {
      // Set expired subscription
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
      });

      const hasAccess = await subscriptionService.hasFeatureAccess(testUserId, 'examBankAccess');
      expect(hasAccess).toBe(false);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });
  });

  describe('canCreateClass', () => {
    it('should return false for FREE tier (0 classes allowed)', async () => {
      const canCreate = await subscriptionService.canCreateClass(testUserId);
      expect(canCreate).toBe(false);
    });

    it('should return true for BASIC tier with no existing classes', async () => {
      // Upgrade to BASIC
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.BASIC,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const canCreate = await subscriptionService.canCreateClass(testUserId);
      expect(canCreate).toBe(true);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });

    it('should return true for PREMIUM tier (unlimited classes)', async () => {
      // Upgrade to PREMIUM
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const canCreate = await subscriptionService.canCreateClass(testUserId);
      expect(canCreate).toBe(true);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return correct status for FREE tier', async () => {
      const status = await subscriptionService.getSubscriptionStatus(testUserId);
      expect(status.type).toBe(SubscriptionType.FREE);
      expect(status.price).toBe(0);
      expect(status.isActive).toBe(true);
      expect(status.isExpired).toBe(false);
    });

    it('should return correct status for active PREMIUM subscription', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: expiresAt,
        },
      });

      const status = await subscriptionService.getSubscriptionStatus(testUserId);
      expect(status.type).toBe(SubscriptionType.PREMIUM);
      expect(status.price).toBe(15);
      expect(status.isActive).toBe(true);
      expect(status.isExpired).toBe(false);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });

    it('should return expired status for past expiration date', async () => {
      const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: expiresAt,
        },
      });

      const status = await subscriptionService.getSubscriptionStatus(testUserId);
      expect(status.isExpired).toBe(true);
      expect(status.isActive).toBe(false);

      // Reset to FREE
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });
    });
  });

  describe('getAllSubscriptionTiers', () => {
    it('should return all subscription tiers', () => {
      const tiers = subscriptionService.getAllSubscriptionTiers();
      expect(tiers).toHaveLength(4);
      expect(tiers.map((t) => t.type)).toContain(SubscriptionType.FREE);
      expect(tiers.map((t) => t.type)).toContain(SubscriptionType.BASIC);
      expect(tiers.map((t) => t.type)).toContain(SubscriptionType.PREMIUM);
      expect(tiers.map((t) => t.type)).toContain(SubscriptionType.PRO);
    });

    it('should include price and features for each tier', () => {
      const tiers = subscriptionService.getAllSubscriptionTiers();
      tiers.forEach((tier) => {
        expect(tier).toHaveProperty('type');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('description');
        expect(tier).toHaveProperty('features');
        expect(tier.features).toHaveProperty('maxActiveClasses');
        expect(tier.features).toHaveProperty('examBankAccess');
        expect(tier.features).toHaveProperty('prioritySupport');
        expect(tier.features).toHaveProperty('platformCommission');
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should downgrade user to FREE tier', async () => {
      // Upgrade to PREMIUM first
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionType: SubscriptionType.PREMIUM,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await subscriptionService.cancelSubscription(testUserId);
      expect(result.user.subscriptionType).toBe(SubscriptionType.FREE);
      expect(result.user.subscriptionExpiresAt).toBeNull();

      // Verify notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'subscription_cancelled',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(notification).toBeTruthy();
      expect(notification?.title).toBe('Subscription Cancelled');

      // Clean up notification
      if (notification) {
        await prisma.notification.delete({
          where: { id: notification.id },
        });
      }
    });

    it('should throw error if user is already on FREE tier', async () => {
      await expect(subscriptionService.cancelSubscription(testUserId)).rejects.toThrow(
        'User is already on free tier'
      );
    });
  });

  describe('handleSubscriptionPaymentFailure', () => {
    it('should create notification with grace period', async () => {
      const result = await subscriptionService.handleSubscriptionPaymentFailure(
        testUserId,
        'Card declined'
      );

      expect(result).toHaveProperty('gracePeriodEnd');
      expect(result).toHaveProperty('message');

      // Verify notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'subscription_payment_failed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(notification).toBeTruthy();
      expect(notification?.title).toBe('Subscription Payment Failed');
      expect(notification?.message).toContain('Card declined');
      expect(notification?.message).toContain('7 days');

      // Clean up notification
      if (notification) {
        await prisma.notification.delete({
          where: { id: notification.id },
        });
      }
    });
  });
});
