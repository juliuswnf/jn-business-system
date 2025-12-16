/**
 * Error Tracking Service for Frontend
 * Provides error boundary support and optional Sentry integration
 */

// Error levels
export const ErrorLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal'
};

// Store for error logs (in-memory, cleared on refresh)
const errorStore = {
  errors: [],
  maxErrors: 100
};

// Sentry instance (lazy loaded)
let Sentry = null;
let sentryInitialized = false;

/**
 * Initialize Sentry if DSN is provided
 */
export const initErrorTracking = async () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (sentryDsn && !sentryInitialized) {
    try {
      const SentryModule = await import('@sentry/react');
      Sentry = SentryModule;

      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE || 'development',
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration()
        ],
        // Don't send errors in development unless explicitly enabled
        enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',
        beforeSend(event) {
          // Filter out known non-critical errors
          if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
            return null;
          }
          return event;
        }
      });

      sentryInitialized = true;
      // Error tracking initialized
    } catch (error) {
      console.warn('[ErrorTracking] Sentry not available:', error.message);
    }
  }
};

/**
 * Capture an error
 */
export const captureError = (error, context = {}) => {
  const errorInfo = {
    message: error.message || String(error),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    level: context.level || ErrorLevel.ERROR
  };

  // Store locally
  errorStore.errors.unshift(errorInfo);
  if (errorStore.errors.length > errorStore.maxErrors) {
    errorStore.errors.pop();
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorTracking]', error, context);
  }

  // Send to Sentry if available
  if (Sentry && sentryInitialized) {
    Sentry.captureException(error, {
      extra: context,
      level: context.level || 'error'
    });
  }

  return errorInfo;
};

/**
 * Capture a message (non-exception)
 */
export const captureMessage = (message, level = ErrorLevel.INFO, context = {}) => {
  const info = {
    message,
    timestamp: new Date().toISOString(),
    level,
    context
  };

  if (level === ErrorLevel.ERROR || level === ErrorLevel.FATAL) {
    errorStore.errors.unshift(info);
    if (errorStore.errors.length > errorStore.maxErrors) {
      errorStore.errors.pop();
    }
  }

  if (import.meta.env.DEV) {
    // Error logged
  }

  if (Sentry && sentryInitialized) {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }

  return info;
};

/**
 * Set user context for error tracking
 */
export const setUser = (user) => {
  if (Sentry && sentryInitialized && user) {
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      username: user.name
    });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (Sentry && sentryInitialized) {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message, category = 'app', data = {}) => {
  if (Sentry && sentryInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info'
    });
  }
};

/**
 * Get recent errors (for debugging UI)
 */
export const getRecentErrors = (count = 10) => {
  return errorStore.errors.slice(0, count);
};

/**
 * Clear stored errors
 */
export const clearErrors = () => {
  errorStore.errors = [];
};

/**
 * Track API errors specifically
 */
export const trackApiError = (error, endpoint, method = 'GET') => {
  const context = {
    endpoint,
    method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    category: 'api'
  };

  // Don't track 401 errors as they're expected during auth flow
  if (error.response?.status === 401) {
    return;
  }

  captureError(error, context);
};

/**
 * Performance tracking
 */
export const trackPerformance = (operation, duration, context = {}) => {
  if (duration > 3000) {
    captureMessage(`Slow operation: ${operation} took ${duration}ms`, ErrorLevel.WARNING, {
      operation,
      duration,
      ...context
    });
  }
};

// Initialize on module load
initErrorTracking();

export default {
  initErrorTracking,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  getRecentErrors,
  clearErrors,
  trackApiError,
  trackPerformance,
  ErrorLevel
};
