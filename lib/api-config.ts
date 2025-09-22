/**
 * API Configuration utility
 * Handles API base URLs for different environments
 */

/**
 * Get the API base URL for internal Next.js API routes
 * Uses NEXT_PUBLIC_API_URL if available, otherwise falls back to current origin
 */
export function getApiBaseUrl(): string {
  // For client-side rendering, use the public API URL if specified
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }
  
  // For server-side rendering, use the public API URL or localhost fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * Get the backend service URL (Flask server)
 * Uses NEXT_PUBLIC_BACKEND_URL if available, otherwise falls back to localhost:5000
 */
export function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn('NEXT_PUBLIC_BACKEND_URL is not set. Using localhost fallback. This will fail in production!');
    // In production, this should never happen - log an error for debugging
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error('Backend URL not configured for production deployment!');
    }
  }
  
  return backendUrl || 'https://zeni-agent-backend-service-7swwhfygga-el.a.run.app';
}

/**
 * Create a full API URL for internal Next.js API routes
 * @param endpoint - The API endpoint (e.g., '/api/knowledge-graph')
 * @returns Full URL for the API endpoint
 */
export function createApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Create a full URL for backend service endpoints
 * @param endpoint - The backend endpoint (e.g., '/api/debate')
 * @returns Full URL for the backend endpoint
 */
export function createBackendUrl(endpoint: string): string {
  const baseUrl = getBackendUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Environment configuration
 */
export const apiConfig = {
  // Internal Next.js API base URL
  apiBaseUrl: getApiBaseUrl(),
  // External backend service URL
  backendUrl: getBackendUrl(),
  // Helper methods
  createApiUrl,
  createBackendUrl,
};