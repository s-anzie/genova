import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';
import { router } from 'expo-router';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  skipTokenRefresh?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private isClearing = false; // Add flag to prevent multiple clear operations
  private isLoggingOut = false; // Add flag to block all API calls during logout

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data and redirect to login
   */
  private async clearAuthAndRedirect(): Promise<void> {
    // Prevent multiple simultaneous clear operations
    if (this.isClearing) {
      console.log('⚠️ Already clearing auth data, skipping...');
      return;
    }

    try {
      this.isClearing = true;
      this.isLoggingOut = true; // Block all future API calls
      console.log('🔒 Clearing authentication data and redirecting to login...');
      
      // Clear all auth-related data from SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(USER_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY).catch(() => {}),
      ]);
      
      console.log('✅ Authentication data cleared');
      
      // Redirect to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      // Still try to redirect even if clearing fails
      router.replace('/(auth)/login');
    } finally {
      // Reset the flag after a delay to allow the redirect to complete
      setTimeout(() => {
        this.isClearing = false;
      }, 1000);
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
          console.error('❌ No refresh token available - logging out user');
          await this.clearAuthAndRedirect();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          console.error('❌ Token refresh failed:', response.status);
          await this.clearAuthAndRedirect();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const result = await response.json();
        const newAccessToken = result.data.accessToken;
        
        await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
        console.log('✅ Token refreshed successfully');
        
        return newAccessToken;
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        await this.clearAuthAndRedirect();
        throw error;
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
    // Block all API calls if we're logging out
    if (this.isLoggingOut) {
      throw new Error('Déconnexion en cours...');
    }

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
        console.log('⚠️ Received 401, attempting token refresh...');
        try {
          const newToken = await this.refreshAccessToken();
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the request with new token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: requestHeaders,
          });

          // If still unauthorized after refresh, clear auth and redirect
          if (retryResponse.status === 401) {
            console.error('❌ Still unauthorized after token refresh');
            await this.clearAuthAndRedirect();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }

          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            try {
              const error = JSON.parse(errorText);
              throw new Error(error.error?.message || error.message || `Request failed: ${retryResponse.status}`);
            } catch (parseError) {
              throw new Error(`Request failed: ${retryResponse.status} ${retryResponse.statusText}`);
            }
          }

          return await retryResponse.json();
        } catch (refreshError) {
          // Token refresh failed, clear auth and redirect
          console.error('❌ Token refresh failed:', refreshError);
          await this.clearAuthAndRedirect();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
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
      // If it's a network error or other critical error, log it
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error('❌ Network error:', error);
      }
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

  async patch<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
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
