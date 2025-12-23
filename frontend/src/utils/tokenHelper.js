/**
 * Token Helper Utility
 * 
 * ? SECURITY FIX: Tokens are now primarily stored in HTTP-only cookies.
 * This helper provides a fallback to get the access token from localStorage
 * (temporarily stored for API requests, 15 minutes lifetime).
 * 
 * In the future, this can be removed once we fully migrate to cookie-based auth.
 */

/**
 * Get access token from localStorage (temporary, short-lived)
 * @returns {string|null} Access token or null
 */
export const getAccessToken = () => {
  // ? SECURITY FIX: Access token is temporarily stored in localStorage
  // This is a short-lived token (15 minutes) used for API requests
  // Refresh token is in HTTP-only cookie and cannot be accessed via JavaScript
  return localStorage.getItem('token') || localStorage.getItem('jnAuthToken');
};

/**
 * Clear all tokens from localStorage
 * Note: HTTP-only cookies are cleared by the backend on logout
 */
export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('jnAuthToken');
  localStorage.removeItem('jnUser');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated (has token)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

