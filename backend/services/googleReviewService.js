import EmailQueue from '../models/EmailQueue.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

/**
 * Google Review Service - Automated Review Request Emails
 * Sends review request emails after booking completion
 */

// ==================== SEND REVIEW REQUEST EMAIL ====================

export const sendReviewRequestEmail = async (booking) => {
  try {
    // Populate booking with salon details
    await booking.populate('salonId');

    const salon = booking.salonId;

    // Check if Google review URL is configured
    if (!salon.googleReviewUrl) {
      logger.warn(`⚠️ Google Review URL not configured for salon: ${salon.name}`);
      return { success: false, message: 'Google review URL not configured' };
    }

    // Get email template
    const template = salon.getEmailTemplate('review', booking.language);
    if (!template) {
      logger.error(`❌ Review email template not found for language: ${booking.language}`);
      return { success: false, message: 'Email template not found' };
    }

    // Replace placeholders
    const subject = replacePlaceholders(template.subject, {
      salon_name: salon.name,
      customer_name: booking.customerName
    });

    const body = replacePlaceholders(template.body, {
      salon_name: salon.name,
      customer_name: booking.customerName,
      google_review_url: salon.googleReviewUrl,
      salon_email: salon.email,
      salon_phone: salon.phone || ''
    });

    // Queue email
    await EmailQueue.create({
      to: booking.customerEmail,
      subject,
      body,
      type: 'review_request',
      bookingId: booking._id,
      priority: 'normal',
      language: booking.language
    });

    logger.log(`✅ Review request email queued for: ${booking.customerEmail}`);

    return { success: true, message: 'Review email queued' };
  } catch (error) {
    logger.error('❌ SendReviewRequestEmail Error:', error);
    throw error;
  }
};

// ==================== PROCESS COMPLETED BOOKINGS ====================

export const processCompletedBookings = async () => {
  try {
    // Get bookings that need review email
    const bookings = await Booking.getNeedingReviewEmail();

    logger.log(`🔍 Found ${bookings.length} bookings needing review email`);

    for (const booking of bookings) {
      try {
        await sendReviewRequestEmail(booking);
        await booking.markEmailSent('review');
      } catch (error) {
        logger.error(`❌ Failed to send review email for booking ${booking._id}:`, error);
      }
    }

    return {
      success: true,
      processed: bookings.length
    };
  } catch (error) {
    logger.error('❌ ProcessCompletedBookings Error:', error);
    throw error;
  }
};

// ==================== HELPER: REPLACE PLACEHOLDERS ====================

const replacePlaceholders = (text, data) => {
  let result = text;

  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  return result;
};

// ==================== EXPORT ====================

export default {
  sendReviewRequestEmail,
  processCompletedBookings
};
