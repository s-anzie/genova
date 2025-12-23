import {
  createReview,
  getReviewById,
  getTutorReviews,
  getUserReviews,
  getSessionReviews,
  updateReview,
  deleteReview,
  flagReview,
  getTutorRatingStats,
  recalculateTutorRating,
  CreateReviewData,
} from '../review.service';
import { register } from '../auth.service';
import { createStudentProfile, createTutorProfile } from '../profile.service';
import { createClass } from '../class.service';
import { createSession, confirmSession, updateSessionStatus } from '../session.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Review Service', () => {
  jest.setTimeout(60000); // Increase timeout to 60 seconds
  
  let studentUserId: string;
  let student2UserId: string;
  let tutorUserId: string;
  let classId: string;
  let completedSessionId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create student user
    const student = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student',
      role: Role.STUDENT,
    });
    studentUserId = student.user.id;

    await createStudentProfile({
      userId: studentUserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create second student
    const student2 = await register({
      email: 'student2@example.com',
      password: 'password123',
      firstName: 'Test2',
      lastName: 'Student2',
      role: Role.STUDENT,
    });
    student2UserId = student2.user.id;

    await createStudentProfile({
      userId: student2UserId,
      educationLevel: 'high_school',
      preferredSubjects: ['mathematics'],
    });

    // Create tutor user
    const tutor = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Tutor',
      role: Role.TUTOR,
    });
    tutorUserId = tutor.user.id;

    await createTutorProfile({
      userId: tutorUserId,
      hourlyRate: 50,
      subjects: ['mathematics', 'physics'],
      educationLevels: ['high_school', 'university'],
      languages: ['en', 'fr'],
      teachingMode: 'BOTH',
    });

    // Create a class
    const classData = await createClass(studentUserId, {
      name: 'Math Study Group',
      educationLevel: 'high_school',
      subject: 'mathematics',
      meetingType: 'ONLINE',
    });
    classId = classData.id;

    // Create and complete a session
    const now = new Date();
    const session = await createSession(studentUserId, {
      classId,
      tutorId: tutorUserId,
      scheduledStart: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      scheduledEnd: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      subject: 'mathematics',
      description: 'Algebra review session',
      price: 50,
      onlineMeetingLink: 'https://meet.example.com/session1',
    });
    completedSessionId = session.id;

    // Confirm session first, then mark as completed
    await confirmSession(completedSessionId, tutorUserId);
    await updateSessionStatus(completedSessionId, 'COMPLETED', tutorUserId);
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('Review Creation', () => {
    it('should create a review with valid data', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Excellent tutor! Very helpful and patient.',
      };

      const result = await createReview(studentUserId, reviewData);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(completedSessionId);
      expect(result.reviewerId).toBe(studentUserId);
      expect(result.revieweeId).toBe(tutorUserId);
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Excellent tutor! Very helpful and patient.');
    });

    it('should create a review without comment', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 4,
      };

      const result = await createReview(studentUserId, reviewData);

      expect(result).toBeDefined();
      expect(result.rating).toBe(4);
      expect(result.comment).toBeNull();
    });

    it('should reject review with invalid rating (too low)', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 0,
        comment: 'Invalid rating',
      };

      await expect(createReview(studentUserId, reviewData)).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should reject review with invalid rating (too high)', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 6,
        comment: 'Invalid rating',
      };

      await expect(createReview(studentUserId, reviewData)).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should reject review for non-completed session', async () => {
      // Create a pending session
      const now = new Date();
      const pendingSession = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });

      const reviewData: CreateReviewData = {
        sessionId: pendingSession.id,
        rating: 5,
        comment: 'Great session',
      };

      await expect(createReview(studentUserId, reviewData)).rejects.toThrow(
        'Can only review completed sessions'
      );
    });

    it('should reject duplicate review', async () => {
      // Create first review
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'First review',
      };

      await createReview(studentUserId, reviewData);

      // Try to create duplicate review
      const duplicateReviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 4,
        comment: 'Duplicate review',
      };

      await expect(createReview(studentUserId, duplicateReviewData)).rejects.toThrow(
        'You have already reviewed this session'
      );
    });

    it('should reject review from non-participant', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Not a participant',
      };

      await expect(createReview(student2UserId, reviewData)).rejects.toThrow(
        'Only session participants can submit reviews'
      );
    });

    it('should reject review from tutor', async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Tutor trying to review',
      };

      await expect(createReview(tutorUserId, reviewData)).rejects.toThrow(
        'Only students can review tutors'
      );
    });
  });

  describe('Rating Recalculation', () => {
    it('should recalculate tutor average rating correctly', async () => {
      // Create multiple reviews
      const review1Data: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Excellent',
      };
      await createReview(studentUserId, review1Data);

      // Create another session and review
      const now = new Date();
      const session2 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(session2.id, tutorUserId);
      await updateSessionStatus(session2.id, 'COMPLETED', tutorUserId);

      const review2Data: CreateReviewData = {
        sessionId: session2.id,
        rating: 3,
        comment: 'Average',
      };
      await createReview(studentUserId, review2Data);

      // Check tutor profile
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: tutorUserId },
      });

      expect(tutorProfile).toBeDefined();
      expect(tutorProfile!.averageRating.toNumber()).toBe(4); // (5 + 3) / 2 = 4
      expect(tutorProfile!.totalReviews).toBe(2);
    });

    it('should only include reviews from last 12 months in rating calculation', async () => {
      // Create a review
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Recent review',
      };
      await createReview(studentUserId, reviewData);

      // Manually create an old review (more than 12 months ago)
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      await prisma.review.create({
        data: {
          sessionId: completedSessionId,
          reviewerId: student2UserId,
          revieweeId: tutorUserId,
          rating: 1,
          comment: 'Old review',
          createdAt: thirteenMonthsAgo,
        },
      });

      // Recalculate rating
      await recalculateTutorRating(tutorUserId);

      // Check tutor profile - should only include recent review
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: tutorUserId },
      });

      expect(tutorProfile).toBeDefined();
      expect(tutorProfile!.averageRating.toNumber()).toBe(5); // Only recent review
      expect(tutorProfile!.totalReviews).toBe(1); // Only recent review counted
    });
  });

  describe('Review Retrieval', () => {
    beforeEach(async () => {
      // Create a review for testing
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Great session',
      };
      await createReview(studentUserId, reviewData);
    });

    it('should get review by ID', async () => {
      const reviews = await getSessionReviews(completedSessionId);
      const reviewId = reviews[0].id;

      const result = await getReviewById(reviewId);

      expect(result).toBeDefined();
      expect(result.id).toBe(reviewId);
      expect(result.rating).toBe(5);
    });

    it('should get all reviews for a tutor', async () => {
      const result = await getTutorReviews(tutorUserId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].revieweeId).toBe(tutorUserId);
    });

    it('should get reviews submitted by a user', async () => {
      const result = await getUserReviews(studentUserId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].reviewerId).toBe(studentUserId);
    });

    it('should get reviews for a session', async () => {
      const result = await getSessionReviews(completedSessionId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].sessionId).toBe(completedSessionId);
    });

    it('should filter tutor reviews by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await getTutorReviews(tutorUserId, {
        startDate: yesterday,
        endDate: tomorrow,
      });

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('should exclude old reviews by default', async () => {
      // Create an old review
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      await prisma.review.create({
        data: {
          sessionId: completedSessionId,
          reviewerId: student2UserId,
          revieweeId: tutorUserId,
          rating: 1,
          comment: 'Old review',
          createdAt: thirteenMonthsAgo,
        },
      });

      const result = await getTutorReviews(tutorUserId);

      // Should only return recent review (not the 13-month-old one)
      expect(result.length).toBe(1);
      expect(result[0].rating).toBe(5);
    });

    it('should include old reviews when explicitly requested', async () => {
      // Create an old review
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      await prisma.review.create({
        data: {
          sessionId: completedSessionId,
          reviewerId: student2UserId,
          revieweeId: tutorUserId,
          rating: 1,
          comment: 'Old review',
          createdAt: thirteenMonthsAgo,
        },
      });

      const result = await getTutorReviews(tutorUserId, {
        includeOlderThan12Months: true,
      });

      // Should return both reviews
      expect(result.length).toBe(2);
    });
  });

  describe('Review Update', () => {
    let reviewId: string;

    beforeEach(async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Original comment',
      };
      const review = await createReview(studentUserId, reviewData);
      reviewId = review.id;
    });

    it('should update review comment', async () => {
      const newComment = 'Updated comment';

      const result = await updateReview(reviewId, studentUserId, newComment);

      expect(result).toBeDefined();
      expect(result.comment).toBe(newComment);
      expect(result.rating).toBe(5); // Rating should remain unchanged
    });

    it('should reject update from non-reviewer', async () => {
      await expect(
        updateReview(reviewId, student2UserId, 'Unauthorized update')
      ).rejects.toThrow('Only the reviewer can update this review');
    });
  });

  describe('Review Deletion', () => {
    let reviewId: string;

    beforeEach(async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'To be deleted',
      };
      const review = await createReview(studentUserId, reviewData);
      reviewId = review.id;
    });

    it('should delete review', async () => {
      await deleteReview(reviewId, studentUserId);

      // Verify review is deleted
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      expect(review).toBeNull();
    });

    it('should recalculate tutor rating after deletion', async () => {
      // Create another review
      const now = new Date();
      const session2 = await createSession(studentUserId, {
        classId,
        tutorId: tutorUserId,
        scheduledStart: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        scheduledEnd: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        subject: 'mathematics',
        price: 50,
      });
      await confirmSession(session2.id, tutorUserId);
      await updateSessionStatus(session2.id, 'COMPLETED', tutorUserId);

      const review2Data: CreateReviewData = {
        sessionId: session2.id,
        rating: 3,
        comment: 'Average',
      };
      await createReview(studentUserId, review2Data);

      // Check initial rating
      let tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: tutorUserId },
      });
      expect(tutorProfile!.averageRating.toNumber()).toBe(4); // (5 + 3) / 2

      // Delete first review
      await deleteReview(reviewId, studentUserId);

      // Check updated rating
      tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: tutorUserId },
      });
      expect(tutorProfile!.averageRating.toNumber()).toBe(3); // Only second review remains
      expect(tutorProfile!.totalReviews).toBe(1);
    });

    it('should reject deletion from non-reviewer', async () => {
      await expect(deleteReview(reviewId, student2UserId)).rejects.toThrow(
        'Only the reviewer can delete this review'
      );
    });
  });

  describe('Review Flagging', () => {
    let reviewId: string;

    beforeEach(async () => {
      const reviewData: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 1,
        comment: 'Inappropriate content',
      };
      const review = await createReview(studentUserId, reviewData);
      reviewId = review.id;
    });

    it('should flag review for moderation', async () => {
      // This should not throw an error
      await expect(
        flagReview(reviewId, tutorUserId, 'Contains inappropriate language')
      ).resolves.not.toThrow();
    });

    it('should reject flagging without reason', async () => {
      await expect(flagReview(reviewId, tutorUserId, '')).rejects.toThrow(
        'Flagging reason is required'
      );
    });

    it('should reject flagging non-existent review', async () => {
      await expect(
        flagReview('non-existent-id', tutorUserId, 'Invalid review')
      ).rejects.toThrow('Review not found');
    });
  });

  describe('Tutor Rating Statistics', () => {
    beforeEach(async () => {
      // Create multiple reviews with different ratings
      const reviewData1: CreateReviewData = {
        sessionId: completedSessionId,
        rating: 5,
        comment: 'Excellent',
      };
      await createReview(studentUserId, reviewData1);

      // Create more sessions and reviews
      const now = new Date();
      for (let i = 0; i < 4; i++) {
        const session = await createSession(studentUserId, {
          classId,
          tutorId: tutorUserId,
          scheduledStart: new Date(now.getTime() - (i + 3) * 60 * 60 * 1000),
          scheduledEnd: new Date(now.getTime() - (i + 2) * 60 * 60 * 1000),
          subject: 'mathematics',
          price: 50,
        });
        await confirmSession(session.id, tutorUserId);
        await updateSessionStatus(session.id, 'COMPLETED', tutorUserId);

        const rating = i < 2 ? 4 : 3; // 2 reviews with 4 stars, 2 with 3 stars
        await createReview(studentUserId, {
          sessionId: session.id,
          rating,
          comment: `Review ${i + 2}`,
        });
      }
    });

    it('should get tutor rating statistics', async () => {
      const result = await getTutorRatingStats(tutorUserId);

      expect(result).toBeDefined();
      expect(result.totalReviews).toBe(5);
      expect(result.averageRating).toBeCloseTo(3.8, 1); // (5 + 4 + 4 + 3 + 3) / 5 = 3.8
      expect(result.ratingDistribution).toBeDefined();
      expect(result.ratingDistribution[5]).toBe(1);
      expect(result.ratingDistribution[4]).toBe(2);
      expect(result.ratingDistribution[3]).toBe(2);
      expect(result.ratingDistribution[2]).toBe(0);
      expect(result.ratingDistribution[1]).toBe(0);
      expect(result.recentReviews).toBeDefined();
      expect(result.recentReviews.length).toBeLessThanOrEqual(5);
    });
  });
});
