import logger from '../utils/logger.js';
import alertingService from '../services/alertingService.js';
/**
 * Error Handler Middleware Suite
 * Version: 1.0.0
 * Provides: Comprehensive error handling, logging, and response formatting
 */

// ==================== ERROR CLASS ====================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== ERROR LOGGER ====================

const logError = (err, req) => {
  const errorMeta = {
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    userId: req.user?._id?.toString() || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    salonId: req.user?.salonId?.toString()
  };

  // Use structured logger
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err);

  // Log security events for certain error types
  if (err.statusCode === 401 || err.statusCode === 403) {
    logger.security('Auth failure', {
      ...errorMeta,
      errorType: err.name
    });
  }
};

// ==================== ERROR HANDLERS ====================

const handleCastError = (err) => {
  const message = `Ungültiges Format für ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" wird bereits verwendet`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors)
    .map(e => e.message)
    .join(', ');
  const message = `Validierungsfehler: ${errors}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Token ungültig oder beschädigt', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('Token abgelaufen, bitte melden Sie sich erneut an', 401);
};

// ==================== CUSTOM ERROR MESSAGES ====================

const getErrorMessage = (errorCode) => {
  const messages = {
    'USER_NOT_FOUND': 'User nicht gefunden',
    'BOOKING_NOT_FOUND': 'Buchung nicht gefunden',
    'SERVICE_NOT_FOUND': 'Service nicht gefunden',
    'CUSTOMER_NOT_FOUND': 'Kunde nicht gefunden',
    'EMPLOYEE_NOT_FOUND': 'Mitarbeiter nicht gefunden',
    'INVALID_PASSWORD': 'Passwort ist falsch',
    'EMAIL_ALREADY_EXISTS': 'Email wird bereits verwendet',
    'INVALID_TOKEN': 'Token ungültig',
    'TOKEN_EXPIRED': 'Token abgelaufen',
    'PERMISSION_DENIED': 'Keine Berechtigung',
    'INVALID_INPUT': 'Ungültige Eingabe',
    'SERVER_ERROR': 'Ein Fehler ist aufgetreten'
  };

  return messages[errorCode] || 'Ein unbekannter Fehler ist aufgetreten';
};

// ==================== ERROR RESPONSE FORMATTER ====================

const formatErrorResponse = (error, statusCode = 500) => {
  return {
    success: false,
    statusCode,
    message: error.message || 'Ein Fehler ist aufgetreten',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  };
};

// ==================== SEND ERROR RESPONSE ====================

const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    message,
    ...(details && { details })
  };

  res.status(statusCode).json(response);
};

// ==================== DATABASE ERROR HANDLER ====================

const handleDatabaseError = (error, req, res, next) => {
  if (error.name === 'MongoError' || error.name === 'MongoNetworkError') {
    return res.status(503).json({
      success: false,
      message: 'Datenbankverbindung fehlgeschlagen. Bitte später versuchen.'
    });
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Datenbank nicht erreichbar'
    });
  }

  next(error);
};

// ==================== FILE UPLOAD ERROR HANDLER ====================

const handleFileUploadError = (error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Datei zu groß (max. 5MB)'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      message: 'Zu viele Dateien'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unerwartete Dateien'
    });
  }

  next(error);
};

// ==================== RATE LIMIT ERROR HANDLER ====================

const handleRateLimitError = (error, req, res, next) => {
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen, bitte später versuchen',
      retryAfter: error.retryAfter || 60
    });
  }

  next(error);
};

// ==================== AUTHENTICATION ERROR HANDLER ====================

const handleAuthError = (error, req, res, next) => {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token ungültig'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token abgelaufen'
    });
  }

  if (error.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: 'Nicht authentifiziert'
    });
  }

  next(error);
};

// ==================== AUTHORIZATION ERROR HANDLER ====================

const handleAuthorizationError = (error, req, res, next) => {
  if (error.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: 'Sie haben keine Berechtigung für diese Aktion'
    });
  }

  next(error);
};

// ==================== VALIDATION ERROR MIDDLEWARE ====================

const validationErrorHandler = (req, res, next) => {
  const errors = {};

  if (req.body) {
    if (!req.body.email && req.path.includes('auth')) {
      errors.email = 'Email ist erforderlich';
    }
    if (!req.body.password && req.path.includes('auth')) {
      errors.password = 'Passwort ist erforderlich';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validierungsfehler',
      errors
    });
  }

  next();
};

// ==================== ASYNC ERROR WRAPPER ====================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error('❌ Async Error:', err);
    next(err);
  });
};

// ==================== GLOBAL ERROR HANDLER ====================

const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Interner Serverfehler';

  logError(err, req);

  // Track errors for alerting
  if (err.statusCode >= 500) {
    alertingService.record5xxError(err, req);
    alertingService.recordConsecutiveError(err);
  }

  if (err.name === 'CastError') {
    err = handleCastError(err);
  }

  if (err.code === 11000) {
    err = handleDuplicateKeyError(err);
  }

  if (err.name === 'ValidationError') {
    err = handleValidationError(err);
  }

  if (err.name === 'JsonWebTokenError') {
    err = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    err = handleTokenExpiredError();
  }

  res.status(err.statusCode).json(formatErrorResponse(err, err.statusCode));
};

// ==================== NOT FOUND HANDLER ====================

const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} nicht gefunden`;
  const error = new AppError(message, 404);
  next(error);
};

// ==================== CATCH ALL HANDLER ====================

const catchAll = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route nicht gefunden',
    path: req.path,
    method: req.method
  });
};

// ==================== ERROR MIDDLEWARE CHAIN ====================

const errorMiddlewareChain = [
  validationErrorHandler,
  handleDatabaseError,
  handleFileUploadError,
  handleRateLimitError,
  handleAuthError,
  handleAuthorizationError,
  globalErrorHandler,
  catchAll
];

// ==================== EXPORT ====================

export default {
  AppError,
  logError,
  handleCastError,
  handleDuplicateKeyError,
  handleValidationError,
  handleJWTError,
  handleTokenExpiredError,
  getErrorMessage,
  formatErrorResponse,
  sendErrorResponse,
  handleDatabaseError,
  handleFileUploadError,
  handleRateLimitError,
  handleAuthError,
  handleAuthorizationError,
  validationErrorHandler,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  catchAll,
  errorMiddlewareChain
};
