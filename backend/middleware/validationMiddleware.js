import Joi from 'joi';
import validator from 'validator';
import logger from '../utils/logger.js';

/**
 * Validation Middleware Suite
 * Version: 1.0.0
 * Provides: Joi schema validation, field-specific validation, sanitization
 */

// ==================== CUSTOM JOI MESSAGES ====================

const joiMessages = {
  'string.email': 'ungültige E-Mail-Adresse',
  'string.min': 'muss mindestens {#limit} Zeichen lang sein',
  'string.max': 'darf maximal {#limit} Zeichen lang sein',
  'number.positive': 'muss positiv sein',
  'number.min': 'muss mindestens {#limit} sein',
  'any.required': 'ist erforderlich'
};

// ==================== VALIDATE REQUEST BODY ====================

export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }

      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
        messages: joiMessages
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        logger.warn(`❌ Body Validation Error: ${JSON.stringify(errors)}`);

        return res.status(400).json({
          success: false,
          message: 'Validierungsfehler',
          errors,
          timestamp: new Date().toISOString()
        });
      }

      req.validatedData = value;
      req.body = value;
      next();
    } catch (err) {
      logger.error('❌ Body Validation Exception:', err.message);
      next(err);
    }
  };
};

// ==================== VALIDATE REQUEST PARAMS ====================

export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }

      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        messages: joiMessages
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn(`❌ Params Validation Error:  ${JSON.stringify(errors)}`);

        return res.status(400).json({
          success: false,
          message: 'Parameter Validierungsfehler',
          errors,
          timestamp: new Date().toISOString()
        });
      }

      req.validatedParams = value;
      req.params = value;
      next();
    } catch (err) {
      logger.error('❌ Params Validation Exception:', err.message);
      next(err);
    }
  };
};

// ==================== VALIDATE REQUEST QUERY ====================

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }

      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        messages: joiMessages
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Query Validierungsfehler',
          errors,
          timestamp: new Date().toISOString()
        });
      }

      req.validatedQuery = value;
      req.query = value;
      next();
    } catch (err) {
      logger.error('❌ Query Validation Exception:', err.message);
      next(err);
    }
  };
};

// ==================== VALIDATE ALL ====================

export const validateAll = (bodySchema, paramsSchema, querySchema) => {
  return [
    validateBody(bodySchema),
    validateParams(paramsSchema),
    validateQuery(querySchema)
  ].filter(Boolean);
};

// ==================== SANITIZE INPUT ====================

const sanitizeValue = (value) => {
  if (typeof value !== 'string') {return value;}

  // Trim whitespace
  let sanitized = value.trim();

  // Remove HTML/script tags
  sanitized = validator.stripLow(sanitized);
  sanitized = validator.escape(sanitized);

  return sanitized;
};

export const sanitizeInput = (req, res, next) => {
  try {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') {return;}

      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeValue(obj[key]);
        } else if (Array.isArray(obj[key])) {
          obj[key].forEach((item, index) => {
            if (typeof item === 'string') {
              obj[key][index] = sanitizeValue(item);
            }
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      });
    };

    if (req.body) {sanitize(req.body);}
    if (req.query) {sanitize(req.query);}
    if (req.params) {sanitize(req.params);}

    next();
  } catch (error) {
    logger.error('❌ Sanitize Input Error:', error.message);
    next(error);
  }
};

// ==================== SANITIZE SPECIFIC FIELD ====================

export const sanitizeField = (field, type = 'string') => {
  return (req, res, next) => {
    try {
      const value = req.body?.[field];

      if (value) {
        if (type === 'string') {
          req.body[field] = sanitizeValue(String(value));
        } else if (type === 'number') {
          req.body[field] = Number(value);
        } else if (type === 'email') {
          req.body[field] = validator.normalizeEmail(String(value));
        } else if (type === 'url') {
          req.body[field] = validator.trim(String(value));
        }
      }

      next();
    } catch (error) {
      logger.error(`❌ Sanitize Field "${field}" Error:`, error.message);
      next(error);
    }
  };
};

// ==================== EMAIL VALIDATION ====================

export const validateEmail = (req, res, next) => {
  try {
    const { email } = req.body || req.query || req.params;

    if (email && !validator.isEmail(email)) {
      logger.warn(`⚠️ Invalid email format: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Ungültige Email-Adresse',
        field: 'email',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    logger.error('❌ Email Validation Error:', error.message);
    next(error);
  }
};

// ==================== PASSWORD VALIDATION ====================

export const validatePassword = (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Passwort ist erforderlich',
        field: 'password'
      });
    }

    // Min 8 chars, min 1 uppercase, min 1 lowercase, min 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Passwort muss mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe und 1 Zahl enthalten',
        field: 'password',
        requirements: {
          minLength: 8,
          uppercase: true,
          lowercase: true,
          number: true
        }
      });
    }

    next();
  } catch (error) {
    logger.error('❌ Password Validation Error:', error.message);
    next(error);
  }
};

// ==================== PHONE VALIDATION ====================

export const validatePhone = (req, res, next) => {
  try {
    const { phone } = req.body || req.query;

    if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      logger.warn(`⚠️ Invalid phone format: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Ungültige Telefonnummer',
        field: 'phone',
        format: '+1-234-567-8900'
      });
    }

    next();
  } catch (error) {
    logger.error('❌ Phone Validation Error:', error.message);
    next(error);
  }
};

// ==================== URL VALIDATION ====================

export const validateURL = (req, res, next) => {
  try {
    const { url, website } = req.body;
    const urlField = url || website;

    if (urlField && !validator.isURL(urlField, { require_protocol: false })) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige URL',
        format: 'https://example.com'
      });
    }

    next();
  } catch (error) {
    logger.error('❌ URL Validation Error:', error.message);
    next(error);
  }
};

// ==================== DATE VALIDATION ====================

export const validateDate = (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.body;
    const dates = [{ name: 'date', value: date }, { name: 'startDate', value: startDate }, { name: 'endDate', value: endDate }];

    for (const d of dates) {
      if (d.value && !validator.isISO8601(String(d.value))) {
        return res.status(400).json({
          success: false,
          message: 'Ungültiges Datum',
          field: d.name,
          format: 'YYYY-MM-DD'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('❌ Date Validation Error:', error.message);
    next(error);
  }
};

// ==================== NUMERIC VALIDATION ====================

export const validateNumeric = (fields = []) => {
  return (req, res, next) => {
    try {
      const fieldsToCheck = Array.isArray(fields) ? fields : [fields];

      for (const field of fieldsToCheck) {
        const value = req.body?.[field] || req.query?.[field];

        if (value !== undefined && value !== null && !validator.isNumeric(String(value))) {
          return res.status(400).json({
            success: false,
            message: `${field} muss eine Zahl sein`,
            field,
            receivedType: typeof value
          });
        }
      }

      next();
    } catch (error) {
      logger.error('❌ Numeric Validation Error:', error.message);
      next(error);
    }
  };
};

// ==================== ARRAY VALIDATION ====================

export const validateArray = (fields = []) => {
  return (req, res, next) => {
    try {
      const fieldsToCheck = Array.isArray(fields) ? fields : [fields];

      for (const field of fieldsToCheck) {
        const value = req.body?.[field];

        if (value !== undefined && !Array.isArray(value)) {
          return res.status(400).json({
            success: false,
            message: `${field} muss ein Array sein`,
            field,
            receivedType: typeof value
          });
        }
      }

      next();
    } catch (error) {
      logger.error('❌ Array Validation Error:', error.message);
      next(error);
    }
  };
};

// ==================== REQUIRED FIELDS VALIDATION ====================

export const validateRequiredFields = (fields = []) => {
  return (req, res, next) => {
    try {
      const missingFields = fields.filter(
        field => !req.body?.[field] && req.body?.[field] !== 0 && req.body?.[field] !== false
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Erforderliche Felder fehlen',
          missingFields,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('❌ Required Fields Validation Error:', error.message);
      next(error);
    }
  };
};

// ==================== STRING LENGTH VALIDATION ====================

export const validateStringLength = (field, minLength, maxLength) => {
  return (req, res, next) => {
    try {
      const value = req.body?.[field];

      if (value && typeof value === 'string') {
        if (!validator.isLength(value, { min: minLength, max: maxLength })) {
          return res.status(400).json({
            success: false,
            message: `${field} muss zwischen ${minLength} und ${maxLength} Zeichen lang sein`,
            field,
            minLength,
            maxLength,
            currentLength: value.length
          });
        }
      }

      next();
    } catch (error) {
      logger.error('❌ String Length Validation Error:', error.message);
      next(error);
    }
  };
};

// ==================== ENUM VALIDATION ====================

export const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    try {
      const value = req.body?.[field];

      if (value && !allowedValues.includes(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} muss einer dieser Werte sein: ${allowedValues.join(', ')}`,
          field,
          allowedValues,
          receivedValue: value
        });
      }

      next();
    } catch (error) {
      logger.error('❌ Enum Validation Error:', error.message);
      next(error);
    }
  };
};

// ==================== CUSTOM VALIDATION ====================

export const validateCustom = (validationFn, message = 'Validierung fehlgeschlagen') => {
  return (req, res, next) => {
    try {
      const error = validationFn(req.body, req);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || message,
          details: error.details || error
        });
      }

      next();
    } catch (err) {
      logger.error('❌ Custom Validation Error:', err);
      res.status(500).json({
        success: false,
        message: 'Validierungsfehler im Server'
      });
    }
  };
};

// ==================== VALIDATION ERROR HANDLER ====================

export const handleValidationError = (err, req, res, next) => {
  if (err.name === 'ValidationError' || err.isJoi) {
    const errors = err.details?.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) || [{ message: err.message }];

    return res.status(400).json({
      success: false,
      message: 'Validierungsfehler',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  next(err);
};

// ==================== PREDEFINED JOI SCHEMAS ====================

export const schemas = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^[0-9+\-() ]{10,}$/),
  url: Joi.string().uri().required(),
  date: Joi.date().iso(),
  id: Joi.string().alphanum().length(24),
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(5000),
  price: Joi.number().positive(),
  rating: Joi.number().min(1).max(5),
  username: Joi.string().alphanum().min(3).max(30),
  age: Joi.number().integer().min(0).max(150)
};

// ==================== BOOKING VALIDATION ====================

const bookingSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name ist erforderlich',
    'string.min': 'Name muss mindestens 2 Zeichen lang sein',
    'any.required': 'Name ist erforderlich'
  }),
  customerEmail: Joi.string().email().required().messages({
    'string.email': 'Ungültige E-Mail-Adresse',
    'any.required': 'E-Mail ist erforderlich'
  }),
  customerPhone: Joi.string().pattern(/^[0-9+\-() ]{10,}$/).required().messages({
    'string.pattern.base': 'Ungültige Telefonnummer',
    'any.required': 'Telefonnummer ist erforderlich'
  }),
  serviceId: Joi.string().length(24).required().messages({
    'string.length': 'Ungültige Service-ID',
    'any.required': 'Service ist erforderlich'
  }),
  date: Joi.string().required().messages({
    'any.required': 'Datum ist erforderlich'
  }),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Ungültiges Zeitformat (HH:MM)',
    'any.required': 'Zeit ist erforderlich'
  }),
  notes: Joi.string().max(500).allow('', null).optional()
});

export const validateBooking = validateBody(bookingSchema);

// ==================== EXPORT ====================

export default {
  validateBody,
  validateParams,
  validateQuery,
  validateAll,
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateDate,
  validateNumeric,
  validateArray,
  validateRequiredFields,
  validateStringLength,
  validateEnum,
  validateCustom,
  sanitizeInput,
  sanitizeField,
  handleValidationError,
  schemas
};
