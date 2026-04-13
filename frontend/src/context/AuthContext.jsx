import React, { createContext, useState, useCallback, useEffect } from 'react';
import api, { authAPI, localizeApiMessage } from '../utils/api';
import { captureError, captureMessage } from '../utils/errorTracking';

// Create Context
export const AuthContext = createContext();

const SKIP_AUTH_INIT_ONCE_KEY = 'jn:skipAuthInitOnce';
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/customer', '/ceo', '/admin', '/employee', '/sessions'];

function hasLocalAuthHint() {
  const hasCookieHint = document.cookie.split('; ').some(row => row.startsWith('XSRF-TOKEN='));
  return Boolean(
    localStorage.getItem('jnUser') ||
    localStorage.getItem('user') ||
    localStorage.getItem('jnAuthToken') ||
    localStorage.getItem('token') ||
    hasCookieHint
  );
}

async function fetchUserProfile() {
  const response = await api.get('/auth/profile', {
    validateStatus: (status) => status === 200 || status === 401
  });
  return response;
}

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, isAuthenticatedSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Initialize auth - check if user is authenticated via API
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      const currentPath = window.location.pathname || '/';
      const isProtectedPath = PROTECTED_PATH_PREFIXES.some((prefix) => currentPath.startsWith(prefix));

      const shouldSkipInitOnce = sessionStorage.getItem(SKIP_AUTH_INIT_ONCE_KEY) === '1';
      if (shouldSkipInitOnce) {
        sessionStorage.removeItem(SKIP_AUTH_INIT_ONCE_KEY);
        if (!isProtectedPath) {
          if (isMounted) { setUser(null); isAuthenticatedSet(false); setIsLoading(false); }
          return;
        }
      }

      if (!isProtectedPath && !hasLocalAuthHint()) {
        if (isMounted) { setUser(null); isAuthenticatedSet(false); setIsLoading(false); }
        return;
      }

      try {
        const response = await fetchUserProfile();
        if (response.status === 401) {
          if (isMounted) { setUser(null); isAuthenticatedSet(false); }
          return;
        }
        if (isMounted && response.data.success) {
          setUser(response.data.user);
          isAuthenticatedSet(true);
        } else if (isMounted) {
          setUser(null);
          isAuthenticatedSet(false);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          isAuthenticatedSet(false);
          localStorage.removeItem('token');
          localStorage.removeItem('jnAuthToken');
          localStorage.removeItem('jnUser');
          localStorage.removeItem('user');
          localStorage.removeItem('tempUser');
        }
      } finally {
        if (isMounted) { setIsLoading(false); }
      }
    };

    initializeAuth();
    
    return () => { isMounted = false; };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      // ? SECURITY FIX: Tokens are now in HTTP-only cookies
      // Tokens are automatically sent by browser with withCredentials: true
      // No need to store in localStorage or set headers manually
      sessionStorage.removeItem(SKIP_AUTH_INIT_ONCE_KEY);
      setUser(user);
      isAuthenticatedSet(true);

      return { success: true, user };
    } catch (err) {
      const errorMessage = localizeApiMessage(
        err.response?.data?.message || err.message,
        'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.'
      );
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      // ? SECURITY FIX: Tokens are now in HTTP-only cookies
      // Tokens are automatically sent by browser with withCredentials: true
      // No need to store in localStorage or set headers manually
      sessionStorage.removeItem(SKIP_AUTH_INIT_ONCE_KEY);
      setUser(user);
      isAuthenticatedSet(true);

      return { success: true, user };
    } catch (err) {
      const errorMessage = localizeApiMessage(
        err.response?.data?.message || err.message,
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API FIRST to clear cookies on backend
      try {
        await authAPI.logout();
      } catch (err) {
        // Even if API call fails, we'll clear local state
        captureMessage('Logout API call failed', 'warning', { error: err.message });
      }

      // Then clear local state
      setUser(null);
      setToken(null);
      isAuthenticatedSet(false);
      setError(null);

      // ? SECURITY FIX: Tokens are in HTTP-only cookies, cleared by backend
      // Clear any leftover localStorage data
      localStorage.removeItem('jnAuthToken');
      localStorage.removeItem('jnUser');
      localStorage.removeItem('user');
      localStorage.removeItem('tempUser');

      // Skip exactly one initializeAuth profile call after redirect/reload
      sessionStorage.setItem(SKIP_AUTH_INIT_ONCE_KEY, '1');

      return { success: true };
    } catch (err) {
      captureError(err, { context: 'logout' });
      // Still clear state even on error
      setUser(null);
      setToken(null);
      isAuthenticatedSet(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Verify token function
  const verifyToken = useCallback(async () => {
    if (!token) {
      isAuthenticatedSet(false);
      return false;
    }

    try {
      const response = await authAPI.validateToken(token);

      if (response.data.valid) {
        return true;
      } else {
        logout();
        return false;
      }
    } catch (err) {
      captureError(err, { context: 'verifyToken' });
      logout();
      return false;
    }
  }, [token, logout]);

  // Update user function
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('jnUser', JSON.stringify(updatedUser));
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    login,
    register,
    logout,
    verifyToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
