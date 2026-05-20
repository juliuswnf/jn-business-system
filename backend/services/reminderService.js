import crypto from 'crypto';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';
import logger from '../utils/logger.js';

const TOKEN_REGEX = /^[A-Za-z0-9._-]{20,400}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

const REMINDER_TIME_LABELS = {
  '72h': 'in 72 Stunden',
  '24h': 'in 24 Stunden',
  '2h': 'in 2 Stunden',
  manual: 'in Kuerze'
};

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getTokenSecret = () => {
  const secret = process.env.NO_SHOW_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('NO_SHOW_TOKEN_SECRET or JWT_SECRET must be configured for reminder tokens');
  }
  return secret;
};

const getFrontendBaseUrl = () => {
  return (process.env.FRONTEND_URL || 'https://app.jn-business-system.de').replace(/\/$/, '');
};

const buildTokenSignature = (bookingId, expiresAtMs) => {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(`${bookingId}.${expiresAtMs}`)
    .digest('base64url');
};

export const hashConfirmationToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const buildConfirmationToken = (bookingId, expiresAt) => {
  const bookingIdString = String(bookingId || '').trim();
  const expiresAtMs = new Date(expiresAt).getTime();

  if (!mongoose.isValidObjectId(bookingIdString)) {
    throw new Error('Invalid bookingId for token generation');
  }

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    throw new Error('Invalid token expiry timestamp');
  }

  const signature = buildTokenSignature(bookingIdString, expiresAtMs);
  return `${bookingIdString}.${expiresAtMs}.${signature}`;
};

export const parseConfirmationToken = (token) => {
  const tokenValue = String(token || '').trim();

  if (!TOKEN_REGEX.test(tokenValue)) {
    return null;
  }

  const parts = tokenValue.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [bookingId, expiresAtRaw, signatureRaw] = parts;
  if (!mongoose.isValidObjectId(bookingId)) {
    return null;
  }

  const expiresAtMs = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAtMs)) {
    return null;
  }

  const expectedSignature = buildTokenSignature(bookingId, expiresAtMs);
  const providedBuffer = Buffer.from(signatureRaw);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  return {
    bookingId,
    expiresAt: new Date(expiresAtMs)
  };
};

const getReminderLabel = (reminderType) => {
  return REMINDER_TIME_LABELS[reminderType] || REMINDER_TIME_LABELS.manual;
};

const formatBookingDate = (bookingDate, locale = 'de-DE') => {
  const date = new Date(bookingDate);
  return {
    dateLabel: date.toLocaleDateString(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    timeLabel: date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

const getCustomerFirstName = (booking) => {
  if (booking.customerId?.firstName) {
    return booking.customerId.firstName;
  }

  const name = String(booking.customerName || '').trim();
  if (!name) {
    return 'Kunde';
  }

  return name.split(' ')[0];
};

const resolveReminderEmail = (booking) => {
  const email = String(booking.customerEmail || booking.customerId?.email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return null;
  }
  return email;
};

const resolveReminderPhone = (booking) => {
  const phone = String(booking.customerPhone || booking.customerId?.phone || '').trim();
  if (!PHONE_REGEX.test(phone)) {
    return null;
  }
  return phone;
};

const buildReminderEmail = ({
  customerFirstName,
  salonName,
  serviceName,
  dateLabel,
  timeLabel,
  reminderLabel,
  confirmUrl,
  rescheduleUrl
}) => {
  const escapedFirstName = escapeHtml(customerFirstName);
  const escapedSalonName = escapeHtml(salonName);
  const escapedServiceName = escapeHtml(serviceName);
  const escapedDate = escapeHtml(dateLabel);
  const escapedTime = escapeHtml(timeLabel);
  const escapedReminderLabel = escapeHtml(reminderLabel);

  const subject = `Termin-Erinnerung: Bitte bestaetigen Sie Ihren Termin bei ${salonName}`;

  const text = [
    `Hallo ${customerFirstName},`,
    '',
    `Ihr Termin bei ${salonName} findet ${reminderLabel} statt.`,
    `Service: ${serviceName}`,
    `Datum: ${dateLabel}`,
    `Uhrzeit: ${timeLabel}`,
    '',
    'Bitte bestaetigen Sie Ihren Termin mit einem Klick:',
    confirmUrl,
    '',
    'Termin verschieben:',
    rescheduleUrl
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 12px;">Termin-Erinnerung</h2>
      <p>Hallo ${escapedFirstName},</p>
      <p>Ihr Termin bei <strong>${escapedSalonName}</strong> findet ${escapedReminderLabel} statt.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px 0;"><strong>Service:</strong> ${escapedServiceName}</p>
        <p style="margin: 0 0 6px 0;"><strong>Datum:</strong> ${escapedDate}</p>
        <p style="margin: 0;"><strong>Uhrzeit:</strong> ${escapedTime} Uhr</p>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <a href="${confirmUrl}" style="display: inline-block; padding: 12px 16px; background: #111827; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">
          Termin bestaetigen
        </a>
        <a href="${rescheduleUrl}" style="display: inline-block; padding: 12px 16px; background: #f3f4f6; color: #111827; text-decoration: none; border-radius: 10px; font-weight: 600;">
          Termin verschieben
        </a>
      </div>
    </div>
  `;

  return { subject, text, html };
};

export const ensureConfirmationToken = async (booking) => {
  if (!booking?._id) {
    throw new Error('Booking is required to ensure confirmation token');
  }

  const nowMs = Date.now();
  let needsSave = false;
  let token;

  if (booking.confirmationToken && booking.confirmationTokenExpiry instanceof Date) {
    const expiryMs = booking.confirmationTokenExpiry.getTime();
    if (Number.isFinite(expiryMs) && expiryMs > nowMs) {
      const existingToken = buildConfirmationToken(booking._id.toString(), booking.confirmationTokenExpiry);
      const existingHash = hashConfirmationToken(existingToken);
      if (existingHash === booking.confirmationToken) {
        token = existingToken;
      }
    }
  }

  if (!token) {
    const bookingDateMs = new Date(booking.bookingDate).getTime();
    const minimumExpiryMs = nowMs + (60 * 60 * 1000);
    const bookingBasedExpiryMs = Number.isFinite(bookingDateMs)
      ? bookingDateMs + (6 * 60 * 60 * 1000)
      : minimumExpiryMs;
    const expiresAt = new Date(Math.max(minimumExpiryMs, bookingBasedExpiryMs));

    token = buildConfirmationToken(booking._id.toString(), expiresAt);
    booking.confirmationToken = hashConfirmationToken(token);
    booking.confirmationTokenExpiry = expiresAt;
    needsSave = true;
  }

  if (booking.confirmationStatus !== 'pending' && booking.confirmationStatus !== 'confirmed') {
    booking.confirmationStatus = 'pending';
    needsSave = true;
  }

  if (needsSave) {
    await booking.save();
  }

  return {
    token,
    expiresAt: booking.confirmationTokenExpiry
  };
};

export const sendReminder = async (bookingRef, reminderType = '24h') => {
  const allowedReminderTypes = ['72h', '24h', '2h', 'manual'];
  const normalizedReminderType = allowedReminderTypes.includes(reminderType) ? reminderType : 'manual';

  const bookingId =
    typeof bookingRef === 'string' || bookingRef instanceof mongoose.Types.ObjectId
      ? bookingRef
      : bookingRef?._id;

  if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
    throw new Error('Valid bookingId is required for reminder dispatch');
  }

  const booking = await Booking.findById(new mongoose.Types.ObjectId(bookingId))
    .select('+confirmationToken')
    .populate('salonId', 'name email phone')
    .populate('serviceId', 'name')
    .populate('customerId', 'firstName lastName email phone preferredLanguage')
    .maxTimeMS(5000);

  if (!booking) {
    throw new Error('Booking not found for reminder dispatch');
  }

  const { token } = await ensureConfirmationToken(booking);

  const frontendBaseUrl = getFrontendBaseUrl();
  const confirmUrl = `${frontendBaseUrl}/booking/confirm/${token}`;
  const rescheduleUrl = `${frontendBaseUrl}/booking/reschedule/${token}`;

  const locale = booking.language === 'en' ? 'en-US' : 'de-DE';
  const customerFirstName = getCustomerFirstName(booking);
  const salonName = booking.salonId?.name || 'Ihr Studio';
  const serviceName = booking.serviceId?.name || 'Ihr Termin';
  const { dateLabel, timeLabel } = formatBookingDate(booking.bookingDate, locale);
  const reminderLabel = getReminderLabel(normalizedReminderType);

  let emailSent = false;
  let smsSent = false;

  const reminderEmail = resolveReminderEmail(booking);
  if (reminderEmail) {
    const { subject, text, html } = buildReminderEmail({
      customerFirstName,
      salonName,
      serviceName,
      dateLabel,
      timeLabel,
      reminderLabel,
      confirmUrl,
      rescheduleUrl
    });

    await sendEmail({
      to: reminderEmail,
      subject,
      body: text,
      html,
      salonId: booking.salonId?._id || booking.salonId,
      type: 'booking_reminder'
    });
    emailSent = true;
  }

  const shouldSendSms = ['24h', '2h', 'manual'].includes(normalizedReminderType);
  const reminderPhone = resolveReminderPhone(booking);

  if (shouldSendSms && reminderPhone) {
    const smsMessage = `Erinnerung: Ihr Termin bei ${salonName} ist ${reminderLabel}. Bestaetigen: ${confirmUrl}`;
    const smsResult = await sendSMS(
      reminderPhone,
      smsMessage,
      booking.salonId?._id || booking.salonId,
      'reminder',
      booking._id,
      booking.customerId?._id || booking.customerId || null
    );
    smsSent = smsResult?.sent === true;
  }

  const primaryChannel = emailSent ? 'email' : (smsSent ? 'sms' : null);

  if (!primaryChannel) {
    logger.warn(`[ReminderService] No reminder channel available for booking ${booking._id}`);
  }

  return {
    sent: Boolean(primaryChannel),
    channel: primaryChannel,
    emailSent,
    smsSent,
    reminderType: normalizedReminderType,
    confirmUrl,
    rescheduleUrl
  };
};

export default {
  sendReminder,
  hashConfirmationToken,
  parseConfirmationToken,
  ensureConfirmationToken,
  buildConfirmationToken
};
