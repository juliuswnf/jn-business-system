import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ? SECURITY FIX: Send cookies with all requests
});

api.interceptors.request.use(
  (config) => {
    // ? SECURITY FIX: Tokens are now in HTTP-only cookies
    // Browser sends cookies automatically with withCredentials: true
    // No need to manually set Authorization header - backend reads from cookies
    
    // ? SECURITY FIX: Add CSRF token to all state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      // Get CSRF token from cookie (set by backend, readable by JavaScript)
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
      
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ FIX: Silently handle expected 401 errors for auth endpoints (user not logged in)
    const isExpected401 = error.response?.status === 401 && (
      originalRequest?.url?.includes('/auth/profile') ||
      originalRequest?.url?.includes('/auth/refresh-token')
    );

    // Silently handle 404 errors for confirmations endpoint
    // (not all bookings have confirmations, so 404 is expected)
    if (error.response?.status === 404 && originalRequest?.url?.includes('/confirmations/')) {
      // Suppress console errors for expected 404s on confirmations
      // The component will handle this gracefully
      return Promise.reject(error);
    }

    // Skip redirect for login/register endpoints - let the component handle the error
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                           originalRequest?.url?.includes('/auth/register') ||
                           originalRequest?.url?.includes('/auth/ceo-login');

    if (isAuthEndpoint) {
      // Don't redirect for login failures - let the login form show the error
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Prevent infinite loop - if refresh-token also returns 401, stop retrying
      if (originalRequest?.url?.includes('/auth/refresh-token')) {
        localStorage.removeItem('jnAuthToken');
        localStorage.removeItem('jnUser');
        localStorage.removeItem('user');
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        // Silently reject - this is expected when not logged in
        return Promise.reject(error);
      }
      
      try {
        // ? SECURITY FIX: Refresh token is now in HTTP-only cookie, no need to get from localStorage
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true // Send cookies
        });

        if (response.data.success) {
          // ? SECURITY FIX: New tokens are set as HTTP-only cookies by backend
          // No need to store in localStorage or set header manually
          // Browser will send cookies automatically with withCredentials: true
          return api(originalRequest);
        }
      } catch (refreshError) {
        // ? SECURITY FIX: Tokens are in HTTP-only cookies, cleared by backend on logout
        // Clear any leftover localStorage data
        localStorage.removeItem('jnAuthToken');
        localStorage.removeItem('jnUser');
        localStorage.removeItem('user');
        // Only redirect if not already on login page to prevent loops
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        // Silently reject if it's an expected 401 (user not logged in)
        if (isExpected401) {
          return Promise.reject(refreshError);
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  registerAdmin: (userData) => api.post('/auth/register-admin', userData),
  ceoLogin: (email, password, twoFactorCode) => api.post('/auth/ceo-login', { email, password, twoFactorCode }),
  employeeLogin: (email, password) => api.post('/auth/employee-login', { email, password }),
  logout: () => api.post('/auth/logout'),
  logoutFromAllDevices: () => api.post('/auth/logout-all'),
  refreshToken: () => api.post('/auth/refresh-token', {}, { withCredentials: true }), // ? SECURITY FIX: Token is in HTTP-only cookie
  validateToken: (token) => api.post('/auth/validate-token', { token }),
  getTokenInfo: () => api.get('/auth/token-info'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteAvatar: () => api.delete('/auth/profile/avatar'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email, role) => api.post('/auth/forgot-password', { email, role }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyPasswordResetToken: (token) => api.post('/auth/verify-reset-token', { token }),
  sendVerificationEmail: () => api.post('/auth/send-verification-email'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerificationEmail: (email) => api.post('/auth/resend-verification-email', { email }),
  enable2FA: () => api.post('/auth/2fa/enable'),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  verify2FACode: (code) => api.post('/auth/2fa/verify', { code }),
  get2FAStatus: () => api.get('/auth/2fa/status'),
  regenerateBackupCodes: (data) => api.post('/auth/2fa/regenerate-backup-codes', data),
  getActiveSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId) => api.post(`/auth/sessions/${sessionId}/revoke`),
  googleLogin: (token) => api.post('/auth/google-login', { token }),
  facebookLogin: (token) => api.post('/auth/facebook-login', { token }),
  checkEmailExists: (email) => api.post('/auth/check-email', { email }),
  deleteAccount: (data) => api.post('/auth/delete-account', data),
  scheduleAccountDeletion: (data) => api.post('/auth/schedule-deletion', data),
  cancelAccountDeletion: () => api.post('/auth/cancel-deletion'),
  exportUserData: () => api.get('/auth/export-data', { responseType: 'blob' }),
  getAPIKeys: () => api.get('/auth/api-keys'),
  generateAPIKey: (data) => api.post('/auth/api-keys/generate', data),
  revokeAPIKey: (keyId) => api.post(`/auth/api-keys/${keyId}/revoke`),
  getLoginHistory: (params) => api.get('/auth/login-history', { params }),
  getActivityLog: (params) => api.get('/auth/activity-log', { params }),
  clearLoginHistory: () => api.post('/auth/clear-login-history'),
  getTrustedDevices: () => api.get('/auth/trusted-devices'),
  trustDevice: (data) => api.post('/auth/trust-device', data),
  revokeTrustedDevice: (deviceId) => api.post(`/auth/trusted-devices/${deviceId}/revoke`),
  sendInvitation: (data) => api.post('/auth/invite', data),
  acceptInvitation: (data) => api.post('/auth/accept-invitation', data),
  getReferralLink: () => api.get('/auth/referral-link'),
  getSecurityInfo: () => api.get('/auth/security-info'),
  updateSecuritySettings: (data) => api.put('/auth/security-settings', data),
  checkPasswordStrength: (password) => api.post('/auth/check-password-strength', { password }),
  healthCheck: () => api.get('/auth/health')
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  verifyEmail: (email) => api.post('/customers/verify-email', { email }),
  getProfile: (id) => api.get(`/customers/${id}/profile`),
  updateProfile: (id, data) => api.put(`/customers/${id}/profile`, data),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/customers/${id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteAvatar: (id) => api.delete(`/customers/${id}/avatar`),
  getBookings: (id, params) => api.get(`/customers/${id}/bookings`, { params }),
  getAppointments: (id, params) => api.get(`/customers/${id}/appointments`, { params }),
  getReviews: (id, params) => api.get(`/customers/${id}/reviews`, { params }),
  getPayments: (id, params) => api.get(`/customers/${id}/payments`, { params }),
  getVisitHistory: (id, params) => api.get(`/customers/${id}/visit-history`, { params }),
  getPreferences: (id) => api.get(`/customers/${id}/preferences`),
  updatePreferences: (id, data) => api.put(`/customers/${id}/preferences`, data),
  getContactPreferences: (id) => api.get(`/customers/${id}/contact-preferences`),
  updateContactPreferences: (id, data) => api.put(`/customers/${id}/contact-preferences`, data),
  getLoyaltyPoints: (id) => api.get(`/customers/${id}/loyalty/points`),
  addLoyaltyPoints: (id, data) => api.post(`/customers/${id}/loyalty/add`, data),
  redeemLoyaltyPoints: (id, data) => api.post(`/customers/${id}/loyalty/redeem`, data),
  getLoyaltyHistory: (id, params) => api.get(`/customers/${id}/loyalty/history`, { params }),
  getLoyaltyTier: (id) => api.get(`/customers/${id}/loyalty/tier`),
  getVIPCustomers: (params) => api.get('/customers/segment/vip', { params }),
  getHighValueCustomers: (params) => api.get('/customers/segment/high-value', { params }),
  getInactiveCustomers: (params) => api.get('/customers/segment/inactive', { params }),
  getAtRiskCustomers: (params) => api.get('/customers/segment/at-risk', { params }),
  getNewCustomers: (params) => api.get('/customers/segment/new', { params }),
  getReturningCustomers: (params) => api.get('/customers/segment/returning', { params }),
  sendEmail: (id, data) => api.post(`/customers/${id}/send-email`, data),
  sendSMS: (id, data) => api.post(`/customers/${id}/send-sms`, data),
  sendNotification: (id, data) => api.post(`/customers/${id}/send-notification`, data),
  markVIP: (id) => api.post(`/customers/${id}/mark-vip`),
  unmarkVIP: (id) => api.post(`/customers/${id}/unmark-vip`),
  block: (id) => api.post(`/customers/${id}/block`),
  unblock: (id) => api.post(`/customers/${id}/unblock`),
  deactivate: (id) => api.post(`/customers/${id}/deactivate`),
  reactivate: (id) => api.post(`/customers/${id}/reactivate`),
  getStats: (params) => api.get('/customers/stats/overview', { params }),
  getLifetimeValue: (id) => api.get(`/customers/${id}/lifetime-value`),
  getSatisfactionScore: (id) => api.get(`/customers/${id}/satisfaction-score`),
  getRetentionRate: (params) => api.get('/customers/stats/retention-rate', { params }),
  getChurnRate: (params) => api.get('/customers/stats/churn-rate', { params }),
  getAcquisitionMetrics: (params) => api.get('/customers/stats/acquisition', { params }),
  search: (params) => api.get('/customers/search/query', { params }),
  filter: (params) => api.get('/customers/search/filter', { params }),
  getByDateRange: (params) => api.get('/customers/range/dates', { params }),
  getByCountry: (country, params) => api.get(`/customers/location/country/${country}`, { params }),
  getByCity: (city, params) => api.get(`/customers/location/city/${city}`, { params }),
  addNote: (id, data) => api.post(`/customers/${id}/notes`, data),
  getNotes: (id, params) => api.get(`/customers/${id}/notes`, { params }),
  deleteNote: (id, noteId) => api.delete(`/customers/${id}/notes/${noteId}`),
  addTag: (id, data) => api.post(`/customers/${id}/tags`, data),
  removeTag: (id, tag) => api.delete(`/customers/${id}/tags/${tag}`),
  getByTag: (tag, params) => api.get(`/customers/tag/${tag}`, { params }),
  bulkImport: (data) => api.post('/customers/bulk/import', data),
  bulkUpdate: (data) => api.post('/customers/bulk/update', data),
  bulkDelete: (data) => api.post('/customers/bulk/delete', data),
  bulkSendEmail: (data) => api.post('/customers/bulk/send-email', data),
  bulkSendSMS: (data) => api.post('/customers/bulk/send-sms', data),
  bulkAssignTag: (data) => api.post('/customers/bulk/tag', data),
  exportCSV: (params) => api.get('/customers/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/customers/export/pdf', { params, responseType: 'blob' }),
  getInsights: () => api.get('/customers/insights/overview'),
  getTopCustomers: (params) => api.get('/customers/insights/top-customers', { params }),
  getTrends: (params) => api.get('/customers/insights/trends', { params }),
  getBehaviorAnalysis: (params) => api.get('/customers/insights/behavior', { params }),
  getSegmentationAnalysis: (params) => api.get('/customers/insights/segmentation', { params }),
  sendReengagementCampaign: (data) => api.post('/customers/campaigns/re-engagement', data),
  sendWinBackCampaign: (data) => api.post('/customers/campaigns/win-back', data),
  getCampaignResults: (params) => api.get('/customers/campaigns/results', { params }),
  generateReport: (data) => api.post('/customers/report/generate', data),
  getReportByDateRange: (params) => api.get('/customers/report/date-range', { params })
};

export const bookingAPI = {
  // Convenience alias for tenant-scoped bookings (customer/business/employee via backend tenant middleware)
  getMine: (params = {}) => api.get('/bookings', { params: { page: 1, limit: 100, ...params } }),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),
  createPublic: (data) => api.post('/bookings/public/create', data),
  getAvailableSlots: (params) => api.get('/bookings/available-slots', { params }),
  checkAvailability: (data) => api.post('/bookings/availability/check', data),
  getAvailableTimeSlots: (data) => api.post('/bookings/slots/available', data),
  getAvailableEmployees: (data) => api.post('/bookings/employees/available', data),
  getTodayBookings: (params) => api.get('/bookings/today/all', { params }),
  getWeekBookings: (params) => api.get('/bookings/week/all', { params }),
  getMonthBookings: (params) => api.get('/bookings/month/all', { params }),
  getByDateRange: (params) => api.get('/bookings/range/dates', { params }),
  getPending: (params) => api.get('/bookings/status/pending', { params }),
  getConfirmed: (params) => api.get('/bookings/status/confirmed', { params }),
  getCancelled: (params) => api.get('/bookings/status/cancelled', { params }),
  getCompleted: (params) => api.get('/bookings/status/completed', { params }),
  getByCustomer: (customerId, params) => api.get(`/bookings/customer/${customerId}/bookings`, { params }),
  getCustomerUpcoming: (customerId, params) => api.get(`/bookings/customer/${customerId}/upcoming`, { params }),
  getCustomerPast: (customerId, params) => api.get(`/bookings/customer/${customerId}/past`, { params }),
  getCustomerHistory: (customerId, params) => api.get(`/bookings/customer/${customerId}/history`, { params }),
  getByService: (serviceId, params) => api.get(`/bookings/service/${serviceId}/bookings`, { params }),
  getByEmployee: (employeeId, params) => api.get(`/bookings/employee/${employeeId}/bookings`, { params }),
  getAwaitingPayment: (params) => api.get('/bookings/payment/awaiting', { params }),
  getAwaitingConfirmation: (params) => api.get('/bookings/confirmation/awaiting', { params }),
  getNeedingReview: (params) => api.get('/bookings/review/needed', { params }),
  getHighValue: (params) => api.get('/bookings/high-value/list', { params }),
  getVIP: (params) => api.get('/bookings/vip/bookings', { params }),
  getConflicting: (params) => api.get('/bookings/conflicts/check', { params }),
  getDoubleBooked: (params) => api.get('/bookings/conflicts/double-booked', { params }),
  getIssues: (params) => api.get('/bookings/issues/all', { params }),
  filter: (params) => api.get('/bookings/search/filter', { params }),
  search: (params) => api.get('/bookings/search/query', { params }),
  getPendingReminders: (params) => api.get('/bookings/reminders/pending', { params }),
  getReminderHistory: (params) => api.get('/bookings/reminders/history', { params }),
  exportCSV: (params) => api.get('/bookings/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/bookings/export/pdf', { params, responseType: 'blob' }),
  exportAll: (params) => api.get('/bookings/bulk/export', { params, responseType: 'blob' }),
  generateReport: (data) => api.post('/bookings/report/generate', data),
  getMonthlyReport: (month, year) => api.get(`/bookings/report/monthly/${month}/${year}`),
  getStats: (params) => api.get('/bookings/stats/overview', { params }),
  getDistribution: (params) => api.get('/bookings/stats/distribution', { params }),
  getCancellationRate: (params) => api.get('/bookings/stats/cancellation-rate', { params }),
  getNoShowRate: (params) => api.get('/bookings/stats/no-show-rate', { params }),
  getRevenueStats: (params) => api.get('/bookings/stats/revenue', { params }),
  getAverageValue: (params) => api.get('/bookings/stats/avg-booking-value', { params }),
  getPeakTimes: (params) => api.get('/bookings/stats/peak-times', { params }),
  getTrends: (params) => api.get('/bookings/stats/trends', { params }),
  confirm: (id) => api.post(`/bookings/${id}/confirm`),
  cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data),
  reschedule: (id, data) => api.post(`/bookings/${id}/reschedule`, data),
  complete: (id) => api.post(`/bookings/${id}/complete`),
  createPayment: (id, data) => api.post(`/bookings/${id}/payment`, data),
  getPaymentStatus: (id) => api.get(`/bookings/${id}/payment-status`),
  refund: (id, data) => api.post(`/bookings/${id}/refund`, data),
  sendReminder: (id) => api.post(`/bookings/${id}/send-reminder`),
  bulkCreate: (data) => api.post('/bookings/bulk/create', data),
  bulkCancel: (data) => api.post('/bookings/bulk/cancel', data),
  bulkConfirm: (data) => api.post('/bookings/bulk/confirm', data),
  bulkUpdate: (data) => api.post('/bookings/bulk/update', data),
  bulkImport: (data) => api.post('/bookings/bulk/import', data)
};

export const serviceAPI = {
  getAll: async (params, forceRefresh = false) => {
    // Return cached data if available and not expired
    if (!forceRefresh && !params && servicesCache && servicesCacheTime) {
      const now = Date.now();
      if (now - servicesCacheTime < SERVICES_CACHE_TTL) {
        return servicesCache;
      }
    }
    
    // If there's already an ongoing request, wait for it instead of making a new one
    if (!params && servicesCachePromise && !forceRefresh) {
      return servicesCachePromise;
    }
    
    // Fetch fresh data
    const fetchPromise = (async () => {
      try {
        const response = await api.get('/services', { params });
        
        // Cache the response if no params (default list)
        if (!params) {
          servicesCache = response;
          servicesCacheTime = Date.now();
          servicesCachePromise = null; // Clear promise after completion
        }
        
        return response;
      } catch (error) {
        if (!params) {
          servicesCachePromise = null; // Clear promise on error
        }
        throw error;
      }
    })();
    
    // Store promise for concurrent requests
    if (!params) {
      servicesCachePromise = fetchPromise;
    }
    
    return fetchPromise;
  },
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getPublic: (params) => api.get('/services/public', { params }),
  getPublicById: (id) => api.get(`/services/public/${id}`),
  getByCategory: (category, params) => api.get(`/services/public/category/${category}`, { params }),
  searchPublic: (query, params) => api.get(`/services/public/search/${query}`, { params }),
  getFeatured: () => api.get('/services/public/featured'),
  getBestsellers: () => api.get('/services/public/bestsellers'),
  getOnSale: () => api.get('/services/public/on-sale'),
  getCategories: () => api.get('/services/categories/all'),
  getCategoryStats: (category) => api.get(`/services/category/${category}/stats`),
  toggleAvailability: (id, data) => api.post(`/services/${id}/toggle-availability`, data),
  getAvailability: (id) => api.get(`/services/${id}/availability`),
  setAvailability: (id, data) => api.post(`/services/${id}/set-availability`, data),
  getPricing: (id) => api.get(`/services/${id}/pricing`),
  updatePricing: (id, data) => api.put(`/services/${id}/pricing`, data),
  getPriceHistory: (id, params) => api.get(`/services/${id}/price-history`, { params }),
  applyDiscount: (id, data) => api.post(`/services/${id}/discount/apply`, data),
  removeDiscount: (id) => api.post(`/services/${id}/discount/remove`),
  getDiscount: (id) => api.get(`/services/${id}/discount`),
  getVariations: (id, params) => api.get(`/services/${id}/variations`, { params }),
  addVariation: (id, data) => api.post(`/services/${id}/variations/add`, data),
  updateVariation: (id, variationId, data) => api.put(`/services/${id}/variations/${variationId}`, data),
  deleteVariation: (id, variationId) => api.delete(`/services/${id}/variations/${variationId}`),
  getAddOns: (id, params) => api.get(`/services/${id}/add-ons`, { params }),
  addAddOn: (id, data) => api.post(`/services/${id}/add-ons/add`, data),
  updateAddOn: (id, addOnId, data) => api.put(`/services/${id}/add-ons/${addOnId}`, data),
  deleteAddOn: (id, addOnId) => api.delete(`/services/${id}/add-ons/${addOnId}`),
  getAssignedEmployees: (id, params) => api.get(`/services/${id}/employees`, { params }),
  assignEmployee: (id, data) => api.post(`/services/${id}/employees/assign`, data),
  removeEmployee: (id, data) => api.post(`/services/${id}/employees/remove`, data),
  getAvailableEmployees: (id, params) => api.get(`/services/${id}/available-employees`, { params }),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/services/${id}/images/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getImages: (id, params) => api.get(`/services/${id}/images`, { params }),
  deleteImage: (id, imageId) => api.delete(`/services/${id}/images/${imageId}`),
  setPrimaryImage: (id, imageId) => api.post(`/services/${id}/images/${imageId}/set-primary`),
  getRatings: (id, params) => api.get(`/services/${id}/ratings`, { params }),
  getReviews: (id, params) => api.get(`/services/${id}/reviews`, { params }),
  getTopReviews: (id, params) => api.get(`/services/${id}/reviews/top`, { params }),
  getRatingSummary: (id) => api.get(`/services/${id}/rating-summary`),
  getStats: (id, params) => api.get(`/services/${id}/stats`, { params }),
  getBookingStats: (id, params) => api.get(`/services/${id}/stats/bookings`, { params }),
  getRevenueStats: (id, params) => api.get(`/services/${id}/stats/revenue`, { params }),
  getPerformanceAnalytics: (id, params) => api.get(`/services/${id}/analytics/performance`, { params }),
  getDemandAnalytics: (id, params) => api.get(`/services/${id}/analytics/demand`, { params }),
  markFeatured: (id, data) => api.post(`/services/${id}/mark-featured`, data),
  unmarkFeatured: (id) => api.post(`/services/${id}/unmark-featured`),
  markBestseller: (id, data) => api.post(`/services/${id}/mark-bestseller`, data),
  markAsNew: (id, data) => api.post(`/services/${id}/mark-new`, data),
  getFAQ: (id, params) => api.get(`/services/${id}/faq`, { params }),
  addFAQ: (id, data) => api.post(`/services/${id}/faq/add`, data),
  updateFAQ: (id, faqId, data) => api.put(`/services/${id}/faq/${faqId}`, data),
  deleteFAQ: (id, faqId) => api.delete(`/services/${id}/faq/${faqId}`),
  search: (data) => api.post('/services/search/query', data),
  filterServices: (data) => api.post('/services/search/filter', data),
  getByPriceRange: (minPrice, maxPrice, params) => api.get(`/services/price-range/${minPrice}/${maxPrice}`, { params }),
  getByDuration: (duration, params) => api.get(`/services/duration/${duration}`, { params }),
  bulkCreate: (data) => api.post('/services/bulk/create', data),
  bulkUpdate: (data) => api.post('/services/bulk/update', data),
  bulkDelete: (data) => api.post('/services/bulk/delete', data),
  bulkApplyDiscount: (data) => api.post('/services/bulk/discount', data),
  exportCSV: (params) => api.get('/services/export/csv', { params, responseType: 'blob' }),
  exportJSON: (params) => api.get('/services/export/json', { params, responseType: 'blob' }),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/services/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getPopular: (params) => api.get('/services/recommendations/popular', { params }),
  getTop: (params) => api.get('/services/recommendations/top', { params }),
  getTrending: (params) => api.get('/services/recommendations/trending', { params }),
  getPersonalizedRecommendations: (params) => api.get('/services/recommendations/personalized', { params }),
  getInventory: (id) => api.get(`/services/${id}/inventory`),
  updateInventory: (id, data) => api.put(`/services/${id}/inventory`, data),
  getLowStockAlerts: (params) => api.get('/services/inventory/alerts/low-stock', { params }),
  getAvailableSlotsForService: (data) => api.post('/services/slots/available', data),
  getEmployeeSlots: (id, employeeId, data) => api.post(`/services/${id}/employee/${employeeId}/slots`, data),
  checkSlotAvailability: (data) => api.post('/services/slots/check', data),
  generateReport: (data) => api.post('/services/report/generate', data),
  getMonthlyReport: (month, year) => api.get(`/services/report/monthly/${month}/${year}`),
  getPerformanceReport: (params) => api.get('/services/report/performance', { params }),
  exportReport: (params) => api.get('/services/report/export', { params, responseType: 'blob' }),
  getSettings: () => api.get('/services/settings/config'),
  updateSettings: (data) => api.put('/services/settings/config', data),
  getBookingSettings: () => api.get('/services/settings/booking'),
  updateBookingSettings: (data) => api.put('/services/settings/booking', data)
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  createIntent: (data) => api.post('/payments/intent', data),
  createPublicIntent: (data) => api.post('/payments/intent/public', data),
  process: (data) => api.post('/payments/process', data),
  processPublic: (data) => api.post('/payments/process/public', data),
  confirm: (paymentId, data) => api.post(`/payments/${paymentId}/confirm`, data),
  getDetails: (id) => api.get(`/payments/${id}`),
  getStatus: (id) => api.get(`/payments/${id}/status`),
  getReceipt: (id) => api.get(`/payments/${id}/receipt`),
  downloadReceipt: (id) => api.get(`/payments/${id}/receipt/download`, { responseType: 'blob' }),
  getHistory: (params) => api.get('/payments/history/all', { params }),
  getHistoryByBooking: (bookingId, params) => api.get(`/payments/booking/${bookingId}/history`, { params }),
  getHistoryByCustomer: (customerId, params) => api.get(`/payments/customer/${customerId}/history`, { params }),
  getHistoryByEmployee: (employeeId, params) => api.get(`/payments/employee/${employeeId}/history`, { params }),
  getRecent: (params) => api.get('/payments/recent/list', { params }),
  refund: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),
  partialRefund: (paymentId, data) => api.post(`/payments/${paymentId}/refund/partial`, data),
  getRefundStatus: (paymentId) => api.get(`/payments/${paymentId}/refund/status`),
  getRefundHistory: (paymentId, params) => api.get(`/payments/${paymentId}/refund/history`, { params }),
  cancelRefund: (refundId, data) => api.post(`/payments/${refundId}/cancel-refund`, data),
  getPaymentMethods: (params) => api.get('/payments/methods/list', { params }),
  addPaymentMethod: (data) => api.post('/payments/methods/add', data),
  setDefaultPaymentMethod: (methodId, data) => api.post(`/payments/methods/${methodId}/set-default`, data),
  deletePaymentMethod: (methodId, data) => api.delete(`/payments/methods/${methodId}`, { data }),
  updatePaymentMethod: (methodId, data) => api.put(`/payments/methods/${methodId}`, data),
  validateCoupon: (data) => api.post('/payments/coupons/validate', data),
  applyCoupon: (data) => api.post('/payments/coupons/apply', data),
  createInvoice: (data) => api.post('/payments/invoices/create', data),
  getInvoices: (params) => api.get('/payments/invoices/list', { params }),
  getInvoiceById: (id) => api.get(`/payments/invoices/${id}`),
  downloadInvoice: (id) => api.get(`/payments/invoices/${id}/download`, { responseType: 'blob' }),
  createReceipt: (data) => api.post('/payments/receipts/create', data),
  getReceipts: (params) => api.get('/payments/receipts/list', { params }),
  downloadReceiptFile: (id) => api.get(`/payments/receipts/${id}/download`, { responseType: 'blob' })
};

export const reviewAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getByBooking: (bookingId, params) => api.get(`/reviews/booking/${bookingId}`, { params }),
  getByService: (serviceId, params) => api.get(`/reviews/service/${serviceId}`, { params }),
  getByEmployee: (employeeId, params) => api.get(`/reviews/employee/${employeeId}`, { params }),
  getAverageRating: () => api.get('/reviews/rating/average'),
  getTopRated: (params) => api.get('/reviews/top-rated', { params }),
  getRecent: (params) => api.get('/reviews/recent', { params }),
  search: (params) => api.get('/reviews/search', { params }),
  filter: (params) => api.get('/reviews/filter', { params }),
  helpful: (id, data) => api.post(`/reviews/${id}/helpful`, data),
  unhelpful: (id) => api.post(`/reviews/${id}/unhelpful`),
  reportReview: (id, data) => api.post(`/reviews/${id}/report`, data),
  respond: (id, data) => api.post(`/reviews/${id}/respond`, data)
};

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getSchedule: (id, params) => api.get(`/employees/${id}/schedule`, { params }),
  setAvailability: (id, data) => api.post(`/employees/${id}/availability`, data),
  getStats: () => api.get('/employees/my-stats'),
  getAppointmentStats: (params) => api.get('/employees/appointment-stats', { params }),
  getSatisfactionStats: (params) => api.get('/employees/satisfaction-stats', { params }),
  getNoShowRate: (params) => api.get('/employees/no-show-rate', { params }),
  exportSchedule: (params) => api.get('/employees/export/schedule', { params, responseType: 'blob' }),
  exportEarnings: (params) => api.get('/employees/export/earnings', { params, responseType: 'blob' }),
  exportPerformance: (params) => api.get('/employees/export/performance', { params, responseType: 'blob' }),
  getMyShifts: () => api.get('/employees/my-shifts'),
  swapShift: (data) => api.post('/employees/shift-swap', data),
  requestShiftChange: (data) => api.post('/employees/shift-change-request', data),
  getSettings: () => api.get('/employees/settings'),
  updateSettings: (data) => api.put('/employees/settings', data),
  getNotificationPreferences: () => api.get('/employees/settings/notifications'),
  updateNotificationPreferences: (data) => api.put('/employees/settings/notifications', data),
  getPerformanceReview: (id, params) => api.get(`/employees/${id}/performance-review`, { params }),
  getCommissionData: (id, params) => api.get(`/employees/${id}/commission`, { params }),
  getCertifications: (id, params) => api.get(`/employees/${id}/certifications`, { params }),
  addCertification: (id, data) => api.post(`/employees/${id}/certifications`, data),
  removeCertification: (id, certId) => api.delete(`/employees/${id}/certifications/${certId}`),
  getTrainingPrograms: (params) => api.get('/employees/training', { params }),
  enrollTraining: (trainingId, data) => api.post(`/employees/training/${trainingId}/enroll`, data),
  completeTraining: (trainingId, data) => api.post(`/employees/training/${trainingId}/complete`, data),
  getReviews: (id, params) => api.get(`/employees/${id}/reviews`, { params }),
  getGoals: (id, params) => api.get(`/employees/${id}/goals`, { params }),
  updateGoals: (id, data) => api.put(`/employees/${id}/goals`, data),
  search: (params) => api.get('/employees/search', { params }),
  filter: (params) => api.get('/employees/filter', { params }),
  bulkUpdate: (data) => api.post('/employees/bulk/update', data)
};

export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  getByDate: (date, params) => api.get(`/appointments/date/${date}`, { params }),
  getByEmployee: (employeeId, params) => api.get(`/appointments/employee/${employeeId}`, { params }),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
  cancel: (id, data) => api.post(`/appointments/${id}/cancel`, data),
  complete: (id) => api.post(`/appointments/${id}/complete`),
  getStats: (params) => api.get('/appointments/stats', { params }),
  getUpcoming: (params) => api.get('/appointments/upcoming', { params }),
  getCompleted: (params) => api.get('/appointments/completed', { params }),
  getCancelled: (params) => api.get('/appointments/cancelled', { params })
};

// Simple cache for salon info to prevent duplicate requests
let salonInfoCache = null;
let salonInfoCacheTime = null;
let salonInfoCachePromise = null; // Track ongoing requests
const SALON_INFO_CACHE_TTL = 30000; // 30 seconds

// Simple cache for services to prevent duplicate requests
let servicesCache = null;
let servicesCacheTime = null;
let servicesCachePromise = null; // Track ongoing requests
const SERVICES_CACHE_TTL = 30000; // 30 seconds

// Simple cache for widget config to prevent duplicate requests
let widgetConfigCache = null;
let widgetConfigCacheTime = null;
let widgetConfigCachePromise = null; // Track ongoing requests
const WIDGET_CONFIG_CACHE_TTL = 30000; // 30 seconds

export const salonAPI = {
  getDashboard: () => api.get('/salon/dashboard'),
  getInfo: async (forceRefresh = false) => {
    // Return cached data if available and not expired
    if (!forceRefresh && salonInfoCache && salonInfoCacheTime) {
      const now = Date.now();
      if (now - salonInfoCacheTime < SALON_INFO_CACHE_TTL) {
        return salonInfoCache;
      }
    }
    
    // If there's already an ongoing request, wait for it instead of making a new one
    if (salonInfoCachePromise && !forceRefresh) {
      return salonInfoCachePromise;
    }
    
    // Fetch new data
    salonInfoCachePromise = (async () => {
      try {
        const response = await api.get('/salon/info');
        salonInfoCache = response;
        salonInfoCacheTime = Date.now();
        salonInfoCachePromise = null; // Clear promise after completion
        return response;
      } catch (error) {
        salonInfoCachePromise = null; // Clear promise on error
        // If error, return cached data if available
        if (salonInfoCache) {
          return salonInfoCache;
        }
        throw error;
      }
    })();
    
    return salonInfoCachePromise;
  },
  clearInfoCache: () => {
    salonInfoCache = null;
    salonInfoCacheTime = null;
  },
  update: (data) => {
    salonAPI.clearInfoCache(); // Clear cache on update
    return api.put('/salon/update', data);
  },
  getServices: () => api.get('/salon/services'),
  getBookings: (params) => api.get('/salon/bookings', { params }),
  getStats: () => api.get('/salon/stats'),

  // Success Metrics / Analytics
  getSuccessMetrics: (period = '30d') => api.get('/salon/analytics/success-metrics', { params: { period } }),
  getBookingTrends: (period = '30d') => api.get('/salon/analytics/booking-trends', { params: { period } }),
  getRevenueBreakdown: (period = '30d') => api.get('/salon/analytics/revenue-breakdown', { params: { period } }),
  getGoals: () => api.get('/salon/analytics/goals'),
  updateGoals: (goals) => api.post('/salon/analytics/goals', goals)
};

export const widgetAPI = {
  getConfig: async (forceRefresh = false) => {
    // Return cached data if available and not expired
    if (!forceRefresh && widgetConfigCache && widgetConfigCacheTime) {
      const now = Date.now();
      if (now - widgetConfigCacheTime < WIDGET_CONFIG_CACHE_TTL) {
        return widgetConfigCache;
      }
    }
    
    // If there's already an ongoing request, wait for it instead of making a new one
    if (widgetConfigCachePromise && !forceRefresh) {
      return widgetConfigCachePromise;
    }
    
    // Fetch new data
    widgetConfigCachePromise = (async () => {
      try {
        const response = await api.get('/widget/config');
        widgetConfigCache = response;
        widgetConfigCacheTime = Date.now();
        widgetConfigCachePromise = null; // Clear promise after completion
        return response;
      } catch (error) {
        widgetConfigCachePromise = null; // Clear promise on error
        // If error, return cached data if available
        if (widgetConfigCache) {
          return widgetConfigCache;
        }
        throw error;
      }
    })();
    
    return widgetConfigCachePromise;
  },
  updateConfig: (data) => {
    // Clear cache on update
    widgetConfigCache = null;
    widgetConfigCacheTime = null;
    widgetConfigCachePromise = null;
    return api.put('/widget/config', data);
  },
  getPublicConfig: (studioId) => api.get(`/widget/public/${studioId}`),
  getEmbedCode: () => api.get('/widget/embed-code')
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard'),
  getRecentBookings: (params) => api.get('/dashboard/recent-bookings', { params }),
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
  generateReport: (data) => api.post('/dashboard/report', data),
  exportData: (params) => api.get('/dashboard/export', { params, responseType: 'blob' }),
  getEmployeeStats: () => api.get('/dashboard/employee-stats'),
  getRevenueByPeriod: (params) => api.get('/dashboard/revenue-by-period', { params }),
  getCustomerGrowthForecast: (params) => api.get('/dashboard/customer-growth', { params })
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSystemHealth: () => api.get('/admin/system/health'),
  getSystemMetrics: (params) => api.get('/admin/system/metrics', { params }),
  triggerBackup: (data) => api.post('/admin/system/backup', data),
  restoreBackup: (data) => api.post('/admin/system/restore', data),
  getBackupHistory: (params) => api.get('/admin/system/backup-history', { params }),
  enableMaintenanceMode: (data) => api.post('/admin/system/maintenance/enable', data),
  disableMaintenanceMode: () => api.post('/admin/system/maintenance/disable')
};

export const ceoAPI = {
  getDashboard: () => api.get('/ceo/dashboard'),
  getStats: () => api.get('/ceo/stats'),
  getAnalytics: (params) => api.get('/ceo/analytics', { params }),
  getFinancials: (params) => api.get('/ceo/financials', { params }),
  getReports: (params) => api.get('/ceo/reports', { params }),
  generateCustomReport: (data) => api.post('/ceo/reports/generate', data),
  // User Management
  getUsers: (params) => api.get('/ceo/users', { params }),
  banUser: (userId) => api.post(`/ceo/users/${userId}/ban`),
  unbanUser: (userId) => api.post(`/ceo/users/${userId}/unban`),
  impersonateUser: (userId) => api.post('/ceo/users/impersonate', { userId }),
  // Customer/Business Management
  getCustomers: (params) => api.get('/ceo/customers', { params }),
  getBusinesses: (params) => api.get('/ceo/businesses', { params }),
  createBusiness: (data) => api.post('/ceo/businesses', data),
  updateBusiness: (id, data) => api.put(`/ceo/businesses/${id}`, data),
  deleteBusiness: (id) => api.delete(`/ceo/businesses/${id}`),
  suspendBusiness: (id) => api.post(`/ceo/businesses/${id}/suspend`),
  reactivateBusiness: (id) => api.post(`/ceo/businesses/${id}/reactivate`),
  // Subscriptions
  getSubscriptions: (params) => api.get('/ceo/subscriptions', { params }),
  getSubscriptionStats: () => api.get('/ceo/subscriptions/stats'),
  toggleSalonStatus: (salonId, data) => api.patch(`/ceo/subscriptions/${salonId}/toggle`, data),
  updateSubscriptionStatus: (salonId, data) => api.patch(`/ceo/subscriptions/${salonId}/status`, data),
  // Error Logs
  getErrorLogs: (params) => api.get('/ceo/errors', { params }),
  resolveError: (errorId, data) => api.patch(`/ceo/errors/${errorId}/resolve`, data),
  createErrorLog: (data) => api.post('/ceo/errors', data),
  // System Control
  getSystemStatus: () => api.get('/ceo/system/status'),
  getServiceStatus: (serviceId) => api.get(`/ceo/system/status/${serviceId}`),
  startService: (serviceId) => api.post(`/ceo/system/start/${serviceId}`),
  stopService: (serviceId) => api.post(`/ceo/system/stop/${serviceId}`),
  startAllServices: () => api.post('/ceo/system/start-all'),
  stopAllServices: () => api.post('/ceo/system/stop-all'),
  // Settings
  getSettingsFeatureFlags: () => api.get('/ceo/settings/features'),
  toggleFeature: (featureName, enabled) => api.post('/ceo/settings/features/toggle', { featureName, enabled }),
  getSettings: () => api.get('/ceo/settings'),
  updateSettings: (data) => api.put('/ceo/settings', data),
  getHealthStatus: () => api.get('/ceo/system/health'),
  getCEOStats: () => api.get('/ceo/system/stats'),
  toggleMaintenanceMode: (enabled) => api.post('/ceo/system/maintenance', { enabled }),
  triggerSystemBackup: (data) => api.post('/ceo/system/backup', data),
  importData: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ceo/data/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  cleanupOldData: (data) => api.post('/ceo/data/cleanup', data),

  // ==================== ANALYTICS ====================
  getAnalyticsOverview: (timeRange) => api.get('/ceo/analytics/overview', { params: { timeRange } }),
  getRevenueChart: (timeRange) => api.get('/ceo/analytics/revenue-chart', { params: { timeRange } }),
  getCustomerGrowth: (timeRange) => api.get('/ceo/analytics/customer-growth', { params: { timeRange } }),
  getCohortAnalysis: () => api.get('/ceo/analytics/cohorts'),
  getChurnAnalysis: () => api.get('/ceo/analytics/churn'),
  getAtRiskStudios: () => api.get('/ceo/analytics/at-risk'),

  // ==================== EMAIL CAMPAIGNS ====================
  getCampaigns: (params) => api.get('/ceo/email/campaigns', { params }),
  createCampaign: (data) => api.post('/ceo/email/campaigns', data),
  sendCampaign: (campaignId) => api.post(`/ceo/email/campaigns/${campaignId}/send`),
  deleteCampaign: (campaignId) => api.delete(`/ceo/email/campaigns/${campaignId}`),
  getCampaignDetails: (campaignId) => api.get(`/ceo/email/campaigns/${campaignId}`),
  cancelCampaign: (campaignId) => api.post(`/ceo/email/campaigns/${campaignId}/cancel`),
  getEmailTemplates: () => api.get('/ceo/email/templates'),
  getCampaignStats: (params) => api.get('/ceo/email/stats', { params }),

  // ==================== PAYMENTS ====================
  getTransactions: (params) => api.get('/ceo/payments/transactions', { params }),
  getPaymentOverview: (dateRange) => api.get('/ceo/payments/overview', { params: { dateRange } }),
  getTransactionDetails: (transactionId) => api.get(`/ceo/payments/transactions/${transactionId}`),
  processRefund: (transactionId, data) => api.post(`/ceo/payments/transactions/${transactionId}/refund`, data),
  getPayouts: () => api.get('/ceo/payments/payouts'),
  getRevenueByPlan: () => api.get('/ceo/payments/by-plan'),

  // ==================== SUPPORT TICKETS ====================
  getTickets: (params) => api.get('/ceo/support/tickets', { params }),
  createTicket: (data) => api.post('/ceo/support/tickets', data),
  getTicketDetails: (ticketId) => api.get(`/ceo/support/tickets/${ticketId}`),
  updateTicketStatus: (ticketId, status) => api.patch(`/ceo/support/tickets/${ticketId}`, { status }),
  replyToTicket: (ticketId, data) => api.post(`/ceo/support/tickets/${ticketId}/reply`, data),
  getTicketStats: (params) => api.get('/ceo/support/tickets/stats', { params }),

  // ==================== AUDIT LOG ====================
  getAuditLogs: (params) => api.get('/ceo/audit/logs', { params }),
  getAuditLogDetails: (logId) => api.get(`/ceo/audit/logs/${logId}`),
  getAuditStats: (dateRange) => api.get('/ceo/audit/stats', { params: { dateRange } }),
  getSecurityAlerts: () => api.get('/ceo/audit/alerts'),
  exportAuditLogs: (params) => api.get('/ceo/audit/export', { params, responseType: 'blob' }),

  // ==================== FEATURE FLAGS ====================
  getFeatureFlags: (params) => api.get('/ceo/feature-flags', { params }),
  createFlag: (data) => api.post('/ceo/feature-flags', data),
  getFeatureFlagDetails: (flagId) => api.get(`/ceo/feature-flags/${flagId}`),
  updateFlag: (flagId, data) => api.patch(`/ceo/feature-flags/${flagId}`, data),
  toggleFlag: (flagId) => api.post(`/ceo/feature-flags/${flagId}/toggle`),
  deleteFlag: (flagId) => api.delete(`/ceo/feature-flags/${flagId}`),
  checkFeatureFlag: (flagKey, salonId) => api.get(`/ceo/feature-flags/check/${flagKey}/${salonId}`),

  // ==================== BACKUPS ====================
  getAllBackups: (params) => api.get('/ceo/backups', { params }),
  createBackup: (data) => api.post('/ceo/backups', data),
  getBackupDetails: (backupId) => api.get(`/ceo/backups/${backupId}`),
  deleteBackup: (backupId) => api.delete(`/ceo/backups/${backupId}`),
  restoreBackup: (backupId, data) => api.post(`/ceo/backups/${backupId}/restore`, data),
  getBackupSchedule: () => api.get('/ceo/backups/schedule'),
  updateBackupSchedule: (data) => api.put('/ceo/backups/schedule', data),
  downloadBackup: (backupId) => api.get(`/ceo/backups/${backupId}/download`, { responseType: 'blob' })
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put('/settings', { key, value }),
  getBusinessSettings: () => api.get('/settings/business'),
  updateBusinessSettings: (data) => api.put('/settings/business', data),
  getNotificationSettings: () => api.get('/settings/notifications'),
  updateNotificationSettings: (data) => api.put('/settings/notifications', data),
  getAccountStatus: () => api.get('/settings/account-status'),
  getPaymentSettings: () => api.get('/settings/payment'),
  updatePaymentSettings: (data) => api.put('/settings/payment', data),
  getEmailSettings: () => api.get('/settings/email'),
  updateEmailSettings: (data) => api.put('/settings/email', data)
};

export const emailAPI = {
  sendConfirmation: (data) => api.post('/email/confirmation', data),
  sendReminder: (bookingId) => api.post(`/email/reminder/${bookingId}`),
  sendReceipt: (paymentId) => api.post(`/email/receipt/${paymentId}`),
  sendNewsletter: (data) => api.post('/email/newsletter', data),
  sendSpecialOffer: (data) => api.post('/email/special-offer', data),
  verifyAddress: (data) => api.post('/email/verify', data),
  checkDeliverability: (email) => api.get(`/email/deliverability?email=${email}`),
  getScheduled: (params) => api.get('/email/scheduled', { params }),
  cancelScheduled: (id) => api.delete(`/email/scheduled/${id}`),
  testBulk: (data) => api.post('/email/test-bulk', data),
  getTemplates: (params) => api.get('/email/templates', { params }),
  createTemplate: (data) => api.post('/email/templates', data),
  updateTemplate: (id, data) => api.put(`/email/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/email/templates/${id}`)
};

export const errorAPI = {
  getAll: (params) => api.get('/errors', { params }),
  getById: (id) => api.get(`/errors/${id}`),
  log: (errorData) => api.post('/errors', errorData),
  delete: (id) => api.delete(`/errors/${id}`),
  clear: () => api.post('/errors/clear'),
  export: (params) => api.get('/errors/export', { params, responseType: 'blob' })
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.message) return error.message;
  return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
};

export const getSuccessData = (response) => {
  return response.data?.data || response.data;
};

export const formatError = (error) => {
  const message = getErrorMessage(error);
  if (error.response?.status === 401) return 'Please log in again';
  if (error.response?.status === 403) return 'You do not have permission';
  if (error.response?.status === 404) return 'Resource not found';
  if (error.response?.status === 429) return 'Too many requests. Try again later';
  if (error.response?.status >= 500) return 'Server error. Try again later';
  return message;
};

// ==================== SUBSCRIPTION API ====================
export const subscriptionAPI = {
  // Get available plans (public)
  getPlans: () => api.get('/subscriptions/plans'),

  // Create Stripe checkout session (planId: starter|professional|enterprise, billing: monthly|yearly)
  createCheckout: (planId, billing = 'monthly') => api.post('/subscriptions/checkout', { planId, billing }),

  // Create billing portal session
  createPortal: () => api.post('/subscriptions/portal'),

  // Get current subscription status
  getStatus: () => api.get('/subscriptions/status'),
};

export default api;
