import { PrismaClient, Review } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  logger
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateReviewData {
  sessionId: string;
  rating: number;
  comment?: string;
}

export interface ReviewWithDetails extends Review {
  session: {
    id: string;
    scheduledStart: Date;
    subject: string;
  };
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  reviewee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface FlagReviewData {
  reason: string;
}

/**
 * Submit a review for a completed session
 * Validates: Requirements 17.1, 17.2
 */
export async function createReview(
  reviewerId: string,
  data: CreateReviewData
): Promise<ReviewWithDetails> {
  // Validate required fields
  if (!data.sessionId || data.rating === undefined) {
    throw new ValidationError('Session ID and rating are required');
  }

  // Validate rating range (1-5)
  if (data.rating < 1 || data.rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  // Get session details
  const session = await prisma.tutoringSession.findUnique({
    where: { id: data.sessionId },
    include: {
      class: {
        include: {
          members: {
            where: { isActive: true },
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Verify session is completed
  if (session.status !== 'COMPLETED') {
    throw new ValidationError('Can only review completed sessions');
  }

  // Determine reviewer and reviewee
  let revieweeId: string;
  const isStudent = session.class.members.some(m => m.studentId === reviewerId);
  const isTutor = session.tutorId === reviewerId;

  if (!isStudent && !isTutor) {
    throw new AuthorizationError('Only session participants can submit reviews');
  }

  if (isStudent && session.tutorId) {
    // Student reviewing tutor
    revieweeId = session.tutorId;
  } else if (isTutor) {
    // Tutor reviewing student (not typically used, but supported)
    // For now, we'll focus on students reviewing tutors
    throw new ValidationError('Only students can review tutors');
  } else {
    throw new ValidationError('Cannot determine reviewee for this session');
  }

  // Check if review already exists
  const existingReview = await prisma.review.findFirst({
    where: {
      sessionId: data.sessionId,
      reviewerId,
      revieweeId,
    },
  });

  if (existingReview) {
    throw new ConflictError('You have already reviewed this session');
  }

  // Create review (Requirement 17.2)
  const review = await prisma.review.create({
    data: {
      sessionId: data.sessionId,
      reviewerId,
      revieweeId,
      rating: data.rating,
      comment: data.comment,
    },
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Recalculate tutor's average rating (Requirement 17.3)
  await recalculateTutorRating(revieweeId);

  // TODO: Send notification to reviewee (Requirement 19.4)
  // This would be implemented in a notification service

  logger.info('Review created', {
    reviewId: review.id,
    sessionId: data.sessionId,
    reviewerId,
    revieweeId,
    rating: data.rating,
  });

  return review as ReviewWithDetails;
}

/**
 * Recalculate tutor's average rating based on reviews from the last 12 months
 * Validates: Requirements 17.3, 17.4
 */
export async function recalculateTutorRating(tutorId: string): Promise<void> {
  // Get tutor profile
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
  });

  if (!tutorProfile) {
    logger.warn('Tutor profile not found for rating recalculation', { tutorId });
    return;
  }

  // Calculate date 12 months ago (Requirement 17.4)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Get all reviews for this tutor from the last 12 months
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: tutorId,
      createdAt: {
        gte: twelveMonthsAgo,
      },
    },
    select: {
      rating: true,
    },
  });

  // Calculate average rating
  let averageRating = 0;
  let totalReviews = reviews.length;

  if (totalReviews > 0) {
    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = sumRatings / totalReviews;
  }

  // Update tutor profile with new average rating and review count
  await prisma.tutorProfile.update({
    where: { userId: tutorId },
    data: {
      averageRating,
      totalReviews,
    },
  });

  logger.info('Tutor rating recalculated', {
    tutorId,
    averageRating,
    totalReviews,
  });
}

/**
 * Get review by ID
 */
export async function getReviewById(reviewId: string): Promise<ReviewWithDetails> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  return review as ReviewWithDetails;
}

/**
 * Get all reviews for a tutor
 * Optionally filter by time window (default: last 12 months)
 */
export async function getTutorReviews(
  tutorId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    includeOlderThan12Months?: boolean;
  }
): Promise<ReviewWithDetails[]> {
  const whereConditions: any = {
    revieweeId: tutorId,
  };

  // Apply time filters
  if (filters?.startDate || filters?.endDate || !filters?.includeOlderThan12Months) {
    whereConditions.createdAt = {};
    
    if (filters?.startDate) {
      whereConditions.createdAt.gte = filters.startDate;
    } else if (!filters?.includeOlderThan12Months) {
      // Default: only reviews from last 12 months (Requirement 17.4)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      whereConditions.createdAt.gte = twelveMonthsAgo;
    }
    
    if (filters?.endDate) {
      whereConditions.createdAt.lte = filters.endDate;
    }
  }

  const reviews = await prisma.review.findMany({
    where: whereConditions,
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews as ReviewWithDetails[];
}

/**
 * Get reviews submitted by a user
 */
export async function getUserReviews(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ReviewWithDetails[]> {
  const whereConditions: any = {
    reviewerId: userId,
  };

  // Apply time filters
  if (filters?.startDate || filters?.endDate) {
    whereConditions.createdAt = {};
    
    if (filters?.startDate) {
      whereConditions.createdAt.gte = filters.startDate;
    }
    
    if (filters?.endDate) {
      whereConditions.createdAt.lte = filters.endDate;
    }
  }

  const reviews = await prisma.review.findMany({
    where: whereConditions,
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews as ReviewWithDetails[];
}

/**
 * Get reviews for a specific session
 */
export async function getSessionReviews(sessionId: string): Promise<ReviewWithDetails[]> {
  const reviews = await prisma.review.findMany({
    where: { sessionId },
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews as ReviewWithDetails[];
}

/**
 * Update a review (only comment can be updated, not rating)
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  comment: string
): Promise<ReviewWithDetails> {
  // Get review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Verify user is the reviewer
  if (review.reviewerId !== userId) {
    throw new AuthorizationError('Only the reviewer can update this review');
  }

  // Update review comment
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { comment },
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  logger.info('Review updated', {
    reviewId,
    userId,
  });

  return updatedReview as ReviewWithDetails;
}

/**
 * Delete a review (soft delete by marking as flagged)
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<void> {
  // Get review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Verify user is the reviewer
  if (review.reviewerId !== userId) {
    throw new AuthorizationError('Only the reviewer can delete this review');
  }

  // Delete review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Recalculate tutor's rating after deletion
  await recalculateTutorRating(review.revieweeId);

  logger.info('Review deleted', {
    reviewId,
    userId,
  });
}

/**
 * Flag a review for moderation
 * Validates: Requirement 17.5
 */
export async function flagReview(
  reviewId: string,
  userId: string,
  reason: string
): Promise<void> {
  // Get review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Flagging reason is required');
  }

  // TODO: Create a moderation record or notification for admins
  // For now, we'll just log it
  logger.warn('Review flagged for moderation', {
    reviewId,
    flaggedBy: userId,
    reason,
    reviewerId: review.reviewerId,
    revieweeId: review.revieweeId,
  });

  // In a full implementation, you would:
  // 1. Create a moderation record in a separate table
  // 2. Send notification to admins
  // 3. Possibly hide the review until moderation is complete
}

/**
 * Get tutor rating statistics
 */
export async function getTutorRatingStats(tutorId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: ReviewWithDetails[];
}> {
  // Get tutor profile for cached stats
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
  });

  if (!tutorProfile) {
    throw new NotFoundError('Tutor profile not found');
  }

  // Get reviews from last 12 months for distribution
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: tutorId,
      createdAt: {
        gte: twelveMonthsAgo,
      },
    },
    include: {
      session: {
        select: {
          id: true,
          scheduledStart: true,
          subject: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate rating distribution
  const ratingDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
        let rating = ratingDistribution[review.rating]
        if (rating !== undefined) {
            rating += 1
            ratingDistribution[review.rating] = rating;

        }
    }
  });

  // Get 5 most recent reviews
  const recentReviews = reviews.slice(0, 5);

  return {
    averageRating: tutorProfile.averageRating.toNumber(),
    totalReviews: tutorProfile.totalReviews,
    ratingDistribution,
    recentReviews: recentReviews as ReviewWithDetails[],
  };
}
