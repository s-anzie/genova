import { PrismaClient, LearningGoal, GoalPriority, GoalStatus } from '@prisma/client';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@repo/utils';

const prisma = new PrismaClient();

// Types
export interface CreateGoalData {
  subject: string;
  title: string;
  description?: string;
  targetScore: number;
  deadline: Date;
  priority?: GoalPriority;
}

export interface UpdateGoalData {
  subject?: string;
  title?: string;
  description?: string;
  targetScore?: number;
  currentScore?: number;
  deadline?: Date;
  priority?: GoalPriority;
  status?: GoalStatus;
}

export interface GoalWithProgress extends LearningGoal {
  progressPercentage: number;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface GoalsDashboard {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overdueGoals: number;
  goalsBySubject: {
    subject: string;
    count: number;
    completed: number;
  }[];
  recentGoals: GoalWithProgress[];
}

/**
 * Validate goal data
 */
function validateGoalData(data: CreateGoalData | UpdateGoalData): void {
  if ('subject' in data && data.subject && data.subject.trim().length === 0) {
    throw new ValidationError('Le sujet est requis');
  }

  if ('title' in data && data.title && data.title.trim().length === 0) {
    throw new ValidationError('Le titre est requis');
  }

  if ('targetScore' in data && data.targetScore !== undefined) {
    if (data.targetScore < 0 || data.targetScore > 100) {
      throw new ValidationError('Le score cible doit être entre 0 et 100');
    }
  }

  if ('currentScore' in data && data.currentScore !== undefined) {
    if (data.currentScore < 0 || data.currentScore > 100) {
      throw new ValidationError('Le score actuel doit être entre 0 et 100');
    }
  }

  if ('deadline' in data && data.deadline) {
    const deadline = new Date(data.deadline);
    const now = new Date();
    if (deadline < now) {
      throw new ValidationError('La date limite ne peut pas être dans le passé');
    }
  }
}

/**
 * Calculate goal progress
 */
function calculateGoalProgress(goal: LearningGoal): GoalWithProgress {
  const currentScore = goal.currentScore ? parseFloat(goal.currentScore.toString()) : 0;
  const targetScore = parseFloat(goal.targetScore.toString());
  
  const progressPercentage = targetScore > 0 
    ? Math.min(100, Math.round((currentScore / targetScore) * 100))
    : 0;

  const now = new Date();
  const deadline = new Date(goal.deadline);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0 && goal.status === 'IN_PROGRESS';

  return {
    ...goal,
    progressPercentage,
    daysRemaining,
    isOverdue,
  };
}

/**
 * Create a learning goal
 */
export async function createGoal(
  studentId: string,
  data: CreateGoalData
): Promise<GoalWithProgress> {
  // Validate data
  validateGoalData(data);

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });

  if (!student) {
    throw new NotFoundError('Étudiant non trouvé');
  }

  if (student.role !== 'STUDENT') {
    throw new AuthorizationError('Seuls les étudiants peuvent créer des objectifs');
  }

  // Create goal
  const goal = await prisma.learningGoal.create({
    data: {
      studentId,
      subject: data.subject,
      title: data.title,
      description: data.description,
      targetScore: data.targetScore,
      deadline: data.deadline,
      priority: data.priority || 'MEDIUM',
      status: 'IN_PROGRESS',
    },
  });

  return calculateGoalProgress(goal);
}

/**
 * Get all goals for a student
 */
export async function getStudentGoals(
  studentId: string,
  filters?: {
    subject?: string;
    status?: GoalStatus;
    priority?: GoalPriority;
  }
): Promise<GoalWithProgress[]> {
  const where: any = { studentId };

  if (filters?.subject) {
    where.subject = filters.subject;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  const goals = await prisma.learningGoal.findMany({
    where,
    orderBy: [
      { status: 'asc' }, // IN_PROGRESS first
      { deadline: 'asc' },
    ],
  });

  return goals.map(calculateGoalProgress);
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(
  goalId: string,
  studentId: string
): Promise<GoalWithProgress> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new NotFoundError('Objectif non trouvé');
  }

  if (goal.studentId !== studentId) {
    throw new AuthorizationError('Vous n\'avez pas accès à cet objectif');
  }

  return calculateGoalProgress(goal);
}

/**
 * Update a goal
 */
export async function updateGoal(
  goalId: string,
  studentId: string,
  data: UpdateGoalData
): Promise<GoalWithProgress> {
  // Validate data
  validateGoalData(data);

  // Check if goal exists and belongs to student
  const existingGoal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!existingGoal) {
    throw new NotFoundError('Objectif non trouvé');
  }

  if (existingGoal.studentId !== studentId) {
    throw new AuthorizationError('Vous n\'avez pas accès à cet objectif');
  }

  // Update goal
  const goal = await prisma.learningGoal.update({
    where: { id: goalId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return calculateGoalProgress(goal);
}

/**
 * Delete a goal
 */
export async function deleteGoal(
  goalId: string,
  studentId: string
): Promise<void> {
  // Check if goal exists and belongs to student
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new NotFoundError('Objectif non trouvé');
  }

  if (goal.studentId !== studentId) {
    throw new AuthorizationError('Vous n\'avez pas accès à cet objectif');
  }

  await prisma.learningGoal.delete({
    where: { id: goalId },
  });
}

/**
 * Mark goal as completed
 */
export async function completeGoal(
  goalId: string,
  studentId: string
): Promise<GoalWithProgress> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new NotFoundError('Objectif non trouvé');
  }

  if (goal.studentId !== studentId) {
    throw new AuthorizationError('Vous n\'avez pas accès à cet objectif');
  }

  const updatedGoal = await prisma.learningGoal.update({
    where: { id: goalId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return calculateGoalProgress(updatedGoal);
}

/**
 * Update goal progress based on latest academic results
 */
export async function updateGoalProgress(
  studentId: string,
  subject: string
): Promise<void> {
  // Get active goals for this subject
  const goals = await prisma.learningGoal.findMany({
    where: {
      studentId,
      subject,
      status: 'IN_PROGRESS',
    },
  });

  if (goals.length === 0) {
    return;
  }

  // Get latest academic result for this subject
  const latestResult = await prisma.academicResult.findFirst({
    where: {
      studentId,
      subject,
    },
    orderBy: {
      examDate: 'desc',
    },
  });

  if (!latestResult) {
    return;
  }

  // Calculate percentage score
  const score = parseFloat(latestResult.score.toString());
  const maxScore = parseFloat(latestResult.maxScore.toString());
  const percentage = (score / maxScore) * 100;

  // Update all active goals for this subject
  for (const goal of goals) {
    const targetScore = parseFloat(goal.targetScore.toString());
    
    // Update current score
    await prisma.learningGoal.update({
      where: { id: goal.id },
      data: {
        currentScore: percentage,
        updatedAt: new Date(),
      },
    });

    // Auto-complete if target reached
    if (percentage >= targetScore) {
      await prisma.learningGoal.update({
        where: { id: goal.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Get goals dashboard
 */
export async function getGoalsDashboard(
  studentId: string
): Promise<GoalsDashboard> {
  const allGoals = await prisma.learningGoal.findMany({
    where: { studentId },
  });

  const now = new Date();
  const activeGoals = allGoals.filter(g => g.status === 'IN_PROGRESS');
  const completedGoals = allGoals.filter(g => g.status === 'COMPLETED');
  const overdueGoals = activeGoals.filter(g => new Date(g.deadline) < now);

  // Group by subject
  const subjectMap = new Map<string, { count: number; completed: number }>();
  allGoals.forEach(goal => {
    const existing = subjectMap.get(goal.subject) || { count: 0, completed: 0 };
    existing.count++;
    if (goal.status === 'COMPLETED') {
      existing.completed++;
    }
    subjectMap.set(goal.subject, existing);
  });

  const goalsBySubject = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    ...data,
  }));

  // Get recent goals (last 5)
  const recentGoals = allGoals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(calculateGoalProgress);

  return {
    totalGoals: allGoals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    overdueGoals: overdueGoals.length,
    goalsBySubject,
    recentGoals,
  };
}

/**
 * Get goal suggestions based on academic results
 */
export async function getGoalSuggestions(
  studentId: string
): Promise<Array<{ subject: string; suggestedTarget: number; reason: string }>> {
  // Get all academic results
  const results = await prisma.academicResult.findMany({
    where: { studentId },
    orderBy: { examDate: 'desc' },
  });

  if (results.length === 0) {
    return [];
  }

  // Group by subject and calculate average
  const subjectMap = new Map<string, number[]>();
  results.forEach(result => {
    const score = parseFloat(result.score.toString());
    const maxScore = parseFloat(result.maxScore.toString());
    const percentage = (score / maxScore) * 100;
    
    const scores = subjectMap.get(result.subject) || [];
    scores.push(percentage);
    subjectMap.set(result.subject, scores);
  });

  const suggestions: Array<{ subject: string; suggestedTarget: number; reason: string }> = [];

  subjectMap.forEach((scores, subject) => {
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Suggest improvement based on current average
    let suggestedTarget: number;
    let reason: string;

    if (average < 50) {
      suggestedTarget = 60;
      reason = 'Améliorer les bases pour atteindre la moyenne';
    } else if (average < 70) {
      suggestedTarget = 80;
      reason = 'Viser un bon niveau de maîtrise';
    } else if (average < 85) {
      suggestedTarget = 90;
      reason = 'Atteindre l\'excellence';
    } else {
      suggestedTarget = 95;
      reason = 'Maintenir et perfectionner l\'excellence';
    }

    suggestions.push({
      subject,
      suggestedTarget,
      reason,
    });
  });

  return suggestions;
}
