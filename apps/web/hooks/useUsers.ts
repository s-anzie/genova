'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TUTOR' | 'STUDENT';
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useUsers(filters?: { 
  role?: string; 
  search?: string; 
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: filters?.page || 1,
        limit: filters?.limit || 12,
      };
      if (filters?.role) params.role = filters.role;
      if (filters?.search) params.search = filters.search;
      if (filters?.isActive !== undefined) params.isActive = filters.isActive;

      const response: any = await api.get('/users', { params });
      setUsers(response.data || []);
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
    fetchUsers();
  }, [filters?.role, filters?.search, filters?.isActive, filters?.page, filters?.limit]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
  };
}
