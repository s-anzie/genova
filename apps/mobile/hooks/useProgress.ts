import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/api-client';
import {
  ProgressDashboard,
  ProgressData,
  AcademicResultResponse,
  CreateAcademicResultData,
  ProgressVisualizationData,
} from '@/types/api';

interface UseProgressReturn {
  dashboard: ProgressDashboard | null;
  subjects: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addResult: (data: CreateAcademicResultData) => Promise<void>;
  updateResult: (id: string, data: Partial<CreateAcademicResultData>) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  getSubjectProgress: (subject: string) => Promise<ProgressData | null>;
  getVisualizationData: (subject?: string) => Promise<ProgressVisualizationData | null>;
}

export function useProgress(): UseProgressReturn {
  const [dashboard, setDashboard] = useState<ProgressDashboard | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Fetch dashboard data
      const dashboardRes = await apiClient.get<{ data: ProgressDashboard }>(
        '/progress/dashboard'
      );

      // Fetch subjects
      const subjectsRes = await apiClient.get<{ data: string[] }>(
        '/progress/subjects'
      );

      setDashboard(dashboardRes.data);
      setSubjects(subjectsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching progress dashboard:', err);
      setError(err.message || 'Failed to load progress data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refresh = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const addResult = useCallback(async (data: CreateAcademicResultData) => {
    try {
      await apiClient.post('/progress/results', data);
      await refresh();
    } catch (err: any) {
      console.error('Error adding academic result:', err);
      throw new Error(err.message || 'Failed to add result');
    }
  }, [refresh]);

  const updateResult = useCallback(async (
    id: string,
    data: Partial<CreateAcademicResultData>
  ) => {
    try {
      await apiClient.put(`/progress/results/${id}`, data);
      await refresh();
    } catch (err: any) {
      console.error('Error updating academic result:', err);
      throw new Error(err.message || 'Failed to update result');
    }
  }, [refresh]);

  const deleteResult = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/progress/results/${id}`);
      await refresh();
    } catch (err: any) {
      console.error('Error deleting academic result:', err);
      throw new Error(err.message || 'Failed to delete result');
    }
  }, [refresh]);

  const getSubjectProgress = useCallback(async (subject: string): Promise<ProgressData | null> => {
    try {
      const res = await apiClient.get<{ data: ProgressData }>(
        `/progress/subject/${encodeURIComponent(subject)}`
      );
      return res.data;
    } catch (err: any) {
      console.error('Error fetching subject progress:', err);
      return null;
    }
  }, []);

  const getVisualizationData = useCallback(async (
    subject?: string
  ): Promise<ProgressVisualizationData | null> => {
    try {
      const url = subject
        ? `/progress/visualization?subject=${encodeURIComponent(subject)}`
        : '/progress/visualization';
      
      const res = await apiClient.get<{ data: ProgressVisualizationData }>(url);
      return res.data;
    } catch (err: any) {
      console.error('Error fetching visualization data:', err);
      return null;
    }
  }, []);

  return {
    dashboard,
    subjects,
    isLoading,
    isRefreshing,
    error,
    refresh,
    addResult,
    updateResult,
    deleteResult,
    getSubjectProgress,
    getVisualizationData,
  };
}
