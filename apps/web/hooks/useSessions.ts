'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Session {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  subject: string;
  tutor: {
    firstName: string;
    lastName: string;
  };
  student: {
    firstName: string;
    lastName: string;
  };
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.get('/sessions');
      setSessions(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
