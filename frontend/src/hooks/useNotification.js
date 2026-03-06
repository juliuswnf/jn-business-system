import { useCallback, useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

/**
 * Hook to use Notification Context
 * Must be used inside NotificationProvider
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used inside a NotificationProvider');
  }

  const {
    notifications,
    success,
    error,
    warning,
    info,
    addNotification,
    removeNotification,
    clearAllNotifications,
  } = context;

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    return addNotification(message, type, duration);
  }, [addNotification]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    showNotification,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
};

export default useNotification;
