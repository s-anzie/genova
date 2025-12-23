import { PrismaClient, AcademicResult } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateAcademicResultData {
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: Date;
}

export interface AcademicResultWithDetails extends AcademicResult {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ProgressData {
  subject: string;
  results: AcademicResult[];
  averageScore: number;
  improvement: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ProgressDashboard {
  totalHoursTutored: number;
  upcomingSessions: number;
  progressBySubject: ProgressData[];
  overallImprovement: number | null;
  recentResults: AcademicResult[];
}

/**
 * Validate academic result data
 * Validates: Requirements 10.1
 */
function validateAcademicResult(data: CreateAcademicResultData): void {
  if (!data.subject || data.subject.trim().length === 0) {
    throw new ValidationError('Subject is required');
  }

  if (!data.examName || data.examName.trim().length === 0) {
    throw new ValidationError('Exam name is required');
  }

  if (data.score < 0) {
    throw new ValidationError('Score cannot be negative');
  }

  if (data.maxScore <= 0) {
    throw new ValidationError('Max score must be greater than zero');
  }

  if (data.score > data.maxScore) {
    throw new ValidationError('Score cannot exceed max score');
  }

  if (!data.examDate) {
    throw new ValidationError('Exam date is required');
  }

  // Validate exam date is not in the future
  if (data.examDate > new Date()) {
    throw new ValidationError('Exam date cannot be in the future');
  }
}

/**
 * Create an academic result
 * Validates: Requirements 10.1
 */
export async function createAcademicResult(
  studentId: string,
  data: CreateAcademicResultData
): Promise<AcademicResultWithDetails> {
  // Validate data
  validateAcademicResult(data);

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'STUDENT') {
    throw new ValidationError('Only students can add academic results');
  }

  // Create academic result (Requirement 10.1)
  const result = await prisma.academicResult.create({
    data: {
      studentId,
      subject: data.subject,
      examName: data.examName,
      score: data.score,
      maxScore: data.maxScore,
      examDate: data.examDate,
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Check if student should receive Progressiste badge (Requirement 10.4)
  await checkProgressisteBadge(studentId);

  return result as AcademicResultWithDetails;
}

/**
 * Get academic results for a student
 */
export async function getStudentResults(
  studentId: string,
  filters?: {
    subject?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AcademicResult[]> {
  const whereConditions: any = {
    studentId,
  };

  if (filters?.subject) {
    whereConditions.subject = filters.subject;
  }

  if (filters?.startDate || filters?.endDate) {
    whereConditions.examDate = {};
    if (filters.startDate) {
      whereConditions.examDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereConditions.examDate.lte = filters.endDate;
    }
  }

  const results = await prisma.academicResult.findMany({
    where: whereConditions,
    orderBy: {
      examDate: 'desc',
    },
  });

  return results;
}

/**
 * Calculate improvement percentage for a subject
 * Validates: Requirements 10.3
 */
export async function calculateImprovement(
  studentId: string,
  subject: string
): Promise<number | null> {
  // Get all results for the subject, ordered by date
  const results = await prisma.academicResult.findMany({
    where: {
      studentId,
      subject,
    },
    orderBy: {
      examDate: 'asc',
    },
  });

  if (results.length < 2) {
    return null; // Need at least 2 results to calculate improvement
  }

  // Calculate percentage scores
  const percentageScores = results.map(r => 
    (Number(r.score) / Number(r.maxScore)) * 100
  );

  // Calculate average of first half vs second half
  const midpoint = Math.floor(percentageScores.length / 2);
  const firstHalfAvg = percentageScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const secondHalfAvg = percentageScores.slice(midpoint).reduce((a, b) => a + b, 0) / (percentageScores.length - midpoint);

  // Calculate improvement percentage
  const improvement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  return Math.round(improvement * 100) / 100; // Round to 2 decimal places
}

/**
 * Get progress data for a specific subject
 * Validates: Requirements 10.2
 */
export async function getSubjectProgress(
  studentId: string,
  subject: string
): Promise<ProgressData> {
  const results = await prisma.academicResult.findMany({
    where: {
      studentId,
      subject,
    },
    orderBy: {
      examDate: 'asc',
    },
  });

  if (results.length === 0) {
    return {
      subject,
      results: [],
      averageScore: 0,
      improvement: null,
      trend: 'stable',
    };
  }

  // Calculate average score
  const totalPercentage = results.reduce((sum, r) => {
    return sum + (Number(r.score) / Number(r.maxScore)) * 100;
  }, 0);
  const averageScore = totalPercentage / results.length;

  // Calculate improvement
  const improvement = await calculateImprovement(studentId, subject);

  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (improvement !== null) {
    if (improvement > 5) {
      trend = 'improving';
    } else if (improvement < -5) {
      trend = 'declining';
    }
  }

  return {
    subject,
    results,
    averageScore: Math.round(averageScore * 100) / 100,
    improvement,
    trend,
  };
}

/**
 * Get progress dashboard for a student
 * Validates: Requirements 10.2, 10.5
 */
export async function getProgressDashboard(
  studentId: string
): Promise<ProgressDashboard> {
  // Get total hours tutored
  const completedSessions = await prisma.tutoringSession.findMany({
    where: {
      status: 'COMPLETED',
      class: {
        members: {
          some: {
            studentId,
            isActive: true,
          },
        },
      },
    },
    select: {
      scheduledStart: true,
      scheduledEnd: true,
      actualStart: true,
      actualEnd: true,
    },
  });

  const totalHoursTutored = completedSessions.reduce((total, session) => {
    const start = session.actualStart || session.scheduledStart;
    const end = session.actualEnd || session.scheduledEnd;
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  // Get upcoming sessions count
  const upcomingSessions = await prisma.tutoringSession.count({
    where: {
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
      scheduledStart: {
        gte: new Date(),
      },
      class: {
        members: {
          some: {
            studentId,
            isActive: true,
          },
        },
      },
    },
  });

  // Get all subjects with results
  const allResults = await prisma.academicResult.findMany({
    where: { studentId },
    orderBy: { examDate: 'desc' },
  });

  const subjects = [...new Set(allResults.map(r => r.subject))];

  // Get progress for each subject
  const progressBySubject = await Promise.all(
    subjects.map(subject => getSubjectProgress(studentId, subject))
  );

  // Calculate overall improvement
  const improvements = progressBySubject
    .map(p => p.improvement)
    .filter((imp): imp is number => imp !== null);

  const overallImprovement = improvements.length > 0
    ? improvements.reduce((a, b) => a + b, 0) / improvements.length
    : null;

  // Get recent results (last 10)
  const recentResults = allResults.slice(0, 10);

  return {
    totalHoursTutored: Math.round(totalHoursTutored * 100) / 100,
    upcomingSessions,
    progressBySubject,
    overallImprovement: overallImprovement !== null 
      ? Math.round(overallImprovement * 100) / 100 
      : null,
    recentResults,
  };
}

/**
 * Get visualization data for progress charts
 * Validates: Requirements 10.2
 */
export async function getProgressVisualizationData(
  studentId: string,
  subject?: string
): Promise<{
  labels: string[];
  scores: number[];
  averages: number[];
}> {
  const whereConditions: any = { studentId };
  if (subject) {
    whereConditions.subject = subject;
  }

  const results = await prisma.academicResult.findMany({
    where: whereConditions,
    orderBy: {
      examDate: 'asc',
    },
  });

  if (results.length === 0) {
    return {
      labels: [],
      scores: [],
      averages: [],
    };
  }

  // Prepare data for charts
  const labels = results.map(r => 
    `${r.examName} (${r.examDate.toLocaleDateString()})`
  );

  const scores = results.map(r => 
    Math.round((Number(r.score) / Number(r.maxScore)) * 100 * 100) / 100
  );

  // Calculate running average
  const averages = scores.map((_, index) => {
    const subset = scores.slice(0, index + 1);
    const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
    return Math.round(avg * 100) / 100;
  });

  return {
    labels,
    scores,
    averages,
  };
}

/**
 * Update an academic result
 */
export async function updateAcademicResult(
  resultId: string,
  studentId: string,
  data: Partial<CreateAcademicResultData>
): Promise<AcademicResultWithDetails> {
  // Get existing result
  const existingResult = await prisma.academicResult.findUnique({
    where: { id: resultId },
  });

  if (!existingResult) {
    throw new NotFoundError('Academic result not found');
  }

  // Verify ownership
  if (existingResult.studentId !== studentId) {
    throw new AuthorizationError('You can only update your own academic results');
  }

  // Validate updated data
  const updateData: any = {};
  
  if (data.subject !== undefined) {
    if (!data.subject || data.subject.trim().length === 0) {
      throw new ValidationError('Subject cannot be empty');
    }
    updateData.subject = data.subject;
  }

  if (data.examName !== undefined) {
    if (!data.examName || data.examName.trim().length === 0) {
      throw new ValidationError('Exam name cannot be empty');
    }
    updateData.examName = data.examName;
  }

  if (data.score !== undefined) {
    if (data.score < 0) {
      throw new ValidationError('Score cannot be negative');
    }
    const maxScore = data.maxScore !== undefined ? data.maxScore : Number(existingResult.maxScore);
    if (data.score > maxScore) {
      throw new ValidationError('Score cannot exceed max score');
    }
    updateData.score = data.score;
  }

  if (data.maxScore !== undefined) {
    if (data.maxScore <= 0) {
      throw new ValidationError('Max score must be greater than zero');
    }
    const score = data.score !== undefined ? data.score : Number(existingResult.score);
    if (score > data.maxScore) {
      throw new ValidationError('Score cannot exceed max score');
    }
    updateData.maxScore = data.maxScore;
  }

  if (data.examDate !== undefined) {
    if (data.examDate > new Date()) {
      throw new ValidationError('Exam date cannot be in the future');
    }
    updateData.examDate = data.examDate;
  }

  // Update result
  const updatedResult = await prisma.academicResult.update({
    where: { id: resultId },
    data: updateData,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Re-check Progressiste badge eligibility
  await checkProgressisteBadge(studentId);

  return updatedResult as AcademicResultWithDetails;
}

/**
 * Delete an academic result
 */
export async function deleteAcademicResult(
  resultId: string,
  studentId: string
): Promise<void> {
  // Get existing result
  const existingResult = await prisma.academicResult.findUnique({
    where: { id: resultId },
  });

  if (!existingResult) {
    throw new NotFoundError('Academic result not found');
  }

  // Verify ownership
  if (existingResult.studentId !== studentId) {
    throw new AuthorizationError('You can only delete your own academic results');
  }

  // Delete result
  await prisma.academicResult.delete({
    where: { id: resultId },
  });
}

/**
 * Check if student should receive Progressiste badge
 * Validates: Requirements 10.4
 */
async function checkProgressisteBadge(studentId: string): Promise<void> {
  // Get all subjects with results
  const allResults = await prisma.academicResult.findMany({
    where: { studentId },
  });

  const subjects = [...new Set(allResults.map(r => r.subject))];

  // Check improvement for each subject
  for (const subject of subjects) {
    const improvement = await calculateImprovement(studentId, subject);
    
    if (improvement !== null && improvement >= 10) {
      // Check if badge exists
      let badge = await prisma.badge.findFirst({
        where: { name: 'Progressiste' },
      });

      // Create badge if it doesn't exist
      if (!badge) {
        badge = await prisma.badge.create({
          data: {
            name: 'Progressiste',
            description: 'Awarded for achieving 10% or more improvement in academic performance',
            category: 'STUDENT',
            criteria: {
              type: 'improvement',
              threshold: 10,
            },
          },
        });
      }

      // Check if user already has the badge
      const existingUserBadge = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId: studentId,
            badgeId: badge.id,
          },
        },
      });

      if (!existingUserBadge) {
        // Award badge
        await prisma.userBadge.create({
          data: {
            userId: studentId,
            badgeId: badge.id,
          },
        });

        // Add loyalty points (Requirement 11.4)
        await prisma.user.update({
          where: { id: studentId },
          data: {
            walletBalance: {
              increment: 100, // 100 loyalty points
            },
          },
        });

        // TODO: Send notification (Requirement 11.4)
        console.log(`Progressiste badge awarded to student ${studentId}`);
      }

      // Only award once, so break after first qualifying subject
      break;
    }
  }
}

/**
 * Get all subjects for a student
 */
export async function getStudentSubjects(studentId: string): Promise<string[]> {
  const results = await prisma.academicResult.findMany({
    where: { studentId },
    select: { subject: true },
    distinct: ['subject'],
  });

  return results.map(r => r.subject);
}
