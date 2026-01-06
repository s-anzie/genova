'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Tutor {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  hourlyRate: number;
  experienceYears: number;
  bio?: string;
  teachingMode: string;
  averageRating?: number;
  totalReviews?: number;
  totalSessions?: number;
  subjects?: Array<{ name: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useTutors(filters?: { page?: number; limit?: number; search?: string }) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        role: 'TUTOR',
        page: filters?.page || 1,
        limit: filters?.limit || 12,
      };
      if (filters?.search) {
        params.search = filters.search;
      }
      const response: any = await api.get('/users', { params });
      setTutors(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err: any) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [filters?.page, filters?.limit, filters?.search]);

  return {
    tutors,
    loading,
    error,
    pagination,
    refetch: fetchTutors,
  };
}
