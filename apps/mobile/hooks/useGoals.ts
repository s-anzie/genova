import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/utils/api';
import {
  LearningGoal,
  CreateLearningGoalData,
  UpdateLearningGoalData,
  GoalProgress,
  GoalStatistics,
} from '@/types/api';

interface GoalWithProgress extends LearningGoal {
  progressPercentage: number;
  daysRemaining: number;
  isOverdue: boolean;
}

interface UseGoalsReturn {
  goals: GoalWithProgress[];
  statistics: GoalStatistics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGoal: (data: CreateLearningGoalData) => Promise<void>;
  updateGoal: (id: string, data: UpdateLearningGoalData) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalProgress: (id: string) => Promise<GoalProgress | null>;
  completeGoal: (id: string) => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [statistics, setStatistics] = useState<GoalStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Fetch goals
      const goalsRes = await ApiClient.get<{ success: boolean; data: LearningGoal[] }>('/goals');
      
      // Fetch statistics
      const statsRes = await ApiClient.get<{ success: boolean; data: GoalStatistics }>('/goals/statistics');

      // Calculate progress fields for each goal
      const goalsWithProgress: GoalWithProgress[] = (goalsRes.data || []).map(goal => {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysRemaining < 0 && !goal.isCompleted;
        
        const currentScore = Number(goal.currentScore) || 0;
        const targetScore = Number(goal.targetScore) || 1;
        const progressPercentage = targetScore > 0 ? Math.min(100, (currentScore / targetScore) * 100) : 0;

        return {
          ...goal,
          progressPercentage,
          daysRemaining,
          isOverdue,
        };
      });

      setGoals(goalsWithProgress);
      setStatistics(statsRes.data);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message || 'Échec du chargement des objectifs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const refresh = useCallback(async () => {
    await fetchGoals(true);
  }, [fetchGoals]);

  const createGoal = useCallback(async (data: CreateLearningGoalData) => {
    try {
      await ApiClient.post('/goals', data);
      await refresh();
    } catch (err: any) {
      console.error('Error creating goal:', err);
      throw new Error(err.message || 'Échec de la création de l\'objectif');
    }
  }, [refresh]);

  const updateGoal = useCallback(async (
    id: string,
    data: UpdateLearningGoalData
  ) => {
    try {
      await ApiClient.put(`/goals/${id}`, data);
      await refresh();
    } catch (err: any) {
      console.error('Error updating goal:', err);
      throw new Error(err.message || 'Échec de la mise à jour de l\'objectif');
    }
  }, [refresh]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await ApiClient.delete(`/goals/${id}`);
      await refresh();
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      throw new Error(err.message || 'Échec de la suppression de l\'objectif');
    }
  }, [refresh]);

  const getGoalProgress = useCallback(async (id: string): Promise<GoalProgress | null> => {
    try {
      const res = await ApiClient.get<{ success: boolean; data: GoalProgress }>(`/goals/${id}/progress`);
      return res.data;
    } catch (err: any) {
      console.error('Error fetching goal progress:', err);
      return null;
    }
  }, []);

  const completeGoal = useCallback(async (id: string) => {
    try {
      await ApiClient.put(`/goals/${id}`, { isCompleted: true });
      await refresh();
    } catch (err: any) {
      console.error('Error completing goal:', err);
      throw new Error(err.message || 'Échec de la complétion de l\'objectif');
    }
  }, [refresh]);

  return {
    goals,
    statistics,
    isLoading,
    isRefreshing,
    error,
    refresh,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    completeGoal,
  };
}
