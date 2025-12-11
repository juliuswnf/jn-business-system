import winston from 'winston';

/**
 * ✅ AUDIT FIX: Structured JSON logger with Winston
 * Replaces console.log with proper logging for production monitoring
 */

const { combine, timestamp, json, errors, printf } = winston.format;

// Custom format for development (colorized, readable)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
});

// Production format (JSON for log aggregation)
const prodFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

// Create logger instance
const structuredLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: 'jn-automation-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : combine(
        winston.format.colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        devFormat
      )
    }),
    // File output for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // File output for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

/**
 * Redact sensitive data from logs (GDPR compliance)
 * @param {any} data - Data to redact
 * @returns {any} Redacted data
 */
const redactSensitiveData = (data) => {
  if (!data) return data;
  
  const sensitive = ['email', 'password', 'token', 'secret', 'apiKey', 'customerEmail', 'phone', 'customerPhone'];
  
  if (typeof data === 'object') {
    const redacted = { ...data };
    for (const key of Object.keys(redacted)) {
      if (sensitive.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactSensitiveData(redacted[key]);
      }
    }
    return redacted;
  }
  
  return data;
};

/**
 * Add request context to logs (requestId, userId, salonId)
 */
export const addRequestContext = (req, res, next) => {
  // Generate unique request ID
  req.id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add to response headers for tracing
  res.setHeader('X-Request-ID', req.id);
  
  // Store in request for logging
  req.logContext = {
    requestId: req.id,
    userId: req.user?.id || req.user?._id || null,
    salonId: req.user?.salonId || null,
    role: req.user?.role || null,
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path
  };
  
  next();
};

/**
 * Structured logger with GDPR-compliant redaction
 */
export default {
  info: (message, meta = {}) => {
    structuredLogger.info(message, redactSensitiveData(meta));
  },
  
  warn: (message, meta = {}) => {
    structuredLogger.warn(message, redactSensitiveData(meta));
  },
  
  error: (message, meta = {}) => {
    structuredLogger.error(message, redactSensitiveData(meta));
  },
  
  debug: (message, meta = {}) => {
    structuredLogger.debug(message, redactSensitiveData(meta));
  },
  
  // Log with request context
  logRequest: (req, message, meta = {}) => {
    structuredLogger.info(message, {
      ...req.logContext,
      ...redactSensitiveData(meta)
    });
  },
  
  // Log errors with request context
  logError: (req, message, error, meta = {}) => {
    structuredLogger.error(message, {
      ...req.logContext,
      error: error?.message || error,
      stack: error?.stack,
      ...redactSensitiveData(meta)
    });
  },
  
  // Backward compatibility (fallback to console for old logger)
  log: (message) => {
    structuredLogger.info(message);
  }
};
