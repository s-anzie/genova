import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  skipTokenRefresh?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<string> {
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

  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      requiresAuth = true,
      skipTokenRefresh = false,
      headers = {},
      ...fetchOptions
    } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (requiresAuth) {
      const token = await this.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Construct full URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
      });

      // If unauthorized and we haven't tried refreshing yet, try to refresh token
      if (response.status === 401 && requiresAuth && !skipTokenRefresh) {
        try {
          const newToken = await this.refreshAccessToken();
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the request with new token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: requestHeaders,
          });

          if (!retryResponse.ok) {
            throw new Error(`Request failed: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          // Token refresh failed, user needs to login again
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error?.message || error.message || `Request failed: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
// Export as both lowercase and uppercase for backward compatibility
export { apiClient as ApiClient };
