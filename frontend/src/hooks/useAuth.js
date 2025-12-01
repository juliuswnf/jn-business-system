import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook to use Auth Context
 * Must be used inside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  const {
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
  } = context;

  return {
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
};

export default useAuth;
