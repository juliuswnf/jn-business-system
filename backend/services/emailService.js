import nodemailer from 'nodemailer';
import EmailQueue from '../models/EmailQueue.js';
import EmailLog from '../models/EmailLog.js';
import logger from '../utils/logger.js';

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
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
    }
  });
};

// ==================== SEND EMAIL ====================

export const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'JN Automation <noreply@jn-automation.com>',
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

    logger.log(`✅ Email sent to: ${emailData.to}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('❌ Email send error:', error);

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
    // ? RACE CONDITION FIX - Load fresh immutable snapshot with .lean()
    // This prevents "booking modified after email queued" bug (GDPR violation)
    const bookingSnapshot = await booking.constructor
      .findById(booking._id)
      .populate('salonId serviceId')
      .lean(); // Immutable snapshot - cannot be modified

    if (!bookingSnapshot) {
      throw new Error('Booking not found');
    }

    const salon = bookingSnapshot.salonId;
    const service = bookingSnapshot.serviceId;

    // Validate email recipient (prevent sending to wrong email after update)
    if (!bookingSnapshot.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingSnapshot.customerEmail)) {
      throw new Error('Invalid customer email address');
    }

    // Get email template
    const template = salon.getEmailTemplate('confirmation', bookingSnapshot.language);
    if (!template) {
      throw new Error('Confirmation email template not found');
    }

    // Format date and time
    const bookingDate = new Date(bookingSnapshot.bookingDate);
    const dateStr = bookingDate.toLocaleDateString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US');
    const timeStr = bookingDate.toLocaleTimeString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US', {
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

    // Queue email with audit trail
    await EmailQueue.create({
      to: bookingSnapshot.customerEmail,
      subject,
      body,
      type: 'booking_confirmation',
      bookingId: bookingSnapshot._id,
      priority: 'high',
      language: bookingSnapshot.language,
      // ? Audit metadata for GDPR compliance
      metadata: {
        customerName: bookingSnapshot.customerName,
        salonId: salon._id.toString(),
        capturedAt: new Date()
      }
    });

    logger.log(`✅ Confirmation email queued for: ${bookingSnapshot.customerEmail} (Booking: ${bookingSnapshot._id})`);

    return { success: true };
  } catch (error) {
    logger.error('❌ SendBookingConfirmation Error:', error);
    throw error;
  }
};

// ==================== SEND BOOKING REMINDER ====================

export const sendBookingReminder = async (booking) => {
  try {
    // ? RACE CONDITION FIX - Load immutable snapshot
    const bookingSnapshot = await booking.constructor
      .findById(booking._id)
      .populate('salonId serviceId')
      .lean();

    if (!bookingSnapshot) {
      throw new Error('Booking not found');
    }

    const salon = bookingSnapshot.salonId;
    const service = bookingSnapshot.serviceId;

    // Validate email recipient
    if (!bookingSnapshot.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingSnapshot.customerEmail)) {
      throw new Error('Invalid customer email address');
    }

    // Get email template
    const template = salon.getEmailTemplate('reminder', bookingSnapshot.language);
    if (!template) {
      throw new Error('Reminder email template not found');
    }

    // Format date and time
    const bookingDate = new Date(bookingSnapshot.bookingDate);
    const dateStr = bookingDate.toLocaleDateString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US');
    const timeStr = bookingDate.toLocaleTimeString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US', {
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
      customer_name: bookingSnapshot.customerName
    });

    const body = replacePlaceholders(template.body, {
      salon_name: salon.name,
      customer_name: bookingSnapshot.customerName,
      service_name: service.name,
      booking_date: dateStr,
      booking_time: timeStr,
      salon_address: addressStr
    });

    // Queue email with audit trail
    await EmailQueue.create({
      to: bookingSnapshot.customerEmail,
      subject,
      body,
      type: 'booking_reminder',
      bookingId: bookingSnapshot._id,
      priority: 'high',
      language: bookingSnapshot.language,
      metadata: {
        customerName: bookingSnapshot.customerName,
        salonId: salon._id.toString(),
        capturedAt: new Date()
      }
    });

    logger.log(`✅ Reminder email queued for: ${bookingSnapshot.customerEmail} (Booking: ${bookingSnapshot._id})`);

    return { success: true };
  } catch (error) {
    logger.error('� SendBookingReminder Error:', error);
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
      logger.warn(`⚠️ Google Review URL not configured for salon: ${salon.name}`);
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

    logger.log(`✅ Review request email queued for: ${booking.customerEmail}`);

    return { success: true };
  } catch (error) {
    logger.error('❌ SendReviewRequest Error:', error);
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

    logger.log(`📧 Processing ${emails.length} emails from queue`);

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
    logger.error('❌ ProcessEmailQueue Error:', error);
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

// ==================== SEND WELCOME/ONBOARDING EMAIL ====================

export const sendWelcomeEmail = async (user, salon) => {
  try {
    const dashboardUrl = process.env.FRONTEND_URL || 'https://app.jn-automation.de';
    const firstName = user.name?.split(' ')[0] || user.name || 'dort';

    const emailData = {
      to: user.email,
      subject: '🎉 Willkommen bei JN Automation - Deine nächsten Schritte',
      type: 'welcome',
      body: `Willkommen bei JN Automation, ${firstName}!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Willkommen bei JN!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Dein Buchungssystem ist bereit</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px;">

    <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">
      Hallo ${firstName},
    </p>

    <p style="color: #4b5563; margin: 0 0 30px 0;">
      Herzlichen Glückwunsch! Dein Account ist aktiviert und du hast <strong>30 Tage kostenlos</strong> alle Features zur Verfügung.
      Lass uns gemeinsam dein Studio einrichten.
    </p>

    <!-- Setup Checklist -->
    <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h2 style="color: #166534; margin: 0 0 16px 0; font-size: 18px;">
        ✅ Deine Setup-Checkliste
      </h2>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #22c55e; font-size: 18px; margin-right: 10px;">1.</span>
          <div>
            <strong style="color: #1f2937;">Services anlegen</strong>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Haarschnitt, Färben, Styling — mit Preisen und Dauer</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #22c55e; font-size: 18px; margin-right: 10px;">2.</span>
          <div>
            <strong style="color: #1f2937;">Öffnungszeiten festlegen</strong>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Wann können Kunden buchen?</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #22c55e; font-size: 18px; margin-right: 10px;">3.</span>
          <div>
            <strong style="color: #1f2937;">Buchungswidget einbinden</strong>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Kopiere den Code auf deine Website</p>
          </div>
        </div>
      </div>

      <div>
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #22c55e; font-size: 18px; margin-right: 10px;">4.</span>
          <div>
            <strong style="color: #1f2937;">Erste Buchung testen</strong>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Buche selbst einen Termin als Test</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Zum Dashboard →
      </a>
    </div>

    <!-- Video Tutorial -->
    <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 10px;">🎬</div>
      <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">Video-Tutorial: Schnellstart in 5 Minuten</h3>
      <p style="color: #3b82f6; margin: 0 0 16px 0; font-size: 14px;">
        Schau dir unser kurzes Einrichtungsvideo an
      </p>
      <a href="${dashboardUrl}/help/getting-started" style="color: #2563eb; font-weight: 600; text-decoration: none;">
        Tutorial ansehen →
      </a>
    </div>

    <!-- Support Info -->
    <div style="background: #faf5ff; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h3 style="color: #7c3aed; margin: 0 0 12px 0; font-size: 16px;">💬 Brauchst du Hilfe?</h3>
      <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
        Unser Team ist für dich da — per Chat oder E-Mail.
      </p>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <a href="mailto:support@jn-automation.de" style="color: #7c3aed; text-decoration: none; font-size: 14px;">
          📧 support@jn-automation.de
        </a>
      </div>
    </div>

    <!-- Trial Reminder -->
    <div style="border: 2px dashed #e5e7eb; border-radius: 12px; padding: 20px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        <strong style="color: #1f2937;">Deine Testphase:</strong> 30 Tage kostenlos<br>
        Keine Kreditkarte erforderlich • Jederzeit kündbar
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background: #1f2937; padding: 30px; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
      Bei Fragen antworte einfach auf diese E-Mail.
    </p>
    <p style="color: #6b7280; margin: 0; font-size: 12px;">
      JN Automation • Das Buchungssystem für Salons & Studios<br>
      <a href="${dashboardUrl}" style="color: #6b7280;">jn-automation.de</a>
    </p>
  </div>

</body>
</html>
      `
    };

    await sendEmail(emailData);
    logger.log(`✅ Welcome email sent to: ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error('❌ Welcome email error:', error);
    // Don't throw - welcome email failure shouldn't block registration
    return { success: false, error: error.message };
  }
};

// ==================== EXPORT ====================

export default {
  sendEmail,
  sendBookingConfirmation,
  sendBookingReminder,
  sendReviewRequest,
  sendWelcomeEmail,
  processEmailQueue
};
