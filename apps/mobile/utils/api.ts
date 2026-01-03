/**
 * API Client - Unified Export
 * 
 * This file provides backward compatibility by re-exporting the unified API client.
 * All API calls should use the apiClient instance for consistency.
 * 
 * @deprecated Import from '@/utils/api-client' directly for new code
 */

import { apiClient, ApiClientClass } from './api-client';

// Export the instance as ApiClient (class-like usage) for backward compatibility
export const ApiClient = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  request: apiClient.request.bind(apiClient),
  getAccessToken: apiClient.getAccessToken.bind(apiClient),
  refreshAccessToken: apiClient.refreshAccessToken.bind(apiClient),
};

// Export the class for static methods
export { ApiClientClass };

// Also export the instance directly
export { apiClient };

// Default export for convenience
export default apiClient;
