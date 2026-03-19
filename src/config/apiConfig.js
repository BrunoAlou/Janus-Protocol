/**
 * API Configuration
 * Routes to correct backend URL based on environment
 */

export const API_BASE_URL = (() => {
  // In production (GitHub Pages), use Railway backend
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://janus-protocol-production.up.railway.app';
  }
  // In development, use relative path (proxied by Vite)
  return '';
})();

/**
 * Build full API URL
 * @param {string} endpoint - API endpoint (e.g., '/api/events')
 * @returns {string} Full URL to API endpoint
 */
export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

console.log('[API Config] Using API Base URL:', API_BASE_URL);
