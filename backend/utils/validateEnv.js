// ==================== VALIDATE ENVIRONMENT VARIABLES ====================

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ==================== REQUIRED ENV VARIABLES ====================

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM'
];

// ==================== OPTIONAL ENV VARIABLES ====================

const optionalEnvVars = [
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'PRODUCTION_URL',
  'LOG_LEVEL',
  'DEBUG',
  'STRIPE_API_KEY',
  'STRIPE_SECRET_KEY',
  'API_VERSION'
];

// ==================== REGEX PATTERNS FOR VALIDATION ====================

const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  mongoUri: /^mongodb(\+srv)?:\/\/.+/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  jwtSecret: /^.{32,}$/, // Min 32 characters
  port: /^\d{4,5}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// ==================== VALIDATORS ====================

const validators = {
  // Validate Node Environment
  isNodeEnv: (value) => {
    if (!['development', 'production', 'test'].includes(value)) {
      throw new Error('NODE_ENV must be: development | production | test');
    }
    return true;
  },

  // Validate Port
  isPort: (value) => {
    const port = parseInt(value);
    if (isNaN(port) || port < 3000 || port > 65535) {
      throw new Error('PORT must be a number between 3000 and 65535');
    }
    return true;
  },

  // Validate MongoDB URI
  isMongoDBUri: (value) => {
    if (!patterns.mongoUri.test(value)) {
      throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }
    return true;
  },

  // Validate JWT Secret
  isJWTSecret: (value) => {
    if (!patterns.jwtSecret.test(value)) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return true;
  },

  // Validate JWT Expire
  isJWTExpire: (value) => {
    if (!/^\d+d$/.test(value) && !/^\d+h$/.test(value) && !/^\d+m$/.test(value)) {
      throw new Error('JWT_EXPIRE must be in format: 7d | 24h | 60m');
    }
    return true;
  },

  // Validate URL
  isURL: (value) => {
    if (!patterns.url.test(value)) {
      throw new Error('Invalid URL format');
    }
    return true;
  },

  // Validate Email
  isEmail: (value) => {
    if (!patterns.email.test(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  },

  // Validate SMTP Port
  isSMTPPort: (value) => {
    const port = parseInt(value);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT must be a valid port number');
    }
    return true;
  },

  // Validate Redis Port
  isRedisPort: (value) => {
    const port = parseInt(value);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('REDIS_PORT must be a valid port number');
    }
    return true;
  },

  // Validate Log Level
  isLogLevel: (value) => {
    if (!['error', 'warn', 'info', 'debug', 'trace'].includes(value)) {
      throw new Error('LOG_LEVEL must be: error | warn | info | debug | trace');
    }
    return true;
  },

  // Validate Debug Flag
  isDebug: (value) => {
    if (value !== 'true' && value !== 'false') {
      throw new Error('DEBUG must be true or false');
    }
    return true;
  }
};

// ==================== VALIDATION CHAINS ====================

const validationChains = {
  // Validate all required variables
  validateRequired: () => {
    const errors = {};

    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        errors[varName] = `${varName} is required`;
      }
    });

    return errors;
  },

  // Validate all variable values
  validateValues: () => {
    const errors = {};

    try {
      validators.isNodeEnv(process.env.NODE_ENV);
    } catch (error) {
      errors.NODE_ENV = error.message;
    }

    try {
      validators.isPort(process.env.PORT);
    } catch (error) {
      errors.PORT = error.message;
    }

    try {
      validators.isMongoDBUri(process.env.MONGODB_URI);
    } catch (error) {
      errors.MONGODB_URI = error.message;
    }

    try {
      validators.isJWTSecret(process.env.JWT_SECRET);
    } catch (error) {
      errors.JWT_SECRET = error.message;
    }

    try {
      validators.isJWTExpire(process.env.JWT_EXPIRE);
    } catch (error) {
      errors.JWT_EXPIRE = error.message;
    }

    try {
      validators.isURL(process.env.FRONTEND_URL);
    } catch (error) {
      errors.FRONTEND_URL = error.message;
    }

    try {
      validators.isEmail(process.env.SMTP_FROM);
    } catch (error) {
      errors.SMTP_FROM = error.message;
    }

    try {
      validators.isSMTPPort(process.env.SMTP_PORT);
    } catch (error) {
      errors.SMTP_PORT = error.message;
    }

    // Optional variables
    if (process.env.REDIS_PORT) {
      try {
        validators.isRedisPort(process.env.REDIS_PORT);
      } catch (error) {
        errors.REDIS_PORT = error.message;
      }
    }

    if (process.env.LOG_LEVEL) {
      try {
        validators.isLogLevel(process.env.LOG_LEVEL);
      } catch (error) {
        errors.LOG_LEVEL = error.message;
      }
    }

    return errors;
  }
};

// ==================== VALIDATE ENV ====================

export const validateEnv = () => {
  try {
    console.log('\n================================');
    console.log('  🔍 Validating Environment Variables');
    console.log('================================\n');

    // Check required variables
    const requiredErrors = validationChains.validateRequired();

    if (Object.keys(requiredErrors).length > 0) {
      console.log('❌ Missing required environment variables:\n');
      Object.entries(requiredErrors).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
      console.log('');
      return false;
    }

    // Check variable values
    const valueErrors = validationChains.validateValues();

    if (Object.keys(valueErrors).length > 0) {
      console.log('⚠️  Invalid environment variable values:\n');
      Object.entries(valueErrors).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
      console.log('');
      return false;
    }

    console.log('✅ All environment variables valid!\n');
    return true;
  } catch (error) {
    console.error('❌ Error validating environment:', error.message, '\n');
    return false;
  }
};

// ==================== SHOW ENV STATUS ====================

export const showEnvStatus = () => {
  console.log('\n📋 Environment Status:\n');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   REDIS: ${process.env.REDIS_HOST ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
};

// ==================== CREATE ENV FILE FROM TEMPLATE ====================

export const createEnvFromTemplate = () => {
  try {
    const templatePath = path.join(__dirname, '../.env.example');
    const envPath = path.join(__dirname, '../.env');

    if (!fs.existsSync(templatePath)) {
      console.warn('⚠️  .env.example not found');
      return false;
    }

    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env already exists\n');
      return false;
    }

    fs.copyFileSync(templatePath, envPath);
    console.log('✅ .env file created from template\n');
    return true;
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    return false;
  }
};

// ==================== EXPORT ====================

export {
  patterns,
  validators,
  validationChains,
  requiredEnvVars,
  optionalEnvVars
};

export default {
  patterns,
  validators,
  validationChains,
  validateEnv,
  showEnvStatus,
  createEnvFromTemplate,
  requiredEnvVars,
  optionalEnvVars
};
