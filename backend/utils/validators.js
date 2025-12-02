import { body, param, validationResult } from 'express-validator';
import { ValidationError } from '../services/errorHandlerService.js';

// ==================== REGEX PATTERNS ====================

export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[0-9\s\-()]{7,20}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  zipCode: /^[0-9]{5}$/,
  creditCard: /^[0-9]{13,19}$/,
  cvv: /^[0-9]{3,4}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/
};

// ==================== CUSTOM VALIDATORS ====================

export const validators = {
  isEmail: (value) => {
    if (!patterns.email.test(value)) {
      throw new Error('Ungültiges Email-Format');
    }
    return true;
  },

  isPhone: (value) => {
    if (!patterns.phone.test(value)) {
      throw new Error('Ungültige Telefonnummer');
    }
    return true;
  },

  isURL: (value) => {
    if (!patterns.url.test(value)) {
      throw new Error('Ungültige URL');
    }
    return true;
  },

  isStrongPassword: (value) => {
    if (!patterns.strongPassword.test(value)) {
      throw new Error(
        'Passwort muss mindestens 12 Zeichen, ' +
        '1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl und 1 Sonderzeichen enthalten'
      );
    }
    return true;
  },

  isPassword: (value) => {
    if (!patterns.password.test(value)) {
      throw new Error(
        'Passwort muss mindestens 8 Zeichen, ' +
        '1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl und 1 Sonderzeichen enthalten'
      );
    }
    return true;
  },

  isMongoId: (value) => {
    if (!patterns.mongoId.test(value)) {
      throw new Error('Ungültige ID-Format');
    }
    return true;
  },

  isZipCode: (value) => {
    if (!patterns.zipCode.test(value)) {
      throw new Error('Ungültiger Postleitzahl-Format (5 Ziffern)');
    }
    return true;
  },

  isCreditCard: (value) => {
    if (!patterns.creditCard.test(value)) {
      throw new Error('Ungültige Kreditkartennummer');
    }

    let sum = 0;
    let isEven = false;

    for (let i = value.length - 1; i >= 0; i--) {
      let digit = parseInt(value[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      throw new Error('Ungültige Kreditkartennummer');
    }

    return true;
  },

  isCVV: (value) => {
    if (!patterns.cvv.test(value)) {
      throw new Error('Ungültiger CVV-Format (3-4 Ziffern)');
    }
    return true;
  },

  isSlug: (value) => {
    if (!patterns.slug.test(value)) {
      throw new Error('URL-Slug muss klein geschrieben sein und Bindestriche verwenden');
    }
    return true;
  },

  isHexColor: (value) => {
    if (!patterns.hex.test(value)) {
      throw new Error('Ungültiges Hex-Farbformat');
    }
    return true;
  },

  isArrayLength: (minLength, maxLength) => {
    return (value) => {
      if (!Array.isArray(value)) {
        throw new Error('Muss ein Array sein');
      }
      if (value.length < minLength) {
        throw new Error(`Mindestens ${minLength} Elemente erforderlich`);
      }
      if (value.length > maxLength) {
        throw new Error(`Maximal ${maxLength} Elemente erlaubt`);
      }
      return true;
    };
  },

  isInRange: (min, max) => {
    return (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new Error('Muss eine Zahl sein');
      }
      if (num < min || num > max) {
        throw new Error(`Muss zwischen ${min} und ${max} liegen`);
      }
      return true;
    };
  },

  isDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Ungültiges Datum');
    }
    return true;
  },

  isFutureDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Ungültiges Datum');
    }
    if (date <= new Date()) {
      throw new Error('Datum muss in der Zukunft liegen');
    }
    return true;
  },

  isPastDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Ungültiges Datum');
    }
    if (date >= new Date()) {
      throw new Error('Datum muss in der Vergangenheit liegen');
    }
    return true;
  },

  isTimeFormat: (value) => {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      throw new Error('Ungültiges Zeitformat (HH:MM)');
    }
    return true;
  },

  isBoolean: (value) => {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      throw new Error('Muss true oder false sein');
    }
    return true;
  },

  isEnum: (allowedValues) => {
    return (value) => {
      if (!allowedValues.includes(value)) {
        throw new Error(`Muss einer der folgenden Werte sein: ${allowedValues.join(', ')}`);
      }
      return true;
    };
  },

  isURLSlug: (value) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      throw new Error('URL-Format ungültig');
    }
    return true;
  },

  isJSON: (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      throw new Error('Ungültiges JSON-Format');
    }
  }
};

// ==================== VALIDATION CHAINS ====================

export const validationChains = {
  createUser: [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('email').isEmail().withMessage('Ungültiges Email-Format'),
    body('password').custom(validators.isPassword),
    body('role').isIn(['employee', 'admin', 'ceo']).withMessage('Ungültige Rolle')
  ],

  loginUser: [
    body('email').isEmail().withMessage('Ungültiges Email-Format'),
    body('password').notEmpty().withMessage('Passwort ist erforderlich')
  ],

  updateProfile: [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('email').isEmail().withMessage('Ungültiges Email-Format'),
    body('phone').optional().custom(validators.isPhone)
  ],

  changePassword: [
    body('oldPassword').notEmpty().withMessage('Altes Passwort ist erforderlich'),
    body('newPassword').custom(validators.isPassword),
    body('confirmPassword').notEmpty().withMessage('Passwortbestätigung ist erforderlich')
  ],

  createCustomer: [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('email').isEmail().withMessage('Ungültiges Email-Format'),
    body('phone').custom(validators.isPhone),
    body('address.city').trim().notEmpty().withMessage('Stadt ist erforderlich'),
    body('address.zipCode').custom(validators.isZipCode)
  ],

  updateCustomer: [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().custom(validators.isPhone)
  ],

  createService: [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('price').isFloat({ min: 0 }).withMessage('Preis muss positiv sein'),
    body('duration').isInt({ min: 5 }).withMessage('Dauer muss mindestens 5 Minuten sein'),
    body('category').trim().notEmpty().withMessage('Kategorie ist erforderlich')
  ],

  createAppointment: [
    body('customerId').custom(validators.isMongoId),
    body('serviceId').custom(validators.isMongoId),
    body('appointmentDate').custom(validators.isFutureDate),
    body('duration').isInt({ min: 5 }).withMessage('Dauer muss mindestens 5 Minuten sein')
  ],

  createBooking: [
    body('customerId').custom(validators.isMongoId),
    body('serviceId').custom(validators.isMongoId),
    body('appointmentDate').custom(validators.isFutureDate)
  ],

  createPayment: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Betrag muss größer als 0 sein'),
    body('currency').custom(validators.isEnum(['EUR', 'USD', 'GBP'])),
    body('paymentMethod').custom(validators.isEnum(['card', 'cash', 'transfer']))
  ],

  applyDiscount: [
    body('discountPercent').isInt({ min: 0, max: 100 }).withMessage('Rabatt muss zwischen 0 und 100 liegen'),
    body('validUntil').custom(validators.isFutureDate)
  ],

  createReview: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating muss zwischen 1 und 5 liegen'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Kommentar zu lang')
  ],

  mongoIdParam: [
    param('id').custom(validators.isMongoId).withMessage('Ungültige ID')
  ]
};

// ==================== VALIDATION MIDDLEWARE ====================

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.param] = error.msg;
      return acc;
    }, {});

    throw new ValidationError('Validierungsfehler', formattedErrors);
  }

  next();
};

// ==================== EXPORT ====================

export default {
  patterns,
  validators,
  validationChains,
  handleValidationErrors
};
