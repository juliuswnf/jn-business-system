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
    const initializeAuth = async () => {
      try {
        // ? SECURITY FIX: Tokens are now in HTTP-only cookies
        // Check if user is authenticated by calling the profile endpoint
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          const user = response.data.user;
          setUser(user);
          isAuthenticatedSet(true);
          // Access token will be sent automatically via interceptor from cookie
        }
      } catch (err) {
        // Not authenticated or token expired
        setUser(null);
        isAuthenticatedSet(false);
        // Clear any leftover localStorage tokens
        localStorage.removeItem('token');
        localStorage.removeItem('jnAuthToken');
        localStorage.removeItem('jnUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
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
      const errorMessage = err.response?.data?.message || 'Login failed';
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
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API
      try {
        await authAPI.logout();
      } catch (err) {
        captureMessage('Logout API call failed', 'warning', { error: err.message });
      }

      // Clear state
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
