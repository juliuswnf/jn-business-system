import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from '../utils/logger.js';

/**
 * Sentry Configuration
 * Error tracking and performance monitoring
 */

export const initSentry = (app) => {
  // Enable Sentry in production OR if explicitly enabled in development
  const sentryEnabled = (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') && process.env.SENTRY_DSN;

  if (sentryEnabled) {
    try {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',

        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 100% in dev, 10% in prod

        // Profiling
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 100% in dev, 10% in prod

        // Session Tracking
        autoSessionTracking: true,

        // Integrations
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app }),
          new Sentry.Integrations.Mongo({
            useMongoose: true
          }),
          nodeProfilingIntegration()
        ],

        // Don't send sensitive data
        beforeSend(event, _hint) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }

          // Remove sensitive body data
          if (event.request?.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
            sensitiveFields.forEach(field => {
              if (event.request.data[field]) {
                event.request.data[field] = '[REDACTED]';
              }
            });
          }

          return event;
        }
      });

      logger.info('✅ Sentry initialized');

      // Request handler must be first middleware
      app.use(Sentry.Handlers.requestHandler());

      // Tracing handler
      app.use(Sentry.Handlers.tracingHandler());

      return true;
    } catch (error) {
      logger.error('❌ Sentry initialization failed:', error);
      return false;
    }
  } else {
    logger.info('ℹ️ Sentry disabled (dev mode or no DSN)');
    return false;
  }
};

// Error handler middleware (must be AFTER all routes)
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only send 5xx errors to Sentry
      return error.status >= 500;
    }
  });
};

// Manual error reporting
export const captureException = (error, context = {}) => {
  const sentryEnabled = (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') && process.env.SENTRY_DSN;
  if (sentryEnabled) {
    Sentry.captureException(error, {
      extra: context
    });
  }
  logger.error('Exception captured:', error, context);
};

// Manual message reporting
export const captureMessage = (message, level = 'info', context = {}) => {
  const sentryEnabled = (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') && process.env.SENTRY_DSN;
  if (sentryEnabled) {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }
  logger.info(`Sentry message [${level}]:`, message, context);
};

export default { initSentry, sentryErrorHandler, captureException, captureMessage };
