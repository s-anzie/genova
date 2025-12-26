import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';
import { router } from 'expo-router';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export class ApiClient {
  private static isRefreshing = false;
  private static refreshPromise: Promise<string> | null = null;

  private static async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  private static async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const result = await response.json();
        const newAccessToken = result.data.accessToken;
        
        await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
        
        return newAccessToken;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private static async clearAuthAndRedirect(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync('user_data');
      
      // Redirect to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipTokenRefresh = false
  ): Promise<T> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized and we haven't tried refreshing yet, try to refresh token
      if (response.status === 401 && !skipTokenRefresh) {
        try {
          const newToken = await this.refreshAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the request with new token
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });

          if (retryResponse.status === 401) {
            // Still unauthorized after refresh, clear auth and redirect
            await this.clearAuthAndRedirect();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }

          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${retryResponse.status}`);
          }

          return retryResponse.json();
        } catch (refreshError) {
          // Token refresh failed, clear auth and redirect
          await this.clearAuthAndRedirect();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
