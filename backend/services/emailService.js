import nodemailer from 'nodemailer';
import EmailQueue from '../models/EmailQueue.js';
import EmailLog from '../models/EmailLog.js';
import logger from '../utils/logger.js';
import { escapeRegExp } from '../utils/securityHelpers.js';

/**
 * Email Service - Send transactional emails
 * Supports booking confirmations, reminders, and Google review requests
 */

// ==================== EMAIL TRANSPORTER ====================

const createTransporter = () => {
  // Always use real SMTP (even in development)
  // This ensures emails are actually sent for testing
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
    },
    // Enable logging for debugging
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });
};

// ==================== SEND EMAIL ====================

export const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'JN Business System <noreply@jn-business-system.com>',
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.html || emailData.body.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);

    // Log email (only if companyId provided)
    if (emailData.companyId || emailData.salonId) {
      try {
        await EmailLog.create({
          companyId: emailData.companyId || emailData.salonId,
          recipientEmail: emailData.to,
          subject: emailData.subject,
          emailType: emailData.type || 'general',
          status: 'sent',
          sentAt: new Date(),
          attempts: 1
        });
      } catch (logError) {
        // Non-blocking - log error but don't fail email send
        logger.warn(`⚠️  Failed to log email: ${logError.message}`);
      }
    }

    logger.log(`✅ Email sent to: ${emailData.to}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('❌ Email send error:', error);

    // Log failed email (only if companyId provided)
    if (emailData.companyId || emailData.salonId) {
      try {
        await EmailLog.create({
          companyId: emailData.companyId || emailData.salonId,
          recipientEmail: emailData.to,
          subject: emailData.subject,
          emailType: emailData.type || 'general',
          status: 'failed',
          error: error.message,
          attempts: 1
        });
      } catch (logError) {
        // Non-blocking
        logger.warn(`⚠️  Failed to log email error: ${logError.message}`);
      }
    }

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
    const template = salon.getEmailTemplate?.('confirmation', bookingSnapshot.language);
    const firstName = bookingSnapshot.customerName?.split(' ')[0] || bookingSnapshot.customerName || 'dort';

    // Format date and time
    const bookingDate = new Date(bookingSnapshot.bookingDate);
    const dateStr = bookingDate.toLocaleDateString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = bookingDate.toLocaleTimeString(bookingSnapshot.language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format address
    const addressStr = salon.address
      ? `${salon.address.street || ''}, ${salon.address.postalCode || ''} ${salon.address.city || ''}`.trim()
      : '';

    // Default subject and body if template not found
    const subject = template
      ? replacePlaceholders(template.subject, { salon_name: salon.name, customer_name: bookingSnapshot.customerName })
      : `✅ Buchungsbestätigung - ${salon.name}`;

    const body = template
      ? replacePlaceholders(template.body, {
          salon_name: salon.name,
          customer_name: bookingSnapshot.customerName,
          service_name: service.name,
          booking_date: dateStr,
          booking_time: timeStr,
          employee_name: 'Team',
          salon_address: addressStr,
          salon_email: salon.email,
          salon_phone: salon.phone || ''
        })
      : `Hallo ${firstName},\n\nIhre Buchung wurde bestätigt.\n\nService: ${service.name}\nDatum: ${dateStr}\nUhrzeit: ${timeStr}\n\nWir freuen uns auf Sie!\n\n${salon.name}`;

    // Create HTML email template
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Buchung bestätigt!</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px;">

    <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
      Hallo ${firstName},
    </p>

    <p style="color: #4b5563; margin: 0 0 30px 0;">
      Ihre Buchung bei <strong>${salon.name}</strong> wurde erfolgreich bestätigt.
    </p>

    <!-- Booking Details Card -->
    <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 2px solid #10b981;">
      <h2 style="color: #166534; margin: 0 0 20px 0; font-size: 18px; text-align: center;">
        📅 Ihre Buchungsdetails
      </h2>

      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Service</div>
        <div style="color: #1f2937; font-size: 16px; font-weight: 600;">${service.name}</div>
      </div>

      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Datum & Uhrzeit</div>
        <div style="color: #1f2937; font-size: 16px; font-weight: 600;">${dateStr}</div>
        <div style="color: #10b981; font-size: 18px; font-weight: 700; margin-top: 4px;">🕐 ${timeStr} Uhr</div>
      </div>

      ${addressStr ? `
      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Adresse</div>
        <div style="color: #1f2937; font-size: 14px;">${addressStr}</div>
      </div>
      ` : ''}

      ${salon.phone ? `
      <div style="margin-bottom: 0;">
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Kontakt</div>
        <div style="color: #1f2937; font-size: 14px;">
          📞 ${salon.phone}
          ${salon.email ? `<br>📧 ${salon.email}` : ''}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin-bottom: 30px;">
      ${dashboardUrl ? `
      <a href="${dashboardUrl}/customer/bookings" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 15px; margin: 0 5px;">
        Zum Kundenbereich →
      </a>
      ` : ''}
    </div>

    <!-- Reminder Box -->
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>📲 Erinnerung:</strong> Sie erhalten 24 Stunden vor Ihrem Termin eine Erinnerung per E-Mail.
      </p>
    </div>

    <!-- Info Box -->
    <div style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 13px;">
        Termin absagen oder verschieben?<br>
        Kontaktieren Sie uns: <a href="mailto:${salon.email || 'info@salon.de'}" style="color: #10b981; text-decoration: none;">${salon.email || salon.phone}</a>
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background: #1f2937; padding: 30px; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
      Wir freuen uns auf Ihren Besuch! 🎉
    </p>
    <p style="color: #6b7280; margin: 0; font-size: 12px;">
      ${salon.name}<br>
      Powered by JN Business System
    </p>
  </div>

</body>
</html>
    `;

    // Queue email with audit trail
    await EmailQueue.create({
      to: bookingSnapshot.customerEmail,
      subject,
      body,
      html, // Include HTML version
      type: 'booking_confirmation',
      bookingId: bookingSnapshot._id,
      priority: 'high',
      language: bookingSnapshot.language,
      // Audit metadata for GDPR compliance
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
    logger.error('❌ SendBookingReminder Error:', error);
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
    const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  return result;
};

// ==================== SEND WELCOME/ONBOARDING EMAIL ====================

export const sendWelcomeEmail = async (user, _salon) => {
  try {
    const dashboardUrl = process.env.FRONTEND_URL || 'https://app.jn-business-system.de';
    const firstName = user.name?.split(' ')[0] || user.name || 'dort';

    const emailData = {
      to: user.email,
      subject: '🎉 Willkommen bei JN Business System - Deine nächsten Schritte',
      type: 'welcome',
      body: `Willkommen bei JN Business System, ${firstName}!`,
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
        <a href="mailto:support@jn-business-system.de" style="color: #7c3aed; text-decoration: none; font-size: 14px;">
          📧 support@jn-business-system.de
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
      JN Business System • Das Buchungssystem für Salons & Studios<br>
      <a href="${dashboardUrl}" style="color: #6b7280;">jn-business-system.de</a>
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
