/**
 * Application Constants
 */

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  CUSTOMERS: '/customers',
  APPOINTMENTS: '/appointments',
  BOOKINGS: '/bookings',
  SERVICES: '/services',
  PAYMENTS: '/payments',
  REVIEWS: '/reviews',
  EMPLOYEES: '/employees',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings'
};

// ==================== USER ROLES ====================

export const USER_ROLES = {
  CEO: 'ceo',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer'
};

// ==================== APPOINTMENT STATUS ====================

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  RESCHEDULED: 'rescheduled'
};

// ==================== BOOKING STATUS ====================

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ==================== PAYMENT STATUS ====================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// ==================== PAYMENT METHODS ====================

export const PAYMENT_METHODS = {
  CARD: 'card',
  CASH: 'cash',
  TRANSFER: 'transfer',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple-pay',
  GOOGLE_PAY: 'google-pay'
};

// ==================== NOTIFICATION TYPES ====================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ==================== DATE RANGES ====================

export const DATE_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// ==================== CURRENCIES ====================

export const CURRENCIES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP'
};

// ==================== TIME FORMATS ====================

export const TIME_FORMATS = {
  DATE: 'DD.MM.YYYY',
  TIME: 'HH:mm',
  DATETIME: 'DD.MM.YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// ==================== TABLE PAGINATION ====================

export const PAGINATION = {
  PAGE_SIZES: [10, 25, 50, 100],
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

// ==================== VALIDATION ====================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_PHONE_LENGTH: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
};

// ==================== MESSAGES ====================

export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Successfully created',
    UPDATED: 'Successfully updated',
    DELETED: 'Successfully deleted',
    SAVED: 'Changes saved'
  },
  ERROR: {
    GENERIC: 'An error occurred',
    NETWORK: 'Network error',
    UNAUTHORIZED: 'Please log in again',
    FORBIDDEN: 'You do not have permission',
    NOT_FOUND: 'Resource not found',
    VALIDATION: 'Validation error'
  },
  CONFIRM: {
    DELETE: 'Are you sure you want to delete this?',
    LOGOUT: 'Are you sure you want to log out?',
    CANCEL: 'Are you sure you want to cancel?'
  }
};

// ==================== SIDEBAR MENU ====================

export const MENU_ITEMS = {
  CEO: [
    { label: 'Dashboard', path: '/ceo/dashboard', icon: 'FiHome' },
    { label: 'Analytics', path: '/ceo/analytics', icon: 'FiBarChart2' },
    { label: 'Settings', path: '/ceo/settings', icon: 'FiSettings' }
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'FiHome' },
    { label: 'Customers', path: '/admin/customers', icon: 'FiUsers' },
    { label: 'Appointments', path: '/admin/appointments', icon: 'FiCalendar' },
    { label: 'Payments', path: '/admin/payments', icon: 'FiDollarSign' }
  ],
  EMPLOYEE: [
    { label: 'Dashboard', path: '/employee/dashboard', icon: 'FiHome' },
    { label: 'Schedule', path: '/employee/schedule', icon: 'FiCalendar' },
    { label: 'Appointments', path: '/employee/appointments', icon: 'FiClock' }
  ]
};

// ==================== COLOR SCHEMES ====================

export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#06b6d4'
};

// ==================== LOCAL STORAGE KEYS ====================

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recentSearches'
};

// ==================== FEATURE FLAGS ====================

export const FEATURES = {
  TWO_FACTOR_AUTH: false,
  EMAIL_VERIFICATION: true,
  PAYMENT_PROCESSING: true,
  CUSTOMER_REVIEWS: true,
  EMPLOYEE_SCHEDULING: true,
  ADVANCED_ANALYTICS: true
};
