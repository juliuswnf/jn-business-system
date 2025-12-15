import logger from './logger.js';
// ==================== HELPER FUNCTIONS ====================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ==================== STRING HELPERS ====================

export const stringHelpers = {
  capitalize: (str) => {
    if (!str) {return '';}
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  capitalizeWords: (str) => {
    if (!str) {return '';}
    return str.split(' ').map(word => stringHelpers.capitalize(word)).join(' ');
  },

  toSlug: (str) => {
    if (!str) {return '';}
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  generateRandomString: (length = 32) => {
    return crypto.randomBytes(length / 2).toString('hex');
  },

  truncate: (str, length = 100, suffix = '...') => {
    if (!str || str.length <= length) {return str;}
    return str.substring(0, length - suffix.length) + suffix;
  },

  removeSpecialChars: (str) => {
    if (!str) {return '';}
    return str.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '');
  },

  toCamelCase: (str) => {
    if (!str) {return '';}
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  },

  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// ==================== ARRAY HELPERS ====================

export const arrayHelpers = {
  removeDuplicates: (arr) => {
    return [...new Set(arr)];
  },

  flatten: (arr) => {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(Array.isArray(toFlatten) ? arrayHelpers.flatten(toFlatten) : toFlatten);
    }, []);
  },

  groupBy: (arr, key) => {
    return arr.reduce((grouped, item) => {
      const groupKey = item[key];
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
      return grouped;
    }, {});
  },

  sortBy: (arr, key, order = 'asc') => {
    return [...arr].sort((a, b) => {
      if (a[key] < b[key]) {return order === 'asc' ? -1 : 1;}
      if (a[key] > b[key]) {return order === 'asc' ? 1 : -1;}
      return 0;
    });
  },

  findBy: (arr, key, value) => {
    return arr.find(item => item[key] === value);
  },

  filterByMultiple: (arr, conditions) => {
    return arr.filter(item => {
      return Object.entries(conditions).every(([key, value]) => {
        return item[key] === value;
      });
    });
  },

  chunk: (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  uniqueBy: (arr, key) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item[key])) {return false;}
      seen.add(item[key]);
      return true;
    });
  }
};

// ==================== OBJECT HELPERS ====================

export const objectHelpers = {
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  merge: (obj1, obj2) => {
    return { ...obj1, ...obj2 };
  },

  getNestedProperty: (obj, path) => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  },

  setNestedProperty: (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  },

  filterByKeys: (obj, keys) => {
    return keys.reduce((filtered, key) => {
      if (key in obj) {
        filtered[key] = obj[key];
      }
      return filtered;
    }, {});
  },

  omit: (obj, keysToOmit) => {
    return Object.keys(obj)
      .filter(key => !keysToOmit.includes(key))
      .reduce((filtered, key) => {
        filtered[key] = obj[key];
        return filtered;
      }, {});
  },

  pick: (obj, keysToPick) => {
    return keysToPick.reduce((picked, key) => {
      if (key in obj) {
        picked[key] = obj[key];
      }
      return picked;
    }, {});
  },

  countKeys: (obj) => {
    return Object.keys(obj).length;
  },

  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  }
};

// ==================== DATE HELPERS ====================

export const dateHelpers = {
  formatDate: (date, format = 'DD.MM.YYYY') => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const replacements = {
      'DD': day,
      'MM': month,
      'YYYY': year,
      'HH': hours,
      'mm': minutes
    };

    return format.replace(/DD|MM|YYYY|HH|mm/g, match => replacements[match]);
  },

  daysBetween: (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
  },

  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  addHours: (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  startOfDay: (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay: (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  isPastDate: (date) => {
    return new Date(date) < new Date();
  },

  isFutureDate: (date) => {
    return new Date(date) > new Date();
  }
};

// ==================== NUMBER HELPERS ====================

export const numberHelpers = {
  formatCurrency: (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  roundTo: (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isPrime: (num) => {
    if (num <= 1) {return false;}
    if (num <= 3) {return true;}
    if (num % 2 === 0 || num % 3 === 0) {return false;}
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) {return false;}
    }
    return true;
  },

  percentage: (value, total) => {
    return (value / total) * 100;
  },

  formatNumber: (num, decimals = 0) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
};

// ==================== CRYPTO HELPERS ====================

export const cryptoHelpers = {
  hashString: (str) => {
    return crypto.createHash('sha256').update(str).digest('hex');
  },

  generateHash: async (password, saltRounds = 10) => {
    return await bcrypt.hash(password, saltRounds);
  },

  compareHash: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  generateToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  encryptString: (str, key) => {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },

  decryptString: (encrypted, key) => {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
};

// ==================== VALIDATION HELPERS ====================

export const validationHelpers = {
  isEmpty: (value) => {
    return value === null || value === undefined || value === '';
  },

  isValidEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidPhone: (phone) => {
    const regex = /^\+?[0-9\s\-()]{7,20}$/;
    return regex.test(phone);
  },

  isValidIP: (ip) => {
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return regex.test(ip);
  }
};

// ==================== PAGINATION HELPERS ====================

export const paginationHelpers = {
  calculateSkip: (page = 1, limit = 10) => {
    return (page - 1) * limit;
  },

  calculateTotalPages: (total, limit = 10) => {
    return Math.ceil(total / limit);
  },

  createPaginationObject: (total, page = 1, limit = 10) => {
    return {
      total,
      page,
      limit,
      totalPages: paginationHelpers.calculateTotalPages(total, limit),
      skip: paginationHelpers.calculateSkip(page, limit),
      hasNextPage: page < paginationHelpers.calculateTotalPages(total, limit),
      hasPrevPage: page > 1
    };
  }
};

// ==================== LOGGER HELPERS ====================

export const loggerHelpers = {
  logInfo: (message, data = null) => {
    logger.log(`ℹ️  [INFO] ${message}`, data ? data : '');
  },

  logSuccess: (message, data = null) => {
    logger.log(`✅ [SUCCESS] ${message}`, data ? data : '');
  },

  logWarning: (message, data = null) => {
    logger.warn(`⚠️  [WARNING] ${message}`, data ? data : '');
  },

  logError: (message, error = null) => {
    logger.error(`❌ [ERROR] ${message}`, error ? error.message : '');
  },

  logDebug: (message, data = null) => {
    if (process.env.DEBUG === 'true') {
      logger.log(`🐛 [DEBUG] ${message}`, data ? data : '');
    }
  }
};

// ==================== EXPORT ====================

export default {
  stringHelpers,
  arrayHelpers,
  objectHelpers,
  dateHelpers,
  numberHelpers,
  cryptoHelpers,
  validationHelpers,
  paginationHelpers,
  loggerHelpers
};
