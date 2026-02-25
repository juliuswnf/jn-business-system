/**
 * Utility Helper Functions
 */

// ==================== DATE HELPERS ====================

export const formatDate = (date, format = 'de-DE') => {
  return new Date(date).toLocaleDateString(format);
};

export const formatDateTime = (date, format = 'de-DE') => {
  return new Date(date).toLocaleString(format);
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDateDifference = (date1, date2) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isUpcoming = (date) => {
  return new Date(date) > new Date();
};

export const isPast = (date) => {
  return new Date(date) < new Date();
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

// ==================== CURRENCY HELPERS ====================

export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);
};

export const parseCurrency = (value) => {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
};

// ==================== STRING HELPERS ====================

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str, length = 50) => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const camelToTitle = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// ==================== VALIDATION HELPERS ====================

export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone) => {
  const regex = /^\+?[0-9\s\-()]{7,20}$/;
  return regex.test(phone);
};

export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isStrongPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// ==================== ARRAY HELPERS ====================

export const unique = (array, key) => {
  return [...new Map(array.map((item) => [item[key], item])).values()];
};

export const groupBy = (array, key) => {
  return array.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ==================== OBJECT HELPERS ====================

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const merge = (obj1, obj2) => {
  return { ...obj1, ...obj2 };
};

export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

export const omit = (obj, keys) => {
  return Object.keys(obj)
    .filter((key) => !keys.includes(key))
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
};

// ==================== STORAGE HELPERS ====================

export const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getStorage = (key, defaultValue = null) => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : defaultValue;
};

export const removeStorage = (key) => {
  localStorage.removeItem(key);
};

export const clearStorage = () => {
  localStorage.clear();
};

// ==================== NUMBER HELPERS ====================

export const roundTo = (num, decimals = 0) => {
  return Number(`${Math.round(`${num}e${decimals}`)}e-${decimals}`);
};

export const percentage = (part, total) => {
  return roundTo((part / total) * 100, 2);
};

export const formatNumber = (num) => {
  return num.toLocaleString('de-DE');
};

// ==================== COLOR HELPERS ====================

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
};

export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// ==================== TIMER HELPERS ====================

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ==================== FILE HELPERS ====================

export const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const isValidFileSize = (bytes, maxMB = 5) => {
  return bytes <= maxMB * 1024 * 1024;
};

export const isValidFileType = (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) => {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(ext);
};
