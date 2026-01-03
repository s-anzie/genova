import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/utils/api-client';
import { useAuth } from './auth-context';
import { SessionResponse, CreateSessionData, UpdateSessionData } from '@/types/api';

interface SessionContextType {
  sessions: SessionResponse[];
  upcomingSessions: SessionResponse[];
  pastSessions: SessionResponse[];
  pendingSessions: SessionResponse[];
  nextSession: SessionResponse | null;
  todaySessions: SessionResponse[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  createSession: (data: CreateSessionData) => Promise<SessionResponse>;
  updateSession: (id: string, data: UpdateSessionData) => Promise<SessionResponse>;
  cancelSession: (id: string, reason?: string) => Promise<void>;
  confirmSession: (id: string) => Promise<void>;
  checkInSession: (id: string, pin?: string) => Promise<void>;
  checkOutSession: (id: string) => Promise<void>;
  getSessionById: (id: string) => Promise<SessionResponse | null>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setSessions([]);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all sessions for the user
      const response = await apiClient.get<{ data: SessionResponse[] }>('/sessions');
      const allSessions = response.data || [];

      // Sort by scheduled start time
      allSessions.sort((a, b) => 
        new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      );

      setSessions(allSessions);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Computed values
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const upcomingSessions = sessions.filter(
    s => new Date(s.scheduledStart) > now && s.status === 'CONFIRMED'
  );

  const pastSessions = sessions.filter(
    s => new Date(s.scheduledStart) < now && (s.status === 'COMPLETED' || s.status === 'CANCELLED')
  );

  const pendingSessions = sessions.filter(s => s.status === 'PENDING');

  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduledStart);
    return sessionDate >= todayStart && sessionDate <= todayEnd;
  });

  const refreshSessions = useCallback(async () => {
    await loadSessions(true);
  }, [loadSessions]);

  const createSession = useCallback(async (data: CreateSessionData): Promise<SessionResponse> => {
    try {
      setError(null);
      const response = await apiClient.post<{ data: SessionResponse }>('/sessions', data);
      await refreshSessions();
      return response.data;
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create session');
      throw err;
    }
  }, [refreshSessions]);

  const updateSession = useCallback(async (
    id: string,
    data: UpdateSessionData
  ): Promise<SessionResponse> => {
    try {
      setError(null);
      const response = await apiClient.put<{ data: SessionResponse }>(`/sessions/${id}`, data);
      await refreshSessions();
      return response.data;
    } catch (err: any) {
      console.error('Failed to update session:', err);
      setError(err.message || 'Failed to update session');
      throw err;
    }
  }, [refreshSessions]);

  const cancelSession = useCallback(async (id: string, reason?: string) => {
    try {
      setError(null);
      // Send reason in request body if provided
      if (reason) {
        await apiClient.post(`/sessions/${id}/cancel`, { reason });
      } else {
        await apiClient.delete(`/sessions/${id}`);
      }
      await refreshSessions();
    } catch (err: any) {
      console.error('Failed to cancel session:', err);
      setError(err.message || 'Failed to cancel session');
      throw err;
    }
  }, [refreshSessions]);

  const confirmSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await apiClient.put(`/sessions/${id}/status`, { status: 'CONFIRMED' });
      await refreshSessions();
    } catch (err: any) {
      console.error('Failed to confirm session:', err);
      setError(err.message || 'Failed to confirm session');
      throw err;
    }
  }, [refreshSessions]);

  const checkInSession = useCallback(async (id: string, pin?: string) => {
    try {
      setError(null);
      await apiClient.post(`/sessions/${id}/checkin`, { pin });
      await refreshSessions();
    } catch (err: any) {
      console.error('Failed to check in:', err);
      setError(err.message || 'Failed to check in');
      throw err;
    }
  }, [refreshSessions]);

  const checkOutSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await apiClient.post(`/sessions/${id}/checkout`);
      await refreshSessions();
    } catch (err: any) {
      console.error('Failed to check out:', err);
      setError(err.message || 'Failed to check out');
      throw err;
    }
  }, [refreshSessions]);

  const getSessionById = useCallback(async (id: string): Promise<SessionResponse | null> => {
    try {
      const response = await apiClient.get<{ data: SessionResponse }>(`/sessions/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('Failed to get session:', err);
      return null;
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        upcomingSessions,
        pastSessions,
        pendingSessions,
        nextSession,
        todaySessions,
        isLoading,
        isRefreshing,
        error,
        refreshSessions,
        createSession,
        updateSession,
        cancelSession,
        confirmSession,
        checkInSession,
        checkOutSession,
        getSessionById,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
