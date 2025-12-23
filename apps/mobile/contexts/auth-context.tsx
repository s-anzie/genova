import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'student' | 'tutor' | 'admin'; // Support both formats
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor';
  educationLevel?: string;
  preferredSubjects?: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadStoredAuth();
    
    return () => {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        // Schedule token refresh (15 minutes - 1 minute buffer = 14 minutes)
        scheduleTokenRefresh(14 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTokenRefresh = (delay: number) => {
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
    }
    
    const timeout = setTimeout(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        await logout();
      }
    }, delay);
    
    setTokenRefreshTimeout(timeout);
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.error?.message || error.message || 'Login failed');
        } catch (parseError) {
          throw new Error(`Login failed: ${response.status} ${response.statusText}`);
        }
      }

      const result = JSON.parse(responseText);
      const data = result.data;
      
      if (!data || !data.accessToken || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      
      setUser(data.user);
      
      // Schedule token refresh
      scheduleTokenRefresh(14 * 60 * 1000);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error?.message || error.message || 'Registration failed');
        } catch (parseError) {
          throw new Error('Registration failed');
        }
      }

      const result = await response.json();
      
      // Don't auto-login after registration - let user login manually
      // This avoids confusion with cached credentials
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
        setTokenRefreshTimeout(null);
      }
      
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(API_ENDPOINTS.auth.refresh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await response.json();
      const data = result.data;
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      
      // Schedule next refresh
      scheduleTokenRefresh(14 * 60 * 1000);
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error?.message || error.message || 'Password reset failed');
        } catch (parseError) {
          throw new Error('Password reset failed');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const biometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available on this device');
      }

      const biometricEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (biometricEnabled !== 'true') {
        throw new Error('Biometric authentication not enabled. Please login with email and password first.');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Load stored credentials and verify token is still valid
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userData = await SecureStore.getItemAsync(USER_KEY);
        
        if (token && userData) {
          setUser(JSON.parse(userData));
          scheduleTokenRefresh(14 * 60 * 1000);
        } else {
          throw new Error('No stored credentials found. Please login with email and password.');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshToken,
        resetPassword,
        biometricLogin,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
