import Stripe from 'stripe';
import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';
import { envConfig, logger, ValidationError, PaymentError } from '@repo/utils';

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

  // Verify payer exists
  const payer = await prisma.user.findUnique({
    where: { id: payerId },
  });

  if (!payer) {
    throw new ValidationError('Payer not found');
  }

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        sessionId,
        payerId,
        type: 'session_payment',
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
 * Confirm a payment and distribute funds
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

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.COMPLETED },
    });

    // Distribute funds
    if (transaction.session?.consortiumId) {
      // Distribute to consortium members
      await distributeConsortiumRevenue(
        transaction.session.consortium!,
        transaction.netAmount.toNumber()
      );
    } else if (transaction.session?.tutorId) {
      // Credit tutor wallet
      await creditWallet(transaction.session.tutorId, transaction.netAmount.toNumber());
    }

    // Update session status to confirmed
    await prisma.tutoringSession.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED' },
    });

    logger.info('Payment confirmed and funds distributed', {
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
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Get pending transactions
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
  const availableBalance = totalBalance - pendingBalance;

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
