import {
  createPaymentIntent,
  confirmPayment,
  calculatePlatformFee,
  creditWallet,
  debitWallet,
  getWalletBalance,
  getTransactionHistory,
  handlePaymentFailure,
} from '../payment.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { PrismaClient, Role, SessionStatus, TransactionStatus } from '@prisma/client';
import { register } from '../auth.service';

const prisma = new PrismaClient();

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 10000,
        currency: 'eur',
        status: 'requires_payment_method',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'eur',
      }),
    },
  }));
});

describe('Payment Service', () => {
  let studentUser: any;
  let tutorUser: any;
  let classRecord: any;
  let session: any;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users
    const studentResult = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Test',
    });
    studentUser = studentResult.user;

    const tutorResult = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Tutor',
      lastName: 'Test',
    });
    tutorUser = tutorResult.user;

    // Update tutor role
    await prisma.user.update({
      where: { id: tutorUser.id },
      data: { role: Role.TUTOR },
    });

    // Create student profile
    await prisma.studentProfile.create({
      data: {
        userId: studentUser.id,
        educationLevel: 'high_school',
        preferredSubjects: ['math'],
      },
    });

    // Create tutor profile
    await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        hourlyRate: 50,
        subjects: ['math'],
        educationLevels: ['high_school'],
        languages: ['en'],
        teachingMode: 'BOTH',
      },
    });

    // Create a class
    classRecord = await prisma.class.create({
      data: {
        name: 'Math Class',
        createdBy: studentUser.id,
        educationLevel: 'high_school',
        subject: 'math',
        meetingType: 'ONLINE',
      },
    });

    // Create a session
    session = await prisma.tutoringSession.create({
      data: {
        classId: classRecord.id,
        tutorId: tutorUser.id,
        scheduledStart: new Date(Date.now() + 86400000), // Tomorrow
        scheduledEnd: new Date(Date.now() + 90000000),
        subject: 'math',
        price: 100,
        status: SessionStatus.PENDING,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Platform Fee Calculation', () => {
    it('should calculate 15% platform fee correctly', () => {
      expect(calculatePlatformFee(100)).toBe(15);
      expect(calculatePlatformFee(50)).toBe(7.5);
      expect(calculatePlatformFee(200)).toBe(30);
      expect(calculatePlatformFee(33.33)).toBe(5);
    });

    it('should handle decimal amounts', () => {
      expect(calculatePlatformFee(99.99)).toBe(15);
      expect(calculatePlatformFee(123.45)).toBe(18.52);
    });
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with valid data', async () => {
      const result = await createPaymentIntent({
        sessionId: session.id,
        payerId: studentUser.id,
        amount: 100,
      });

      expect(result).toBeDefined();
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent.id).toBe('pi_test_123');
      expect(result.paymentIntent.clientSecret).toBe('pi_test_123_secret');
      expect(result.transaction).toBeDefined();
      expect(result.transaction.amount).toBe(100);
      expect(result.transaction.platformFee).toBe(15);
      expect(result.transaction.netAmount).toBe(85);
      expect(result.transaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should reject payment intent with invalid amount', async () => {
      await expect(
        createPaymentIntent({
          sessionId: session.id,
          payerId: studentUser.id,
          amount: 0,
        })
      ).rejects.toThrow('Payment amount must be greater than zero');

      await expect(
        createPaymentIntent({
          sessionId: session.id,
          payerId: studentUser.id,
          amount: -50,
        })
      ).rejects.toThrow('Payment amount must be greater than zero');
    });

    it('should reject payment intent with invalid session', async () => {
      await expect(
        createPaymentIntent({
          sessionId: 'invalid-session-id',
          payerId: studentUser.id,
          amount: 100,
        })
      ).rejects.toThrow('Session not found');
    });

    it('should reject payment intent with invalid payer', async () => {
      await expect(
        createPaymentIntent({
          sessionId: session.id,
          payerId: 'invalid-user-id',
          amount: 100,
        })
      ).rejects.toThrow('Payer not found');
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment and credit tutor wallet', async () => {
      // Create payment intent first
      const intentResult = await createPaymentIntent({
        sessionId: session.id,
        payerId: studentUser.id,
        amount: 100,
      });

      // Confirm payment
      const result = await confirmPayment({
        paymentIntentId: intentResult.paymentIntent.id,
        sessionId: session.id,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(TransactionStatus.COMPLETED);

      // Check tutor wallet was credited
      const updatedTutor = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });
      expect(updatedTutor!.walletBalance.toNumber()).toBe(85); // 100 - 15% fee

      // Check session status updated
      const updatedSession = await prisma.tutoringSession.findUnique({
        where: { id: session.id },
      });
      expect(updatedSession!.status).toBe(SessionStatus.CONFIRMED);
    });

    it('should not process payment twice', async () => {
      const intentResult = await createPaymentIntent({
        sessionId: session.id,
        payerId: studentUser.id,
        amount: 100,
      });

      await confirmPayment({
        paymentIntentId: intentResult.paymentIntent.id,
        sessionId: session.id,
      });

      // Try to confirm again
      const result = await confirmPayment({
        paymentIntentId: intentResult.paymentIntent.id,
        sessionId: session.id,
      });

      // Should return existing transaction without error
      expect(result.status).toBe(TransactionStatus.COMPLETED);

      // Wallet should still have 85 (not 170)
      const updatedTutor = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });
      expect(updatedTutor!.walletBalance.toNumber()).toBe(85);
    });
  });

  describe('Wallet Management', () => {
    it('should credit wallet correctly', async () => {
      await creditWallet(tutorUser.id, 50);

      const user = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });

      expect(user!.walletBalance.toNumber()).toBe(50);
    });

    it('should credit wallet multiple times', async () => {
      await creditWallet(tutorUser.id, 50);
      await creditWallet(tutorUser.id, 30);
      await creditWallet(tutorUser.id, 20);

      const user = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });

      expect(user!.walletBalance.toNumber()).toBe(100);
    });

    it('should reject credit with invalid amount', async () => {
      await expect(creditWallet(tutorUser.id, 0)).rejects.toThrow(
        'Credit amount must be greater than zero'
      );

      await expect(creditWallet(tutorUser.id, -50)).rejects.toThrow(
        'Credit amount must be greater than zero'
      );
    });

    it('should debit wallet correctly', async () => {
      await creditWallet(tutorUser.id, 100);
      await debitWallet(tutorUser.id, 30);

      const user = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });

      expect(user!.walletBalance.toNumber()).toBe(70);
    });

    it('should reject debit with insufficient balance', async () => {
      await creditWallet(tutorUser.id, 50);

      await expect(debitWallet(tutorUser.id, 100)).rejects.toThrow(
        'Insufficient wallet balance'
      );
    });

    it('should reject debit with invalid amount', async () => {
      await expect(debitWallet(tutorUser.id, 0)).rejects.toThrow(
        'Debit amount must be greater than zero'
      );

      await expect(debitWallet(tutorUser.id, -50)).rejects.toThrow(
        'Debit amount must be greater than zero'
      );
    });
  });

  describe('Wallet Balance', () => {
    it('should get wallet balance with no pending transactions', async () => {
      await creditWallet(tutorUser.id, 100);

      const balance = await getWalletBalance(tutorUser.id);

      expect(balance.totalBalance).toBe(100);
      expect(balance.availableBalance).toBe(100);
      expect(balance.pendingBalance).toBe(0);
    });

    it('should calculate available balance with pending transactions', async () => {
      await creditWallet(tutorUser.id, 100);

      // Create a pending transaction
      await prisma.transaction.create({
        data: {
          sessionId: session.id,
          payerId: studentUser.id,
          payeeId: tutorUser.id,
          amount: 50,
          platformFee: 7.5,
          netAmount: 42.5,
          paymentMethod: 'stripe',
          status: TransactionStatus.PENDING,
          transactionType: 'SESSION_PAYMENT',
        },
      });

      const balance = await getWalletBalance(tutorUser.id);

      expect(balance.totalBalance).toBe(100);
      expect(balance.pendingBalance).toBe(42.5);
      expect(balance.availableBalance).toBe(57.5);
    });
  });

  describe('Transaction History', () => {
    it('should get transaction history for user', async () => {
      // Create some transactions
      await createPaymentIntent({
        sessionId: session.id,
        payerId: studentUser.id,
        amount: 100,
      });

      const history = await getTransactionHistory(studentUser.id);

      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].payerId).toBe(studentUser.id);
    });

    it('should limit transaction history results', async () => {
      // Create multiple transactions
      for (let i = 0; i < 10; i++) {
        const newSession = await prisma.tutoringSession.create({
          data: {
            classId: classRecord.id,
            tutorId: tutorUser.id,
            scheduledStart: new Date(Date.now() + 86400000 + i * 1000),
            scheduledEnd: new Date(Date.now() + 90000000 + i * 1000),
            subject: 'math',
            price: 100,
            status: SessionStatus.PENDING,
          },
        });

        await createPaymentIntent({
          sessionId: newSession.id,
          payerId: studentUser.id,
          amount: 100,
        });
      }

      const history = await getTransactionHistory(studentUser.id, 5);

      expect(history.length).toBe(5);
    });
  });

  describe('Payment Failure Handling', () => {
    it('should handle payment failure correctly', async () => {
      const intentResult = await createPaymentIntent({
        sessionId: session.id,
        payerId: studentUser.id,
        amount: 100,
      });

      await handlePaymentFailure(session.id, 'Card declined');

      // Check transaction status
      const transaction = await prisma.transaction.findFirst({
        where: { sessionId: session.id },
      });
      expect(transaction!.status).toBe(TransactionStatus.FAILED);

      // Check session status
      const updatedSession = await prisma.tutoringSession.findUnique({
        where: { id: session.id },
      });
      expect(updatedSession!.status).toBe(SessionStatus.CANCELLED);
      expect(updatedSession!.cancellationReason).toBe('Card declined');
    });
  });

  describe('Consortium Revenue Distribution', () => {
    it('should distribute revenue to consortium members', async () => {
      // Create consortium
      const consortium = await prisma.consortium.create({
        data: {
          name: 'Math Tutors',
          createdBy: tutorUser.id,
          revenueDistributionPolicy: { type: 'custom' },
        },
      });

      // Create another tutor
      const tutor2Result = await register({
        email: 'tutor2@example.com',
        password: 'password123',
        firstName: 'Tutor2',
        lastName: 'Test',
      });

      await prisma.user.update({
        where: { id: tutor2Result.user.id },
        data: { role: Role.TUTOR },
      });

      // Add consortium members with revenue shares
      await prisma.consortiumMember.create({
        data: {
          consortiumId: consortium.id,
          tutorId: tutorUser.id,
          role: 'COORDINATOR',
          revenueShare: 60,
        },
      });

      await prisma.consortiumMember.create({
        data: {
          consortiumId: consortium.id,
          tutorId: tutor2Result.user.id,
          role: 'MEMBER',
          revenueShare: 40,
        },
      });

      // Create session with consortium
      const consortiumSession = await prisma.tutoringSession.create({
        data: {
          classId: classRecord.id,
          consortiumId: consortium.id,
          scheduledStart: new Date(Date.now() + 86400000),
          scheduledEnd: new Date(Date.now() + 90000000),
          subject: 'math',
          price: 100,
          status: SessionStatus.PENDING,
        },
      });

      // Create and confirm payment
      const intentResult = await createPaymentIntent({
        sessionId: consortiumSession.id,
        payerId: studentUser.id,
        amount: 100,
      });

      await confirmPayment({
        paymentIntentId: intentResult.paymentIntent.id,
        sessionId: consortiumSession.id,
      });

      // Check wallets
      const tutor1 = await prisma.user.findUnique({
        where: { id: tutorUser.id },
      });
      const tutor2 = await prisma.user.findUnique({
        where: { id: tutor2Result.user.id },
      });

      // Net amount is 85 (100 - 15% platform fee)
      // Tutor1 gets 60% = 51
      // Tutor2 gets 40% = 34
      expect(tutor1!.walletBalance.toNumber()).toBe(51);
      expect(tutor2!.walletBalance.toNumber()).toBe(34);
    });
  });
});
