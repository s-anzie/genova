import Stripe from 'stripe';
import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';
import { envConfig, logger, ValidationError, PaymentError } from '@repo/utils';
import { mapToStripeCurrency, toStripeAmount } from '../utils/currency';
import { getCountryByCode } from './regions.service';

const prisma = new PrismaClient();
const stripe = new Stripe(envConfig.get('STRIPE_SECRET_KEY', ''), {
  apiVersion: '2025-12-15.clover',
});

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

interface PaymentIntentData {
  sessionId: string;
  payerId: string;
  amount: number;
  description?: string;
}

interface PaymentConfirmationData {
  paymentIntentId: string;
  sessionId: string;
}

interface WalletBalance {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
}

/**
 * Create a Stripe payment intent for a tutoring session
 */
export async function createPaymentIntent(data: PaymentIntentData) {
  const { sessionId, payerId, amount, description } = data;

  // Validate amount
  if (amount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero');
  }

  // Verify session exists
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      tutor: true,
      consortium: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!session) {
    throw new ValidationError('Session not found');
  }

  // Verify payer exists and get their country
  const payer = await prisma.user.findUnique({
    where: { id: payerId },
  });

  if (!payer) {
    throw new ValidationError('Payer not found');
  }

  // Get user's currency from their country
  let currency = 'eur'; // Default fallback
  let stripeAmount = Math.round(amount * 100);

  if (payer.countryCode) {
    try {
      const country = await getCountryByCode(payer.countryCode);
      currency = mapToStripeCurrency(country.currencyCode);
      stripeAmount = toStripeAmount(amount, country.currencyCode);
    } catch (error) {
      logger.warn('Failed to get country currency, using default EUR', { 
        countryCode: payer.countryCode,
        error 
      });
    }
  }

  try {
    // Create Stripe payment intent with user's currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency,
      metadata: {
        sessionId,
        payerId,
        type: 'session_payment',
        localCurrency: payer.countryCode || 'unknown',
      },
      description: description || `Payment for tutoring session ${sessionId}`,
    });

    // Calculate fees
    const platformFee = calculatePlatformFee(amount);
    const netAmount = amount - platformFee;

    // Create pending transaction record
    const transaction = await prisma.transaction.create({
      data: {
        sessionId,
        payerId,
        payeeId: session.tutorId || undefined,
        amount,
        platformFee,
        netAmount,
        paymentMethod: 'stripe',
        paymentProviderId: paymentIntent.id,
        status: TransactionStatus.PENDING,
        transactionType: TransactionType.SESSION_PAYMENT,
      },
    });

    logger.info('Payment intent created', {
      transactionId: transaction.id,
      paymentIntentId: paymentIntent.id,
      amount,
    });

    return {
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount.toNumber(),
        platformFee: transaction.platformFee.toNumber(),
        netAmount: transaction.netAmount.toNumber(),
        status: transaction.status,
      },
    };
  } catch (error) {
    logger.error('Failed to create payment intent', error);
    throw new PaymentError('Failed to create payment intent');
  }
}

/**
 * Confirm a payment and hold funds in pending state
 * Funds will be released when session completes and attendance is confirmed
 */
export async function confirmPayment(data: PaymentConfirmationData) {
  const { paymentIntentId, sessionId } = data;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new PaymentError('Payment has not succeeded');
    }

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        paymentProviderId: paymentIntentId,
        sessionId,
      },
      include: {
        session: {
          include: {
            tutor: true,
            consortium: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new ValidationError('Transaction not found');
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      logger.warn('Transaction already completed', { transactionId: transaction.id });
      return transaction;
    }

    // Update transaction status to PENDING (not COMPLETED yet)
    // Funds will be released when session completes and attendance is confirmed
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.PENDING },
    });

    // DO NOT distribute funds yet - they remain pending until session completion
    // Funds will be released when tutor checks out and attendance is confirmed

    // Update session status to confirmed
    await prisma.tutoringSession.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED' },
    });

    logger.info('Payment confirmed - funds held in pending state', {
      transactionId: transaction.id,
      amount: transaction.amount.toNumber(),
    });

    return updatedTransaction;
  } catch (error) {
    logger.error('Failed to confirm payment', error);
    
    // Update transaction status to failed
    await prisma.transaction.updateMany({
      where: {
        paymentProviderId: paymentIntentId,
        sessionId,
      },
      data: { status: TransactionStatus.FAILED },
    });

    // Cancel the session
    await prisma.tutoringSession.update({
      where: { id: sessionId },
      data: { 
        status: 'CANCELLED',
        cancellationReason: 'Payment failed',
      },
    });

    throw new PaymentError('Failed to confirm payment');
  }
}

/**
 * Process payment using wallet balance (bypass Stripe)
 * Funds are debited from payer and held in PENDING state until session completion
 * This is a transactional operation - either everything succeeds or everything fails
 */
export async function processWalletPayment(data: PaymentIntentData) {
  const { sessionId, payerId, amount } = data;

  // Validate amount
  if (amount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero');
  }

  // Verify session exists
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      tutor: true,
      consortium: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!session) {
    throw new ValidationError('Session not found');
  }

  // Verify payer exists and has sufficient balance
  const payer = await prisma.user.findUnique({
    where: { id: payerId },
  });

  if (!payer) {
    throw new ValidationError('Payer not found');
  }

  const currentBalance = payer.walletBalance.toNumber();
  if (currentBalance < amount) {
    throw new ValidationError(
      `Solde insuffisant. Vous avez ${currentBalance.toFixed(2)}€ mais la séance coûte ${amount.toFixed(2)}€. Veuillez recharger votre compte.`
    );
  }

  // Use a transaction to ensure atomicity
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Calculate fees
      const platformFee = calculatePlatformFee(amount);
      const netAmount = amount - platformFee;

      // Debit payer wallet
      const updatedPayer = await tx.user.update({
        where: { id: payerId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      // Create PENDING transaction record (funds held until session completion)
      // Funds will be released to tutor when session completes and attendance is confirmed
      const transaction = await tx.transaction.create({
        data: {
          sessionId,
          payerId,
          payeeId: session.tutorId || undefined,
          amount,
          platformFee,
          netAmount,
          paymentMethod: 'wallet',
          status: TransactionStatus.PENDING,
          transactionType: TransactionType.SESSION_PAYMENT,
        },
      });

      // DO NOT credit tutor wallet yet - funds remain pending until session completion
      // Funds will be released when tutor checks out and attendance is confirmed

      // Update session status to confirmed
      await tx.tutoringSession.update({
        where: { id: sessionId },
        data: { status: 'CONFIRMED' },
      });

      return { transaction, updatedPayer };
    });

    logger.info('Wallet payment processed - funds held in pending state', {
      transactionId: result.transaction.id,
      sessionId,
      amount,
      payerId,
      newBalance: result.updatedPayer.walletBalance.toNumber(),
    });

    return result.transaction;
  } catch (error) {
    logger.error('Failed to process wallet payment', error);
    
    // If it's a validation error (like insufficient balance), rethrow it
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new PaymentError('Failed to process wallet payment');
  }
}

/**
 * Calculate platform fee (15%)
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE * 100) / 100;
}

/**
 * Credit a user's wallet balance
 */
export async function creditWallet(userId: string, amount: number) {
  if (amount <= 0) {
    throw new ValidationError('Credit amount must be greater than zero');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      walletBalance: {
        increment: amount,
      },
    },
  });

  logger.info('Wallet credited', { userId, amount, newBalance: user.walletBalance.toNumber() });

  return user;
}

/**
 * Debit a user's wallet balance
 */
export async function debitWallet(userId: string, amount: number) {
  if (amount <= 0) {
    throw new ValidationError('Debit amount must be greater than zero');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.walletBalance.toNumber() < amount) {
    throw new ValidationError('Insufficient wallet balance');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      walletBalance: {
        decrement: amount,
      },
    },
  });

  logger.info('Wallet debited', { userId, amount, newBalance: updatedUser.walletBalance.toNumber() });

  return updatedUser;
}

/**
 * Get wallet balance for a user
 * Returns total balance, available balance, and pending balance
 * - Total balance: current wallet balance
 * - Pending balance: money waiting to be received from completed sessions
 * - Available balance: total - pending (money that can be withdrawn)
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Get pending transactions where user is the payee (receiving money)
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      payeeId: userId,
      status: TransactionStatus.PENDING,
    },
  });

  const pendingBalance = pendingTransactions.reduce(
    (sum, tx) => sum + tx.netAmount.toNumber(),
    0
  );

  const totalBalance = user.walletBalance.toNumber();
  
  // Available balance is the current wallet balance
  // Pending balance is separate - it's money that will be added after sessions complete
  const availableBalance = totalBalance;

  return {
    totalBalance,
    availableBalance,
    pendingBalance,
  };
}

/**
 * Distribute revenue to consortium members
 */
async function distributeConsortiumRevenue(
  consortium: any,
  netAmount: number
) {
  if (!consortium.members || consortium.members.length === 0) {
    throw new ValidationError('Consortium has no members');
  }

  // Validate revenue shares sum to 100%
  const totalShare = consortium.members.reduce(
    (sum: number, member: any) => sum + member.revenueShare.toNumber(),
    0
  );

  if (Math.abs(totalShare - 100) > 0.01) {
    throw new ValidationError('Consortium revenue shares do not sum to 100%');
  }

  // Distribute to each member
  for (const member of consortium.members) {
    const memberAmount = (netAmount * member.revenueShare.toNumber()) / 100;
    await creditWallet(member.tutorId, memberAmount);
    
    logger.info('Consortium revenue distributed', {
      consortiumId: consortium.id,
      tutorId: member.tutorId,
      amount: memberAmount,
      share: member.revenueShare.toNumber(),
    });
  }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailure(sessionId: string, reason: string) {
  // Update transaction status
  await prisma.transaction.updateMany({
    where: {
      sessionId,
      status: TransactionStatus.PENDING,
    },
    data: {
      status: TransactionStatus.FAILED,
    },
  });

  // Cancel the session
  await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
    },
  });

  logger.info('Payment failure handled', { sessionId, reason });
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(userId: string, limit = 50) {
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { payerId: userId },
        { payeeId: userId },
      ],
    },
    include: {
      session: {
        select: {
          id: true,
          subject: true,
          scheduledStart: true,
        },
      },
      payer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      payee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return transactions;
}
