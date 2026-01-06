'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

export interface EducationSystem {
  id: string;
  code: string;
  name: string;
  countryId: string;
  sortOrder: number;
  isActive: boolean;
  country: {
    code: string;
    name: string;
  };
}

export interface EducationLevel {
  id: string;
  code: string;
  name: string;
  category: string;
  order: number;
  hasStreams: boolean;
}

export interface EducationStream {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  category: string;
  icon?: string;
  color?: string;
}

export interface TeachingLanguage {
  id: string;
  code: string;
  name: string;
  nativeName?: string;
}

export function useEducationSystems(countryCode?: string) {
  const [systems, setSystems] = useState<EducationSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getEducationSystems(countryCode);
      setSystems(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching education systems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, [countryCode]);

  return {
    systems,
    loading,
    error,
    refetch: fetchSystems,
  };
}

export function useEducationLevels(systemId?: string) {
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchLevels = async (sysId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getEducationLevels(sysId);
      setLevels(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching levels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (systemId) {
      fetchLevels(systemId);
    }
  }, [systemId]);

  return {
    levels,
    loading,
    error,
    fetchLevels,
  };
}

export function useStreams(levelId?: string) {
  const [streams, setStreams] = useState<EducationStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStreams = async (lvlId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getStreams(lvlId);
      setStreams(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (levelId) {
      fetchStreams(levelId);
    }
  }, [levelId]);

  return {
    streams,
    loading,
    error,
    fetchStreams,
  };
}

export function useSubjects(category?: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getSubjects(category);
      setSubjects(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [category]);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
  };
}

export function useLanguages() {
  const [languages, setLanguages] = useState<TeachingLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await api.getLanguages();
      setLanguages(response.data || []);
    } catch (err: any) {
      setError(err as ApiError);
      console.error('Error fetching languages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return {
    languages,
    loading,
    error,
    refetch: fetchLanguages,
  };
}
