/* eslint-disable no-console */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment check
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
});

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    structuredFormat
  ),
  defaultMeta: { service: 'jn-automation-api' },
  transports: [
    // Console output (always)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).filter(k => k !== 'service').length
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Add file transport in production
if (isProduction) {
  const logsDir = path.join(__dirname, '..', 'logs');

  winstonLogger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  winstonLogger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  }));
}

// Sentry integration (optional - requires SENTRY_DSN env var)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  import('@sentry/node').then((SentryModule) => {
    Sentry = SentryModule;
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      integrations: [],
    });
    winstonLogger.info('Sentry initialized for error tracking');
  }).catch(() => {
    winstonLogger.warn('Sentry SDK not installed - error tracking disabled');
  });
}

// Enhanced logger with context support
const logger = {
  info: (message, meta = {}) => winstonLogger.info(message, meta),
  log: (message, meta = {}) => winstonLogger.info(message, meta),
  warn: (message, meta = {}) => winstonLogger.warn(message, meta),
  debug: (message, meta = {}) => winstonLogger.debug(message, meta),

  error: (message, errorOrMeta = {}) => {
    // Handle Error objects
    if (errorOrMeta instanceof Error) {
      const errorMeta = {
        errorName: errorOrMeta.name,
        errorMessage: errorOrMeta.message,
        stack: errorOrMeta.stack
      };
      winstonLogger.error(message, errorMeta);

      // Send to Sentry if available
      if (Sentry) {
        Sentry.captureException(errorOrMeta, {
          extra: { context: message }
        });
      }
    } else {
      winstonLogger.error(message, errorOrMeta);

      // Send to Sentry if available
      if (Sentry && typeof message === 'string') {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: errorOrMeta
        });
      }
    }
  },

  // Request logging helper
  request: (req, message, meta = {}) => {
    winstonLogger.info(message, {
      ...meta,
      method: req.method,
      path: req.path,
      userId: req.user?._id?.toString(),
      ip: req.ip
    });
  },

  // Security event logging
  security: (event, details = {}) => {
    winstonLogger.warn(`[SECURITY] ${event}`, {
      ...details,
      timestamp: new Date().toISOString()
    });

    // Always send security events to Sentry
    if (Sentry) {
      Sentry.captureMessage(`Security Event: ${event}`, {
        level: 'warning',
        extra: details
      });
    }
  },

  // Performance logging
  performance: (operation, durationMs, meta = {}) => {
    const level = durationMs > 1000 ? 'warn' : 'debug';
    winstonLogger.log(level, `[PERF] ${operation}: ${durationMs}ms`, meta);
  },

  // Audit logging for important actions
  audit: (action, userId, details = {}) => {
    winstonLogger.info(`[AUDIT] ${action}`, {
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
