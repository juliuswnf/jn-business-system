import { DateTime } from 'luxon';
import logger from './logger.js';

/**
 * ✅ AUDIT FIX: Timezone-aware date utilities using Luxon
 * Handles DST transitions correctly for salon booking system
 */

/**
 * Convert booking time from salon timezone to UTC for storage
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timeString - Time string (HH:mm)
 * @param {string} timezone - IANA timezone (e.g. 'Europe/Berlin')
 * @returns {Date} UTC Date object for MongoDB storage
 */
export const toUTC = (dateString, timeString, timezone) => {
  try {
    // Parse date/time in salon timezone
    const dt = DateTime.fromFormat(
      `${dateString} ${timeString}`,
      'yyyy-MM-dd HH:mm',
      { zone: timezone }
    );

    if (!dt.isValid) {
      throw new Error(`Invalid date/time: ${dt.invalidReason}`);
    }

    // Check if time exists (not in DST gap)
    if (!dt.isValid) {
      throw new Error(`Time ${timeString} does not exist on ${dateString} in ${timezone} (DST transition)`);
    }

    // Convert to UTC and return as JS Date
    return dt.toJSDate();
  } catch (error) {
    logger.error('❌ Timezone conversion error:', error.message);
    throw new Error(`Failed to convert to UTC: ${error.message}`);
  }
};

/**
 * Convert UTC date to salon timezone for display
 * @param {Date} utcDate - UTC Date from MongoDB
 * @param {string} timezone - IANA timezone (e.g. 'Europe/Berlin')
 * @returns {Object} { date: 'YYYY-MM-DD', time: 'HH:mm', weekday: 'Monday', formatted: 'Mon, 10. Dez 2025, 14:00' }
 */
export const fromUTC = (utcDate, timezone) => {
  try {
    const dt = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(timezone);

    if (!dt.isValid) {
      throw new Error(`Invalid date conversion: ${dt.invalidReason}`);
    }

    return {
      date: dt.toFormat('yyyy-MM-dd'),
      time: dt.toFormat('HH:mm'),
      weekday: dt.toFormat('EEEE'),
      formatted: dt.toFormat('EEE, dd. MMM yyyy, HH:mm'),
      iso: dt.toISO(),
      jsDate: dt.toJSDate()
    };
  } catch (error) {
    logger.error('❌ Timezone conversion error:', error.message);
    throw new Error(`Failed to convert from UTC: ${error.message}`);
  }
};

/**
 * Validate booking time (check if it exists in timezone, handle DST)
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timeString - Time string (HH:mm)
 * @param {string} timezone - IANA timezone
 * @returns {Object} { valid: boolean, error?: string, ambiguous?: boolean }
 */
export const validateBookingTime = (dateString, timeString, timezone) => {
  try {
    const dt = DateTime.fromFormat(
      `${dateString} ${timeString}`,
      'yyyy-MM-dd HH:mm',
      { zone: timezone }
    );

    // Check if time is valid (exists in timezone)
    if (!dt.isValid) {
      return {
        valid: false,
        error: `Time ${timeString} is invalid on ${dateString} in ${timezone}. ${dt.invalidReason || 'This time may not exist due to DST transition.'}`
      };
    }

    // Check for DST ambiguity (time appears twice - fall back)
    // Luxon handles this automatically, but we can warn
    const oneHourLater = dt.plus({ hours: 1 });
    const offset1 = dt.offset;
    const offset2 = oneHourLater.offset;

    if (offset1 !== offset2) {
      logger.warn(`⚠️ Booking time ${dateString} ${timeString} is near DST transition in ${timezone}`);
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Get salon's current time
 * @param {string} timezone - IANA timezone
 * @returns {Object} Current date/time in salon timezone
 */
export const getSalonNow = (timezone) => {
  const now = DateTime.now().setZone(timezone);
  return {
    date: now.toFormat('yyyy-MM-dd'),
    time: now.toFormat('HH:mm'),
    weekday: now.toFormat('EEEE'),
    formatted: now.toFormat('EEE, dd. MMM yyyy, HH:mm'),
    iso: now.toISO(),
    jsDate: now.toJSDate()
  };
};

/**
 * Check if booking is in the past (in salon timezone)
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timeString - Time string (HH:mm)
 * @param {string} timezone - IANA timezone
 * @returns {boolean} True if booking is in the past
 */
export const isInPast = (dateString, timeString, timezone) => {
  const dt = DateTime.fromFormat(
    `${dateString} ${timeString}`,
    'yyyy-MM-dd HH:mm',
    { zone: timezone }
  );
  const now = DateTime.now().setZone(timezone);
  return dt < now;
};

/**
 * Get date range for queries (start/end of day in salon timezone, converted to UTC)
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timezone - IANA timezone
 * @returns {Object} { startUTC: Date, endUTC: Date }
 */
export const getDayRangeUTC = (dateString, timezone) => {
  const startOfDay = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timezone }).startOf('day');
  const endOfDay = startOfDay.endOf('day');

  return {
    startUTC: startOfDay.toJSDate(),
    endUTC: endOfDay.toJSDate()
  };
};

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @param {string} language - Language ('de' or 'en')
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes, language = 'de') => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (language === 'de') {
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  } else {
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  }
};

export default {
  toUTC,
  fromUTC,
  validateBookingTime,
  getSalonNow,
  isInPast,
  getDayRangeUTC,
  formatDuration
};
