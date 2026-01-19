import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function PrivateRoute({ children, requiredRole }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // ✅ FIX: Tokens are in HTTP-only cookies, so always try API call
      // Browser sends cookies automatically with withCredentials: true
      try {
        // Verify authentication by getting user profile
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // 401 is expected if user is not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
