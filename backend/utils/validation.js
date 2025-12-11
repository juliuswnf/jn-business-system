import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Validation Utilities
 * Centralized validation functions to prevent bugs and security issues
 */

/**
 * Escape special characters in regex patterns to prevent ReDoS attacks
 * @param {string} str - User input string
 * @returns {string} - Escaped string safe for RegExp
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate and parse date string
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export const parseValidDate = (dateInput) => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit (default 100)
 * @returns {object} - Sanitized pagination params
 */
export const sanitizePagination = (page, limit, maxLimit = 100) => {
  const sanitizedPage = Math.max(1, parseInt(page) || 1);
  const sanitizedLimit = Math.min(
    Math.max(1, parseInt(limit) || 20),
    maxLimit
  );
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true, message: 'Password is valid' };
};

/**
 * Generate secure random password
 * @param {number} length - Password length (default 16)
 * @returns {string} - Secure random password
 */
export const generateSecurePassword = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
};

/**
 * Sanitize error message for client response (prevent info disclosure)
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Default message to show to client
 * @returns {string} - Safe error message
 */
export const sanitizeErrorMessage = (error, fallbackMessage = 'Internal Server Error') => {
  // In development, we can be more verbose
  if (process.env.NODE_ENV === 'development') {
    return error.message || fallbackMessage;
  }

  // In production, hide sensitive details
  // Only expose specific known safe error messages
  const safeMessages = [
    'User not found',
    'Invalid credentials',
    'Email already exists',
    'Booking not found',
    'Salon not found',
    'Service not found',
    'This time slot is already booked',
    'Unauthorized',
    'Invalid token'
  ];

  if (safeMessages.includes(error.message)) {
    return error.message;
  }

  return fallbackMessage;
};

export default {
  escapeRegex,
  isValidObjectId,
  parseValidDate,
  isValidEmail,
  sanitizePagination,
  validatePassword,
  generateSecurePassword,
  sanitizeErrorMessage
};
