'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getCountries();
      setCountries(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  return {
    countries,
    loading,
    error,
    refetch: fetchCountries,
  };
}
