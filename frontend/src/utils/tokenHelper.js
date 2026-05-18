/**
 * Token Helper Utility
 *
 * Tokens are stored in HTTP-only cookies and are not readable via JavaScript.
 */

/**
 * Access token is intentionally unavailable in cookie-only mode.
 * @returns {null}
 */
export const getAccessToken = () => {
  return null;
};

/**
 * No-op in cookie-only mode.
 */
export const clearTokens = () => {
  // Cookies are managed server-side and by the browser.
};

/**
 * Heuristic auth hint for compatibility.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return document.cookie.split('; ').some((row) => row.startsWith('XSRF-TOKEN='));
};

