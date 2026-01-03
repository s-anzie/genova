import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api-client';

export interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string;
  phoneFormat: string;
  phoneExample: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  timezone: string;
}

export interface City {
  id: string;
  name: string;
  region?: string;
}

export interface PhoneOperator {
  id: string;
  name: string;
  prefixes: string[];
  regex: string;
}

export interface Language {
  id: string;
  name: string;
  code?: string;
  isOfficial: boolean;
}

export interface EducationSystem {
  id: string;
  name: string;
  label: string;
}

export interface CountryDetails extends Country {
  cities: City[];
  operators: PhoneOperator[];
  languages: Language[];
  educationSystems: EducationSystem[];
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Country[] }>('/regions/countries');
      setCountries(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load countries:', err);
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  return { countries, loading, error, reload: loadCountries };
}

export function useCountryDetails(countryCode: string | null) {
  const [country, setCountry] = useState<CountryDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countryCode) {
      loadCountryDetails(countryCode);
    }
  }, [countryCode]);

  const loadCountryDetails = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: CountryDetails }>(`/regions/countries/${code}`);
      setCountry(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load country details:', err);
      setError(err.message || 'Failed to load country details');
    } finally {
      setLoading(false);
    }
  };

  return { country, loading, error, reload: () => countryCode && loadCountryDetails(countryCode) };
}

export function useCities(countryCode: string | null) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countryCode) {
      loadCities(countryCode);
    }
  }, [countryCode]);

  const loadCities = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: City[] }>(`/regions/countries/${code}/cities`);
      setCities(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load cities:', err);
      setError(err.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  return { cities, loading, error, reload: () => countryCode && loadCities(countryCode) };
}

export function useLanguages(countryCode: string | null) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countryCode) {
      loadLanguages(countryCode);
    }
  }, [countryCode]);

  const loadLanguages = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Language[] }>(`/regions/countries/${code}/languages`);
      setLanguages(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load languages:', err);
      setError(err.message || 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  return { languages, loading, error, reload: () => countryCode && loadLanguages(countryCode) };
}

export function useEducationSystems(countryCode: string | null) {
  const [systems, setSystems] = useState<EducationSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countryCode) {
      loadEducationSystems(countryCode);
    }
  }, [countryCode]);

  const loadEducationSystems = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: EducationSystem[] }>(`/regions/countries/${code}/education-systems`);
      setSystems(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load education systems:', err);
      setError(err.message || 'Failed to load education systems');
    } finally {
      setLoading(false);
    }
  };

  return { systems, loading, error, reload: () => countryCode && loadEducationSystems(countryCode) };
}

export async function validatePhoneNumber(phone: string, countryCode: string) {
  try {
    const response = await apiClient.post<{
      data: {
        isValid: boolean;
        operator: string | null;
        formatted: string | null;
      };
    }>('/regions/validate-phone', { phone, countryCode });
    return response.data;
  } catch (err: any) {
    console.error('Failed to validate phone:', err);
    return { isValid: false, operator: null, formatted: null };
  }
}
