import { PrismaClient, LearningGoal } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateLearningGoalData {
  classId?: string;
  levelSubjectId: string; // Required: Reference to LevelSubject
  title: string;
  description?: string;
  targetScore: number;
  deadline: Date;
}

export interface UpdateLearningGoalData {
  title?: string;
  description?: string;
  targetScore?: number;
  currentScore?: number;
  deadline?: Date;
  isCompleted?: boolean;
}

export interface GoalProgress {
  goalId: string;
  goal: LearningGoal;
  progressPercentage: number;
  daysRemaining: number;
  isOverdue: boolean;
  recentResults: Array<{
    examName: string;
    score: number;
    maxScore: number;
    examDate: Date;
  }>;
}

/**
 * Validate learning goal data
 */
function validateLearningGoal(data: CreateLearningGoalData): void {
  if (!data.levelSubjectId) {
    throw new ValidationError('levelSubjectId is required');
  }

  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('Title is required');
  }

  if (data.targetScore < 0 || data.targetScore > 100) {
    throw new ValidationError('Target score must be between 0 and 100');
  }

  if (!data.deadline) {
    throw new ValidationError('Deadline is required');
  }

  // Validate deadline is in the future
  if (data.deadline <= new Date()) {
    throw new ValidationError('Deadline must be in the future');
  }
}

/**
 * Create a new learning goal
 */
export async function createLearningGoal(
  studentId: string,
  data: CreateLearningGoalData
): Promise<LearningGoal> {
  // Validate data
  validateLearningGoal(data);

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'STUDENT') {
    throw new AuthorizationError('Only students can create learning goals');
  }

  // Verify levelSubject exists
  const levelSubject = await prisma.levelSubject.findUnique({
    where: { id: data.levelSubjectId },
  });

  if (!levelSubject) {
    throw new NotFoundError('LevelSubject not found');
  }

  // Create goal
  const goal = await prisma.learningGoal.create({
    data: {
      studentId,
      classId: data.classId,
      levelSubjectId: data.levelSubjectId,
      title: data.title.trim(),
      description: data.description?.trim(),
      targetScore: data.targetScore,
      deadline: data.deadline,
    },
  });

  return goal;
}

/**
 * Get all learning goals for a student
 */
export async function getStudentGoals(
  studentId: string,
  filters?: {
    levelSubjectId?: string;
    isCompleted?: boolean;
    includeOverdue?: boolean;
  }
): Promise<LearningGoal[]> {
  const where: any = { studentId };

  if (filters?.levelSubjectId) {
    where.levelSubjectId = filters.levelSubjectId;
  }

  if (filters?.isCompleted !== undefined) {
    where.isCompleted = filters.isCompleted;
  }

  if (filters?.includeOverdue === false) {
    where.OR = [
      { isCompleted: true },
      { deadline: { gte: new Date() } },
    ];
  }

  const goals = await prisma.learningGoal.findMany({
    where,
    orderBy: [
      { isCompleted: 'asc' },
      { deadline: 'asc' },
    ],
    include: {
      levelSubject: {
        include: {
          subject: true,
          level: true,
        },
      },
    },
  });

  return goals;
}

/**
 * Get a single learning goal by ID
 */
export async function getLearningGoalById(
  goalId: string,
  studentId: string
): Promise<LearningGoal> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new NotFoundError('Learning goal not found');
  }

  if (goal.studentId !== studentId) {
    throw new AuthorizationError('You do not have access to this goal');
  }

  return goal;
}

/**
 * Update a learning goal
 */
export async function updateLearningGoal(
  goalId: string,
  studentId: string,
  data: UpdateLearningGoalData
): Promise<LearningGoal> {
  // Verify goal exists and belongs to student
  const existingGoal = await getLearningGoalById(goalId, studentId);

  // Validate updates
  if (data.targetScore !== undefined && (data.targetScore < 0 || data.targetScore > 100)) {
    throw new ValidationError('Target score must be between 0 and 100');
  }

  if (data.currentScore !== undefined && (data.currentScore < 0 || data.currentScore > 100)) {
    throw new ValidationError('Current score must be between 0 and 100');
  }

  if (data.deadline && data.deadline <= new Date() && !existingGoal.isCompleted) {
    throw new ValidationError('Deadline must be in the future for active goals');
  }

  // Check if goal should be marked as completed
  const updateData: any = { ...data };
  
  if (data.isCompleted && !existingGoal.isCompleted) {
    updateData.completedAt = new Date();
  } else if (data.isCompleted === false && existingGoal.isCompleted) {
    updateData.completedAt = null;
  }

  // Update goal
  const updatedGoal = await prisma.learningGoal.update({
    where: { id: goalId },
    data: updateData,
  });

  return updatedGoal;
}

/**
 * Delete a learning goal
 */
export async function deleteLearningGoal(
  goalId: string,
  studentId: string
): Promise<void> {
  // Verify goal exists and belongs to student
  await getLearningGoalById(goalId, studentId);

  // Delete goal
  await prisma.learningGoal.delete({
    where: { id: goalId },
  });
}

/**
 * Get goal progress with related academic results
 */
export async function getGoalProgress(
  goalId: string,
  studentId: string
): Promise<GoalProgress> {
  const goal = await getLearningGoalById(goalId, studentId);

  // Get recent academic results for this levelSubject
  const results = await prisma.academicResult.findMany({
    where: {
      studentId,
      levelSubjectId: goal.levelSubjectId,
      examDate: {
        gte: goal.createdAt,
      },
    },
    orderBy: {
      examDate: 'desc',
    },
    take: 10,
  });

  // Calculate progress percentage
  const progressPercentage = Number(goal.targetScore) > 0
    ? Math.min(100, (Number(goal.currentScore) / Number(goal.targetScore)) * 100)
    : 0;

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = Math.ceil((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0 && !goal.isCompleted;

  return {
    goalId: goal.id,
    goal,
    progressPercentage,
    daysRemaining,
    isOverdue,
    recentResults: results.map(r => ({
      examName: r.examName,
      score: Number(r.score),
      maxScore: Number(r.maxScore),
      examDate: r.examDate,
    })),
  };
}

/**
 * Update goal progress based on latest academic results
 * This should be called automatically when a new academic result is added
 */
export async function updateGoalProgressFromResults(
  studentId: string,
  levelSubjectId: string
): Promise<void> {
  // Get all active goals for this levelSubject
  const goals = await prisma.learningGoal.findMany({
    where: {
      studentId,
      levelSubjectId,
      isCompleted: false,
    },
  });

  if (goals.length === 0) {
    return;
  }

  // Get latest academic results for this levelSubject
  const results = await prisma.academicResult.findMany({
    where: {
      studentId,
      levelSubjectId,
    },
    orderBy: {
      examDate: 'desc',
    },
    take: 5,
  });

  if (results.length === 0) {
    return;
  }

  // Calculate average score from recent results
  const totalScore = results.reduce((sum, r) => {
    const percentage = (Number(r.score) / Number(r.maxScore)) * 100;
    return sum + percentage;
  }, 0);
  const averageScore = totalScore / results.length;

  // Update each goal's current score
  for (const goal of goals) {
    const updateData: any = {
      currentScore: averageScore,
    };

    // Check if goal is completed
    if (averageScore >= Number(goal.targetScore) && !goal.isCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    await prisma.learningGoal.update({
      where: { id: goal.id },
      data: updateData,
    });
  }
}

/**
 * Get goal statistics for a student
 */
export async function getGoalStatistics(studentId: string): Promise<{
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  overdueGoals: number;
  completionRate: number;
}> {
  const allGoals = await prisma.learningGoal.findMany({
    where: { studentId },
  });

  const now = new Date();
  const completedGoals = allGoals.filter(g => g.isCompleted).length;
  const activeGoals = allGoals.filter(g => !g.isCompleted && g.deadline >= now).length;
  const overdueGoals = allGoals.filter(g => !g.isCompleted && g.deadline < now).length;
  const completionRate = allGoals.length > 0 ? (completedGoals / allGoals.length) * 100 : 0;

  return {
    totalGoals: allGoals.length,
    completedGoals,
    activeGoals,
    overdueGoals,
    completionRate,
  };
}
