import React, { createContext, useState, useCallback, useEffect } from 'react';
import api, { authAPI } from '../utils/api';
import { captureError, captureMessage } from '../utils/errorTracking';

// Create Context
export const AuthContext = createContext();

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
      try {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Check if user is authenticated by calling the profile endpoint
        const response = await api.get('/auth/profile');
        if (isMounted && response.data.success) {
          const user = response.data.user;
          setUser(user);
          isAuthenticatedSet(true);
          // Access token will be sent automatically via interceptor from cookie
        } else if (isMounted) {
          // If response is not successful, clear state
          setUser(null);
          isAuthenticatedSet(false);
        }
      } catch (err) {
        // Not authenticated or token expired - this is normal if user is not logged in
        // ✅ FIX: Don't treat 401 as an error - it's expected when user is not logged in
        const isExpected401 = err.response?.status === 401;
        
        if (isMounted) {
          setUser(null);
          isAuthenticatedSet(false);
          // Clear any leftover localStorage tokens
          localStorage.removeItem('token');
          localStorage.removeItem('jnAuthToken');
          localStorage.removeItem('jnUser');
          localStorage.removeItem('user');
          localStorage.removeItem('tempUser');
        }
        
        // Only log if it's not an expected 401 (user not logged in)
        if (!isExpected401 && err.response?.status !== 401) {
          console.error('Auth initialization error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
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
      setUser(user);
      isAuthenticatedSet(true);

      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.';
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
      setUser(user);
      isAuthenticatedSet(true);

      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
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
