import logger from '../utils/logger.js';

// ==================== ERROR TYPES ====================

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validierungsfehler', details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentifizierung erforderlich') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Zugriff verweigert') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ressource nicht gefunden') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Konflikt bei der Anfrage') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Zu viele Anfragen. Bitte versuchen Sie es später') {
    super(message, 429, 'RATE_LIMIT');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Datenbankfehler', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'Fehler beim externen Service', service = 'unknown') {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

class PaymentError extends AppError {
  constructor(message = 'Zahlungsfehler', transactionId = null) {
    super(message, 402, 'PAYMENT_ERROR');
    this.transactionId = transactionId;
  }
}

// ==================== ERROR HANDLER SERVICE ====================

class ErrorHandlerService {
  static async logError(error, req = null, severity = 'high') {
    try {
      const errorData = {
        errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500,
        errorCode: error.errorCode || 'UNKNOWN_ERROR',
        severity,
        environment: process.env.NODE_ENV || 'production'
      };

      if (req) {
        errorData.requestContext = {
          method: req.method,
          url: req.originalUrl,
          path: req.path,
          userId: req.user?._id || null,
          userEmail: req.user?.email || 'anonymous',
          userRole: req.user?.role || 'anonymous',
          ipAddress: req.ip
        };
      }

      // MVP: Console logging instead of DB
      logger.error('📝 Error logged:', errorData);

      return errorData;
    } catch (err) {
      logger.error('❌ Failed to log error:', err);
      return null;
    }
  }

  static sanitizeBody(body) {
    if (!body) {return {};}

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'token',
      'refreshToken',
      'apiKey',
      'creditCard',
      'cvv',
      'ssn',
      'secret'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  static formatErrorResponse(error, isDevelopment = false) {
    const response = {
      success: false,
      error: {
        message: error.message,
        code: error.errorCode || 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500
      }
    };

    if (isDevelopment) {
      response.error.stack = error.stack;
      response.error.details = error.details || null;
    }

    return response;
  }

  static getStatusCode(error) {
    if (error.statusCode) {return error.statusCode;}

    if (error.name === 'ValidationError') {return 400;}
    if (error.name === 'CastError') {return 400;}
    if (error.name === 'JsonWebTokenError') {return 401;}
    if (error.name === 'TokenExpiredError') {return 401;}

    return 500;
  }

  static handleMongooseError(error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return new ValidationError('Validierungsfehler', { details: messages });
    }

    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return new ConflictError(`${field} existiert bereits`);
    }

    if (error.name === 'CastError') {
      return new ValidationError(`Ungültiges ${error.kind}: ${error.value}`);
    }

    return new DatabaseError('Datenbankfehler', error);
  }

  static handleJWTError(error) {
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Ungültiger Token');
    }

    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token ist abgelaufen');
    }

    return new AuthenticationError('Authentifizierungsfehler');
  }

  static handleStripeError(error) {
    if (error.type === 'StripeCardError') {
      return new PaymentError(`Kartenfehler: ${error.message}`);
    }

    if (error.type === 'StripeRateLimitError') {
      return new RateLimitError('Zu viele Anfragen an Zahlungsprovider');
    }

    if (error.type === 'StripeAuthenticationError') {
      return new PaymentError('Zahlungsprovider Authentifizierungsfehler');
    }

    return new PaymentError(`Zahlungsfehler: ${error.message}`);
  }
}

// ==================== GLOBAL ERROR HANDLER MIDDLEWARE ====================

const globalErrorHandler = (err, req, res, _next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  let error = err;

  if (err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'MongoServerError') {
    error = ErrorHandlerService.handleMongooseError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = ErrorHandlerService.handleJWTError(err);
  } else if (err.type && err.type.startsWith('Stripe')) {
    error = ErrorHandlerService.handleStripeError(err);
  } else if (!(err instanceof AppError)) {
    error = new AppError(err.message || 'Unbekannter Fehler', 500, 'INTERNAL_ERROR');
  }

  const statusCode = ErrorHandlerService.getStatusCode(error);
  const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low';

  // Log error (console only for MVP)
  ErrorHandlerService.logError(error, req, severity);

  res.status(statusCode).json(
    ErrorHandlerService.formatErrorResponse(error, isDevelopment)
  );
};

// ==================== EXPORT ====================

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  PaymentError,
  ErrorHandlerService,
  globalErrorHandler
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  PaymentError,
  ErrorHandlerService,
  globalErrorHandler
};
