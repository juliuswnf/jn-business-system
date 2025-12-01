import React, { createContext, useState, useCallback, useEffect } from 'react';
import api, { authAPI } from '../utils/api';

// Create Context
export const AuthContext = createContext();

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, isAuthenticatedSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('jnAuthToken');
        const storedUser = localStorage.getItem('jnUser');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          isAuthenticatedSet(true);
          
          // Set default api header
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
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

      // Store in state
      setToken(token);
      setUser(user);
      isAuthenticatedSet(true);

      // Store in localStorage
      localStorage.setItem('jnAuthToken', token);
      localStorage.setItem('jnUser', JSON.stringify(user));

      // Set api default header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // For backward compatibility keep older keys
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user, token };
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

      // Store in state
      setToken(token);
      setUser(user);
      isAuthenticatedSet(true);

      // Store in localStorage
      localStorage.setItem('jnAuthToken', token);
      localStorage.setItem('jnUser', JSON.stringify(user));

      // Set api default header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Backwards compatibility
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user, token };
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
        console.warn('Logout API call failed:', err);
      }

      // Clear state
      setUser(null);
      setToken(null);
      isAuthenticatedSet(false);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('jnAuthToken');
      localStorage.removeItem('jnUser');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tempUser');

      // Remove api header
      delete api.defaults.headers.common['Authorization'];

      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
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
      console.error('Token verification error:', err);
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
