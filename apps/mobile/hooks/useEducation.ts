/**
 * Education Hooks
 * 
 * Custom hooks for fetching education system data
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api-client';

// Types
export interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

export interface EducationSystem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  country: {
    code: string;
    name: string;
  };
}

export interface EducationLevel {
  id: string;
  code: string;
  name: string;
  category: 'PRIMARY' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'UNIVERSITY' | 'PROFESSIONAL';
  order: number;
  hasStreams: boolean;
}

export interface EducationStream {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  category: 'SCIENCE' | 'LANGUAGE' | 'HUMANITIES' | 'ARTS' | 'SPORTS' | 'TECHNOLOGY' | 'ECONOMICS';
  icon: string | null;
  color: string | null;
}

export interface LevelSubject {
  id: string;
  levelId: string;
  subjectId: string;
  isCore: boolean;
  coefficient: number | null;
  hoursPerWeek: number | null;
  subject: Subject;
  level: {
    id: string;
    name: string;
  };
}

export interface TeachingLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
}

export interface City {
  id: string;
  name: string;
  region: string | null;
}

/**
 * Hook to fetch all countries
 */
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: Country[] }>(
          '/education/countries'
        );
        setCountries(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  return { countries, loading, error };
}

/**
 * Hook to fetch education systems
 */
export function useEducationSystems(countryCode?: string) {
  const [systems, setSystems] = useState<EducationSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setSystems([]);
      return;
    }

    const fetchSystems = async () => {
      try {
        setLoading(true);
        const params = countryCode ? `?countryCode=${countryCode}` : '';
        const response = await apiClient.get<{ data: EducationSystem[] }>(
          `/education/systems${params}`
        );
        setSystems(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSystems();
  }, [countryCode]);

  return { systems, loading, error };
}

/**
 * Hook to fetch education levels for a system
 */
export function useEducationLevels(systemId?: string) {
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!systemId) {
      setLevels([]);
      return;
    }

    const fetchLevels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: EducationLevel[] }>(
          `/education/systems/${systemId}/levels`
        );
        setLevels(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, [systemId]);

  return { levels, loading, error };
}

/**
 * Hook to fetch education streams for a level
 */
export function useEducationStreams(levelId?: string) {
  const [streams, setStreams] = useState<EducationStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) {
      setStreams([]);
      return;
    }

    const fetchStreams = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: EducationStream[] }>(
          `/education/levels/${levelId}/streams`
        );
        setStreams(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStreams();
  }, [levelId]);

  return { streams, loading, error };
}

/**
 * Hook to fetch subjects for a level
 */
export function useLevelSubjects(levelId?: string, category?: string) {
  const [subjects, setSubjects] = useState<LevelSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const params = category ? `?category=${category}` : '';
        const response = await apiClient.get<{ data: LevelSubject[] }>(
          `/education/levels/${levelId}/subjects${params}`
        );
        setSubjects(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [levelId, category]);

  return { subjects, loading, error };
}

/**
 * Hook to fetch subjects for a stream
 */
export function useStreamSubjects(streamId?: string, category?: string) {
  const [subjects, setSubjects] = useState<LevelSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const params = category ? `?category=${category}` : '';
        const response = await apiClient.get<{ data: LevelSubject[] }>(
          `/education/streams/${streamId}/subjects${params}`
        );
        setSubjects(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [streamId, category]);

  return { subjects, loading, error };
}

/**
 * Hook to fetch all global subjects
 */
export function useSubjects(category?: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const params = category ? `?category=${category}` : '';
        const response = await apiClient.get<{ data: Subject[] }>(
          `/education/subjects${params}`
        );
        setSubjects(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [category]);

  return { subjects, loading, error };
}

/**
 * Hook to fetch teaching languages
 */
export function useTeachingLanguages() {
  const [languages, setLanguages] = useState<TeachingLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: TeachingLanguage[] }>(
          '/education/languages'
        );
        setLanguages(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  return { languages, loading, error };
}

/**
 * Hook to fetch cities for a country
 */
export function useCities(countryCode?: string) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: City[] }>(
          `/education/countries/${countryCode}/cities`
        );
        setCities(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, [countryCode]);

  return { cities, loading, error };
}
