import Stripe from 'stripe';
import { PrismaClient, SubscriptionType, TransactionStatus, TransactionType } from '@prisma/client';
import { envConfig, logger, ValidationError, PaymentError } from '@repo/utils';

const prisma = new PrismaClient();
const stripe = new Stripe(envConfig.get('STRIPE_SECRET_KEY', ''), {
  apiVersion: '2025-12-15.clover',
});

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  FREE: {
    type: SubscriptionType.FREE,
    price: 0,
    features: {
      maxActiveClasses: 1, // Allow 1 class for testing
      examBankAccess: false,
      prioritySupport: false,
      platformCommission: 0.15, // 15%
    },
    description: 'Free tier with basic access',
  },
  BASIC: {
    type: SubscriptionType.BASIC,
    price: 5,
    features: {
      maxActiveClasses: 1,
      examBankAccess: false,
      prioritySupport: false,
      platformCommission: 0.15, // 15%
    },
    description: 'Basic plan with one active class',
  },
  PREMIUM: {
    type: SubscriptionType.PREMIUM,
    price: 15,
    features: {
      maxActiveClasses: -1, // Unlimited
      examBankAccess: true,
      prioritySupport: true,
      platformCommission: 0.15, // 15%
    },
    description: 'Premium plan with unlimited classes and exam bank',
  },
  PRO: {
    type: SubscriptionType.PRO,
    price: 30,
    features: {
      maxActiveClasses: -1, // Unlimited
      examBankAccess: true,
      prioritySupport: true,
      platformCommission: 0.10, // 10% reduced commission for tutors
    },
    description: 'Pro plan for tutors with reduced commission',
  },
};

const GRACE_PERIOD_DAYS = 7;

interface SubscriptionCreateData {
  userId: string;
  subscriptionType: SubscriptionType;
  paymentMethodId?: string;
}

interface SubscriptionFeatures {
  maxActiveClasses: number;
  examBankAccess: boolean;
  prioritySupport: boolean;
  platformCommission: number;
}

/**
 * Get subscription tier configuration
 */
export function getSubscriptionTier(type: SubscriptionType) {
  return SUBSCRIPTION_TIERS[type];
}

/**
 * Get features for a subscription type
 */
export function getSubscriptionFeatures(type: SubscriptionType): SubscriptionFeatures {
  const tier = SUBSCRIPTION_TIERS[type];
  return tier.features;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Check if subscription is expired
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
    return false;
  }

  const features = getSubscriptionFeatures(user.subscriptionType);
  const featureValue = features[feature];

  // For boolean features, return the value directly
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  // For numeric features, return true if value is greater than 0 or unlimited (-1)
  if (typeof featureValue === 'number') {
    return featureValue !== 0;
  }

  return false;
}

/**
 * Check if user can create more classes
 */
export async function canCreateClass(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      createdClasses: {
        where: { isActive: true },
      },
    },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Check if subscription is expired
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
    return false;
  }

  const features = getSubscriptionFeatures(user.subscriptionType);
  const maxClasses = features.maxActiveClasses;

  // Unlimited classes
  if (maxClasses === -1) {
    return true;
  }

  // Check current class count
  const currentClassCount = user.createdClasses.length;
  return currentClassCount < maxClasses;
}

/**
 * Create or upgrade subscription
 */
export async function createSubscription(data: SubscriptionCreateData) {
  const { userId, subscriptionType, paymentMethodId } = data;

  // Validate subscription type
  if (!SUBSCRIPTION_TIERS[subscriptionType]) {
    throw new ValidationError('Invalid subscription type');
  }

  const tier = SUBSCRIPTION_TIERS[subscriptionType];

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Free subscription doesn't require payment
  if (subscriptionType === SubscriptionType.FREE) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: SubscriptionType.FREE,
        subscriptionExpiresAt: null,
      },
    });

    logger.info('User downgraded to free subscription', { userId });

    return {
      user: updatedUser,
      subscription: {
        type: subscriptionType,
        price: 0,
        expiresAt: null,
      },
    };
  }

  // For paid subscriptions, process payment
  if (!paymentMethodId) {
    throw new ValidationError('Payment method is required for paid subscriptions');
  }

  try {
    // In production, you should:
    // 1. Create a Stripe Customer for the user if not exists
    // 2. Create Price objects in Stripe Dashboard or via API beforehand
    // 3. Use the price ID when creating subscriptions
    
    // For this implementation, we'll create prices dynamically
    // First, create or get a product for subscriptions
    let product;
    try {
      // Try to find existing product
      const products = await stripe.products.list({ limit: 1 });
      product = products.data.find(p => p.name === `Genova ${subscriptionType} Subscription`);
      
      if (!product) {
        // Create product if it doesn't exist
        product = await stripe.products.create({
          name: `Genova ${subscriptionType} Subscription`,
          description: tier.description,
        });
      }
    } catch (error) {
      logger.error('Failed to create/get product', error);
      throw new PaymentError('Failed to setup subscription product');
    }

    // Create a price for this subscription
    let price;
    try {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(tier.price * 100), // Convert to cents
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
      });
    } catch (error) {
      logger.error('Failed to create price', error);
      throw new PaymentError('Failed to setup subscription price');
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.id; // Placeholder - in production, store this in user model
    
    // Create the subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: price.id,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Calculate expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType,
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        payerId: userId,
        amount: tier.price,
        platformFee: 0,
        netAmount: tier.price,
        paymentMethod: 'stripe',
        paymentProviderId: stripeSubscription.id,
        status: TransactionStatus.PENDING,
        transactionType: TransactionType.SUBSCRIPTION,
      },
    });

    logger.info('Subscription created', {
      userId,
      subscriptionType,
      expiresAt,
      stripeSubscriptionId: stripeSubscription.id,
    });

    return {
      user: updatedUser,
      subscription: {
        type: subscriptionType,
        price: tier.price,
        expiresAt,
        stripeSubscriptionId: stripeSubscription.id,
        clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
      },
    };
  } catch (error) {
    logger.error('Failed to create subscription', error);
    throw new PaymentError('Failed to create subscription');
  }
}

/**
 * Confirm subscription payment
 */
export async function confirmSubscriptionPayment(userId: string, stripeSubscriptionId: string) {
  try {
    // Retrieve subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
      throw new PaymentError('Subscription is not active');
    }

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        payerId: userId,
        paymentProviderId: stripeSubscriptionId,
        transactionType: TransactionType.SUBSCRIPTION,
      },
      data: {
        status: TransactionStatus.COMPLETED,
      },
    });

    logger.info('Subscription payment confirmed', { userId, stripeSubscriptionId });

    return { success: true };
  } catch (error) {
    logger.error('Failed to confirm subscription payment', error);
    throw new PaymentError('Failed to confirm subscription payment');
  }
}

/**
 * Handle subscription payment failure
 */
export async function handleSubscriptionPaymentFailure(userId: string, reason: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Calculate grace period end date
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  // Update transaction status
  await prisma.transaction.updateMany({
    where: {
      payerId: userId,
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.SUBSCRIPTION,
    },
    data: {
      status: TransactionStatus.FAILED,
    },
  });

  // Send notification to user
  await prisma.notification.create({
    data: {
      userId,
      title: 'Subscription Payment Failed',
      message: `Your subscription payment failed: ${reason}. You have ${GRACE_PERIOD_DAYS} days to update your payment method before your account is downgraded.`,
      type: 'subscription_payment_failed',
      data: {
        reason,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
      },
    },
  });

  logger.info('Subscription payment failure handled', {
    userId,
    reason,
    gracePeriodEnd,
  });

  return {
    gracePeriodEnd,
    message: `Payment failed. Grace period ends on ${gracePeriodEnd.toISOString()}`,
  };
}

/**
 * Check and process expired subscriptions
 * This should be run as a scheduled job
 */
export async function processExpiredSubscriptions() {
  const now = new Date();

  // Find users with expired subscriptions
  const expiredUsers = await prisma.user.findMany({
    where: {
      subscriptionExpiresAt: {
        lt: now,
      },
      subscriptionType: {
        not: SubscriptionType.FREE,
      },
    },
  });

  logger.info(`Processing ${expiredUsers.length} expired subscriptions`);

  for (const user of expiredUsers) {
    try {
      // Downgrade to free tier
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionType: SubscriptionType.FREE,
          subscriptionExpiresAt: null,
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Expired',
          message: 'Your subscription has expired and you have been downgraded to the free tier. Premium features are no longer accessible.',
          type: 'subscription_expired',
          data: {
            previousType: user.subscriptionType,
            expiredAt: user.subscriptionExpiresAt?.toISOString(),
          },
        },
      });

      logger.info('User subscription expired and downgraded', {
        userId: user.id,
        previousType: user.subscriptionType,
      });
    } catch (error) {
      logger.error('Failed to process expired subscription', {
        userId: user.id,
        error,
      });
    }
  }

  return {
    processed: expiredUsers.length,
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.subscriptionType === SubscriptionType.FREE) {
    throw new ValidationError('User is already on free tier');
  }

  // Downgrade to free tier
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionType: SubscriptionType.FREE,
      subscriptionExpiresAt: null,
    },
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId,
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You have been downgraded to the free tier.',
      type: 'subscription_cancelled',
      data: {
        previousType: user.subscriptionType,
        cancelledAt: new Date().toISOString(),
      },
    },
  });

  logger.info('Subscription cancelled', {
    userId,
    previousType: user.subscriptionType,
  });

  return {
    user: updatedUser,
    message: 'Subscription cancelled successfully',
  };
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  const tier = SUBSCRIPTION_TIERS[user.subscriptionType];
  const isExpired = user.subscriptionExpiresAt ? user.subscriptionExpiresAt < new Date() : false;

  return {
    type: user.subscriptionType,
    price: tier.price,
    features: tier.features,
    expiresAt: user.subscriptionExpiresAt,
    isExpired,
    isActive: !isExpired,
  };
}

/**
 * Get all available subscription tiers
 */
export function getAllSubscriptionTiers() {
  return Object.values(SUBSCRIPTION_TIERS).map((tier) => ({
    type: tier.type,
    price: tier.price,
    description: tier.description,
    features: tier.features,
  }));
}
