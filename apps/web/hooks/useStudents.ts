'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useStudents(filters?: { page?: number; limit?: number; search?: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        role: 'STUDENT',
        page: filters?.page || 1,
        limit: filters?.limit || 12,
      };
      if (filters?.search) {
        params.search = filters.search;
      }
      const response: any = await api.get('/users', { params });
      setStudents(response.data || []);
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
    fetchStudents();
  }, [filters?.page, filters?.limit, filters?.search]);

  return {
    students,
    loading,
    error,
    pagination,
    refetch: fetchStudents,
  };
}
