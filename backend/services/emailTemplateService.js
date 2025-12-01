/**
 * Email Template Service
 * Handles rendering of email templates with placeholders
 * for confirmation, reminder, and review emails
 */

/**
 * Replace placeholders in template with actual data
 * @param {String} template - Template string with {{placeholders}}
 * @param {Object} data - Data object with values
 * @returns {String} - Rendered template
 */
const replacePlaceholders = (template, data) => {
  if (!template) return '';
  
  let rendered = template;
  
  // Replace all {{placeholder}} with actual values
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    rendered = rendered.split(placeholder).join(value);
  });
  
  return rendered;
};

/**
 * Format date for email display
 * @param {Date} date - Date object
 * @param {String} language - Language code (de/en)
 * @returns {String} - Formatted date
 */
const formatDate = (date, language = 'de') => {
  const d = new Date(date);
  
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return d.toLocaleDateString(locale, options);
};

/**
 * Format time for email display
 * @param {Date} date - Date object
 * @param {String} language - Language code (de/en)
 * @returns {String} - Formatted time
 */
const formatTime = (date, language = 'de') => {
  const d = new Date(date);
  
  const options = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return d.toLocaleTimeString(locale, options);
};

/**
 * Render confirmation email
 * @param {Object} salon - Salon object
 * @param {Object} booking - Booking object
 * @param {String} language - Language code (de/en)
 * @returns {Object} - Email subject and body
 */
const renderConfirmationEmail = (salon, booking, language = 'de') => {
  const template = salon.getEmailTemplate('confirmation', language);
  
  if (!template) {
    throw new Error(`Confirmation email template not found for language: ${language}`);
  }
  
  const data = {
    customer_name: booking.customerName,
    salon_name: salon.name,
    service_name: booking.service?.name || 'Service',
    booking_date: formatDate(booking.bookingDate, language),
    booking_time: formatTime(booking.bookingDate, language),
    employee_name: salon.name, // MVP: No employee, use salon name
    salon_address: `${salon.address?.street || ''}, ${salon.address?.postalCode || ''} ${salon.address?.city || ''}`.trim(),
    salon_email: salon.email,
    salon_phone: salon.phone || '',
    booking_id: booking._id.toString()
  };
  
  return {
    subject: replacePlaceholders(template.subject, data),
    body: replacePlaceholders(template.body, data)
  };
};

/**
 * Render reminder email
 * @param {Object} salon - Salon object
 * @param {Object} booking - Booking object
 * @param {String} language - Language code (de/en)
 * @returns {Object} - Email subject and body
 */
const renderReminderEmail = (salon, booking, language = 'de') => {
  const template = salon.getEmailTemplate('reminder', language);
  
  if (!template) {
    throw new Error(`Reminder email template not found for language: ${language}`);
  }
  
  const data = {
    customer_name: booking.customerName,
    salon_name: salon.name,
    service_name: booking.service?.name || 'Service',
    booking_date: formatDate(booking.bookingDate, language),
    booking_time: formatTime(booking.bookingDate, language),
    employee_name: salon.name, // MVP: No employee, use salon name
    salon_address: `${salon.address?.street || ''}, ${salon.address?.postalCode || ''} ${salon.address?.city || ''}`.trim(),
    salon_email: salon.email,
    salon_phone: salon.phone || '',
    booking_id: booking._id.toString()
  };
  
  return {
    subject: replacePlaceholders(template.subject, data),
    body: replacePlaceholders(template.body, data)
  };
};

/**
 * Render review request email
 * @param {Object} salon - Salon object
 * @param {Object} booking - Booking object
 * @param {String} language - Language code (de/en)
 * @returns {Object} - Email subject and body
 */
const renderReviewEmail = (salon, booking, language = 'de') => {
  const template = salon.getEmailTemplate('review', language);
  
  if (!template) {
    throw new Error(`Review email template not found for language: ${language}`);
  }
  
  const data = {
    customer_name: booking.customerName,
    salon_name: salon.name,
    service_name: booking.service?.name || 'Service',
    booking_date: formatDate(booking.bookingDate, language),
    booking_time: formatTime(booking.bookingDate, language),
    google_review_url: salon.googleReviewUrl || '#',
    salon_email: salon.email,
    salon_phone: salon.phone || ''
  };
  
  return {
    subject: replacePlaceholders(template.subject, data),
    body: replacePlaceholders(template.body, data)
  };
};

/**
 * Get email language preference
 * Priority: booking language > salon default language > 'de'
 * @param {Object} salon - Salon object
 * @param {Object} booking - Booking object (optional)
 * @returns {String} - Language code
 */
const getEmailLanguage = (salon, booking = null) => {
  if (booking && booking.language) {
    return booking.language;
  }
  
  if (salon && salon.defaultLanguage) {
    return salon.defaultLanguage;
  }
  
  return 'de';
};

// ES6 Export
export default {
  replacePlaceholders,
  formatDate,
  formatTime,
  renderConfirmationEmail,
  renderReminderEmail,
  renderReviewEmail,
  getEmailLanguage
};
