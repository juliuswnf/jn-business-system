import nodemailer from 'nodemailer';
import EmailQueue from '../models/EmailQueue.js';
import EmailLog from '../models/EmailLog.js';

/**
 * Email Service - Send transactional emails
 * Supports booking confirmations, reminders, and Google review requests
 */

// ==================== EMAIL TRANSPORTER ====================

const createTransporter = () => {
  // Use SMTP or development mode
  if (process.env.NODE_ENV === 'development') {
    // Development: Log emails to console
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Production: Use SMTP
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// ==================== SEND EMAIL ====================

export const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@jn-automation.com',
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.html || emailData.body.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);

    // Log email
    await EmailLog.create({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      type: emailData.type || 'general',
      status: 'sent',
      sentAt: new Date(),
      messageId: info.messageId
    });

    console.log(`✅ Email sent to: ${emailData.to}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);

    // Log failed email
    await EmailLog.create({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      type: emailData.type || 'general',
      status: 'failed',
      error: error.message
    });

    throw error;
  }
};

// ==================== SEND BOOKING CONFIRMATION ====================

export const sendBookingConfirmation = async (booking) => {
  try {
    await booking.populate('salonId serviceId');

    const salon = booking.salonId;
    const service = booking.serviceId;

    // Get email template
    const template = salon.getEmailTemplate('confirmation', booking.language);
    if (!template) {
      throw new Error('Confirmation email template not found');
    }

    // Format date and time
    const bookingDate = new Date(booking.bookingDate);
    const dateStr = bookingDate.toLocaleDateString(booking.language === 'de' ? 'de-DE' : 'en-US');
    const timeStr = bookingDate.toLocaleTimeString(booking.language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format address
    const addressStr = salon.address 
      ? `${salon.address.street || ''}\n${salon.address.postalCode || ''} ${salon.address.city || ''}`.trim()
      : '';

    // Replace placeholders
    const subject = replacePlaceholders(template.subject, {
      salon_name: salon.name,
      customer_name: booking.customerName
    });

    const body = replacePlaceholders(template.body, {
      salon_name: salon.name,
      customer_name: booking.customerName,
      service_name: service.name,
      booking_date: dateStr,
      booking_time: timeStr,
      employee_name: 'Team', // TODO: Add employee support
      salon_address: addressStr,
      salon_email: salon.email,
      salon_phone: salon.phone || ''
    });

    // Queue email
    await EmailQueue.create({
      to: booking.customerEmail,
      subject,
      body,
      type: 'booking_confirmation',
      bookingId: booking._id,
      priority: 'high',
      language: booking.language
    });

    console.log(`✅ Confirmation email queued for: ${booking.customerEmail}`);

    return { success: true };
  } catch (error) {
    console.error('❌ SendBookingConfirmation Error:', error);
    throw error;
  }
};

// ==================== SEND BOOKING REMINDER ====================

export const sendBookingReminder = async (booking) => {
  try {
    await booking.populate('salonId serviceId');

    const salon = booking.salonId;
    const service = booking.serviceId;

    // Get email template
    const template = salon.getEmailTemplate('reminder', booking.language);
    if (!template) {
      throw new Error('Reminder email template not found');
    }

    // Format date and time
    const bookingDate = new Date(booking.bookingDate);
    const dateStr = bookingDate.toLocaleDateString(booking.language === 'de' ? 'de-DE' : 'en-US');
    const timeStr = bookingDate.toLocaleTimeString(booking.language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format address
    const addressStr = salon.address 
      ? `${salon.address.street || ''}\n${salon.address.postalCode || ''} ${salon.address.city || ''}`.trim()
      : '';

    // Replace placeholders
    const subject = replacePlaceholders(template.subject, {
      salon_name: salon.name,
      customer_name: booking.customerName
    });

    const body = replacePlaceholders(template.body, {
      salon_name: salon.name,
      customer_name: booking.customerName,
      service_name: service.name,
      booking_date: dateStr,
      booking_time: timeStr,
      salon_address: addressStr
    });

    // Queue email
    await EmailQueue.create({
      to: booking.customerEmail,
      subject,
      body,
      type: 'booking_reminder',
      bookingId: booking._id,
      priority: 'normal',
      language: booking.language
    });

    console.log(`✅ Reminder email queued for: ${booking.customerEmail}`);

    return { success: true };
  } catch (error) {
    console.error('❌ SendBookingReminder Error:', error);
    throw error;
  }
};

// ==================== SEND REVIEW REQUEST ====================

export const sendReviewRequest = async (booking) => {
  try {
    await booking.populate('salonId');

    const salon = booking.salonId;

    // Check if Google review URL is configured
    if (!salon.googleReviewUrl) {
      console.warn(`⚠️ Google Review URL not configured for salon: ${salon.name}`);
      return { success: false, message: 'Google review URL not configured' };
    }

    // Get email template
    const template = salon.getEmailTemplate('review', booking.language);
    if (!template) {
      throw new Error('Review email template not found');
    }

    // Replace placeholders
    const subject = replacePlaceholders(template.subject, {
      salon_name: salon.name,
      customer_name: booking.customerName
    });

    const body = replacePlaceholders(template.body, {
      salon_name: salon.name,
      customer_name: booking.customerName,
      google_review_url: salon.googleReviewUrl
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

    console.log(`✅ Review request email queued for: ${booking.customerEmail}`);

    return { success: true };
  } catch (error) {
    console.error('❌ SendReviewRequest Error:', error);
    throw error;
  }
};

// ==================== PROCESS EMAIL QUEUE ====================

export const processEmailQueue = async () => {
  try {
    // Get pending emails
    const emails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() }
    })
      .sort({ priority: 1, createdAt: 1 })
      .limit(10); // Process 10 at a time

    console.log(`📧 Processing ${emails.length} emails from queue`);

    for (const email of emails) {
      try {
        await sendEmail({
          to: email.to,
          subject: email.subject,
          body: email.body,
          type: email.type
        });

        email.status = 'sent';
        email.sentAt = new Date();
        await email.save();
      } catch (error) {
        email.status = 'failed';
        email.error = error.message;
        email.attempts += 1;
        await email.save();
      }
    }

    return { success: true, processed: emails.length };
  } catch (error) {
    console.error('❌ ProcessEmailQueue Error:', error);
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
  sendEmail,
  sendBookingConfirmation,
  sendBookingReminder,
  sendReviewRequest,
  processEmailQueue
};
