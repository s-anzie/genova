'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface MobileOperator {
  id: string;
  code: string;
  name: string;
  displayName: string;
  provider: string;
  country: string;
  countryName: string;
  currency: string;
  phonePrefix: string;
  phoneFormat: string;
  phoneLength: number;
  color?: string;
  logoUrl?: string;
  isActive: boolean;
  supportedFeatures?: any;
  fees?: any;
  limits?: any;
}

export function useOperators(country?: string) {
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getOperators(country);
      setOperators(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching operators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [country]);

  const createOperator = async (data: Partial<MobileOperator>) => {
    try {
      const response = await api.createOperator(data);
      await fetchOperators();
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create operator');
    }
  };

  const updateOperator = async (id: string, data: Partial<MobileOperator>) => {
    try {
      const response = await api.updateOperator(id, data);
      await fetchOperators();
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update operator');
    }
  };

  return {
    operators,
    loading,
    error,
    refetch: fetchOperators,
    createOperator,
    updateOperator,
  };
}
