import User from '../models/User.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import SMSConsent from '../models/SMSConsent.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import Payment from '../models/Payment.js';
import ClinicalNote from '../models/ClinicalNote.js';
import Consent from '../models/Consent.js';
import ConsentForm from '../models/ConsentForm.js';
import SMSLog from '../models/SMSLog.js';
import EmailLog from '../models/EmailLog.js';
import MarketingCampaign from '../models/MarketingCampaign.js';
import MarketingRecipient from '../models/MarketingRecipient.js';
import DeletionRequest from '../models/DeletionRequest.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * GDPR Compliance Controller
 * Handles data export (Right to Access) and deletion (Right to be Forgotten)
 */

const resolveTenantCustomer = async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    res.status(400).json({ success: false, message: 'Ungültiges customerId-Format' });
    return null;
  }

  const customerFilter = { _id: new mongoose.Types.ObjectId(customerId) };
  if (req.user.role !== 'ceo') {
    if (!req.user?.salonId) {
      res.status(403).json({ success: false, message: 'No salon assigned to authenticated user' });
      return null;
    }
    customerFilter.salonId = req.user.salonId;
  }

  const customer = await Customer.findOne(customerFilter).lean().maxTimeMS(5000);
  if (!customer) {
    res.status(404).json({ success: false, message: 'Kunde nicht gefunden oder kein Zugriff' });
    return null;
  }

  return customer;
};

const buildCustomerBookingFilter = (customer) => {
  const customerEmail = typeof customer.email === 'string' ? customer.email.toLowerCase() : null;
  const bookingOr = [{ customerId: customer._id }];
  if (customerEmail) {
    bookingOr.push({ customerEmail });
  }
  if (customer.phone) {
    bookingOr.push({ customerPhone: customer.phone });
  }

  return {
    salonId: customer.salonId,
    $or: bookingOr
  };
};

const buildCustomerSmsFilter = (customer) => {
  const smsOr = [];
  if (customer.userId) {
    smsOr.push({ customerId: customer.userId });
  }
  if (customer.phone) {
    smsOr.push({ phoneNumber: customer.phone });
  }

  const filter = { salonId: customer.salonId };
  if (smsOr.length > 0) {
    filter.$or = smsOr;
  } else {
    filter._id = null;
  }

  return filter;
};

// ==================== CUSTOMER DATA EXPORT (GDPR Art. 20) ====================

export const exportCustomerData = async (req, res) => {
  try {
    const customer = await resolveTenantCustomer(req, res);
    if (!customer) return;

    const salon = await Salon.findById(customer.salonId)
      .select('owner')
      .lean()
      .maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const ownerId = salon.owner;
    const customerEmail = typeof customer.email === 'string' ? customer.email.toLowerCase() : null;
    const bookingFilter = buildCustomerBookingFilter(customer);
    const smsFilter = buildCustomerSmsFilter(customer);

    const campaignIds = await MarketingCampaign.find({ salonId: customer.salonId })
      .select('_id')
      .lean()
      .maxTimeMS(5000);
    const campaignIdList = campaignIds.map((c) => c._id);

    const marketingRecipientFilter = campaignIdList.length > 0
      ? {
        campaignId: { $in: campaignIdList },
        ...(customer.userId
          ? { customerId: customer.userId }
          : customer.phone
            ? { phoneNumber: customer.phone }
            : { _id: null })
      }
      : { _id: null };

    const [bookings, payments, clinicalNotes, consents, consentForms, smsLogs, emailLogs, auditLogs, marketingRecipients] = await Promise.all([
      Booking.find(bookingFilter)
        .sort({ bookingDate: -1 })
        .lean()
        .maxTimeMS(5000),
      Payment.find({
        companyId: ownerId,
        $or: [
          { customerId: customer._id },
          ...(customerEmail ? [{ customerEmail }] : [])
        ]
      })
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000),
      ClinicalNote.find({ salonId: customer.salonId, customerId: customer._id })
        .lean()
        .maxTimeMS(5000),
      Consent.find({ salonId: customer.salonId, customerId: customer._id })
        .lean()
        .maxTimeMS(5000),
      ConsentForm.find({ salonId: customer.salonId, customerId: customer._id })
        .lean()
        .maxTimeMS(5000),
      SMSLog.find(smsFilter)
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000),
      customerEmail
        ? EmailLog.find({ companyId: ownerId, recipientEmail: customerEmail })
          .sort({ createdAt: -1 })
          .lean()
          .maxTimeMS(5000)
        : Promise.resolve([]),
      AuditLog.find({
        $or: [
          { 'phiAccessDetails.patientId': customer._id },
          ...(customer.userId ? [{ userId: customer.userId }] : [])
        ]
      })
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000),
      MarketingRecipient.find(marketingRecipientFilter)
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000)
    ]);

    await AuditLog.logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'GDPR_CUSTOMER_EXPORT',
      category: 'compliance',
      description: `GDPR Art. 20 export for customer ${customer._id}`,
      resourceType: 'user',
      resourceId: customer._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      metadata: {
        customerId: customer._id,
        salonId: customer.salonId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Kundendaten erfolgreich exportiert',
      export: {
        generatedAt: new Date().toISOString(),
        gdprArticle: 'Art. 20 DSGVO',
        customer: {
          id: customer._id,
          salonId: customer.salonId,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        },
        counts: {
          bookings: bookings.length,
          payments: payments.length,
          clinicalNotes: clinicalNotes.length,
          consents: consents.length,
          consentForms: consentForms.length,
          smsLogs: smsLogs.length,
          emailLogs: emailLogs.length,
          auditLogs: auditLogs.length,
          marketingRecipients: marketingRecipients.length
        },
        data: {
          bookings,
          payments,
          clinicalNotes,
          consents,
          consentForms,
          smsLogs,
          emailLogs,
          auditLogs,
          marketingRecipients
        }
      }
    });
  } catch (error) {
    logger.error('❌ GDPR customer export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Export fehlgeschlagen'
    });
  }
};

// ==================== CUSTOMER DATA DELETION (GDPR Art. 17) ====================

export const deleteCustomerData = async (req, res) => {
  let deletionRequestId = null;

  try {
    const customer = await resolveTenantCustomer(req, res);
    if (!customer) return;

    const { reason, additionalDetails } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required and must contain at least 3 characters'
      });
    }

    const salon = await Salon.findById(customer.salonId)
      .select('owner')
      .lean()
      .maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const ownerId = salon.owner;
    const customerEmail = typeof customer.email === 'string' ? customer.email.toLowerCase() : null;
    const bookingFilter = buildCustomerBookingFilter(customer);
    const smsFilter = buildCustomerSmsFilter(customer);

    const campaignIds = await MarketingCampaign.find({ salonId: customer.salonId })
      .select('_id')
      .lean()
      .maxTimeMS(5000);
    const campaignIdList = campaignIds.map((c) => c._id);

    const deletionRequest = await DeletionRequest.create({
      customerId: customer.userId || customer._id,
      customerEmail: customer.email,
      customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      requestedBy: req.user._id,
      reason: reason.trim(),
      additionalDetails,
      status: 'in_progress',
      dataTypes: ['all'],
      salonId: customer.salonId
    });
    deletionRequestId = deletionRequest._id;

    await AuditLog.logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'GDPR_CUSTOMER_DELETION_REQUESTED',
      category: 'compliance',
      description: `Deletion request created for customer ${customer._id}`,
      resourceType: 'user',
      resourceId: customer._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'warning',
      metadata: {
        deletionRequestId: deletionRequest._id,
        salonId: customer.salonId
      }
    });

    const [clinicalNoteIds, consentFormIds] = await Promise.all([
      ClinicalNote.find({ salonId: customer.salonId, customerId: customer._id })
        .select('_id')
        .lean()
        .maxTimeMS(5000),
      ConsentForm.find({ salonId: customer.salonId, customerId: customer._id })
        .select('_id')
        .lean()
        .maxTimeMS(5000)
    ]);

    const [bookingResult, paymentResult, clinicalResult, consentResult, consentFormResult, smsLogResult, emailLogResult, marketingResult, auditResult, smsConsentResult] = await Promise.all([
      Booking.updateMany(
        bookingFilter,
        {
          $set: {
            customerName: 'Deleted Customer',
            customerEmail: null,
            customerPhone: null,
            customerId: null,
            notes: 'Customer data deleted (GDPR)'
          }
        }
      ),
      Payment.updateMany(
        {
          companyId: ownerId,
          $or: [
            { customerId: customer._id },
            ...(customerEmail ? [{ customerEmail }] : [])
          ]
        },
        {
          $set: {
            customerName: 'Deleted Customer',
            customerEmail: null,
            customerPhone: null,
            customerId: null,
            notes: 'Customer data deleted (GDPR)'
          }
        }
      ),
      ClinicalNote.deleteMany({ salonId: customer.salonId, customerId: customer._id }),
      Consent.deleteMany({ salonId: customer.salonId, customerId: customer._id }),
      ConsentForm.deleteMany({ salonId: customer.salonId, customerId: customer._id }),
      SMSLog.deleteMany(smsFilter),
      customerEmail
        ? EmailLog.deleteMany({ companyId: ownerId, recipientEmail: customerEmail })
        : Promise.resolve({ deletedCount: 0 }),
      campaignIdList.length > 0
        ? MarketingRecipient.deleteMany({
          campaignId: { $in: campaignIdList },
          ...(customer.userId
            ? { customerId: customer.userId }
            : customer.phone
              ? { phoneNumber: customer.phone }
              : { _id: null })
        })
        : Promise.resolve({ deletedCount: 0 }),
      AuditLog.deleteMany({
        $or: [
          { 'phiAccessDetails.patientId': customer._id },
          ...(customer.userId ? [{ userId: customer.userId }] : []),
          ...(clinicalNoteIds.length > 0
            ? [{ resourceType: 'clinical-note', resourceId: { $in: clinicalNoteIds.map((d) => d._id) } }]
            : []),
          ...(consentFormIds.length > 0
            ? [{ resourceType: 'consent-form', resourceId: { $in: consentFormIds.map((d) => d._id) } }]
            : [])
        ]
      }),
      customer.userId
        ? SMSConsent.deleteMany({ user: customer.userId })
        : Promise.resolve({ deletedCount: 0 })
    ]);

    await Customer.findByIdAndUpdate(customer._id, {
      firstName: 'Deleted',
      lastName: 'Customer',
      email: `deleted+${customer._id}@deleted.local`,
      phone: '+0000000000',
      dateOfBirth: null,
      address: {},
      notes: 'Customer anonymized (GDPR)',
      tags: [],
      marketingConsent: false,
      smsConsent: false,
      stripeCustomerId: null,
      paymentMethods: [],
      status: 'inactive'
    });

    if (customer.userId) {
      await User.findByIdAndUpdate(customer.userId, {
        email: `deleted_user_${customer.userId}@deleted.local`,
        name: 'Deleted User',
        phone: null,
        isActive: false
      });
    }

    const deletionSummary = {
      bookings: bookingResult.modifiedCount || 0,
      payments: paymentResult.modifiedCount || 0,
      clinicalNotes: clinicalResult.deletedCount || 0,
      consents: consentResult.deletedCount || 0,
      consentForms: consentFormResult.deletedCount || 0,
      smsLogs: smsLogResult.deletedCount || 0,
      emailLogs: emailLogResult.deletedCount || 0,
      marketingRecipients: marketingResult.deletedCount || 0,
      auditLogs: auditResult.deletedCount || 0,
      smsConsents: smsConsentResult.deletedCount || 0
    };

    await DeletionRequest.findByIdAndUpdate(deletionRequest._id, {
      status: 'completed',
      executedBy: req.user._id,
      executedAt: new Date(),
      executionNotes: 'Automatic GDPR customer data deletion completed',
      deletionResults: {
        bookings: { deleted: deletionSummary.bookings, retained: 0 },
        clinicalNotes: { deleted: deletionSummary.clinicalNotes, retained: 0 },
        consentForms: {
          deleted: deletionSummary.consents + deletionSummary.consentForms,
          retained: 0
        },
        other: {
          deleted:
            deletionSummary.payments +
            deletionSummary.smsLogs +
            deletionSummary.emailLogs +
            deletionSummary.marketingRecipients +
            deletionSummary.auditLogs +
            deletionSummary.smsConsents,
          retained: 0
        }
      }
    });

    await AuditLog.logAction({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'GDPR_CUSTOMER_DELETION_COMPLETED',
      category: 'compliance',
      description: `Deletion completed for customer ${customer._id}`,
      resourceType: 'user',
      resourceId: customer._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      metadata: {
        deletionRequestId: deletionRequest._id,
        salonId: customer.salonId,
        ...deletionSummary
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Kundendaten DSGVO-konform gelöscht bzw. anonymisiert',
      deletionRequestId: deletionRequest._id,
      summary: deletionSummary
    });
  } catch (error) {
    logger.error('❌ GDPR customer deletion error:', error);

    if (deletionRequestId) {
      await DeletionRequest.findByIdAndUpdate(deletionRequestId, {
        status: 'cancelled',
        executionNotes: `Deletion failed: ${error.message}`
      }).catch(() => null);
    }

    return res.status(500).json({
      success: false,
      message: 'Kundendatenlöschung fehlgeschlagen'
    });
  }
};

// ==================== DATA EXPORT ====================

export const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    logger.info(`📦 GDPR Data Export requested by user: ${userId}`);

    // Gather all user-related data
    const [user, bookings, auditLogs, smsConsent] = await Promise.all([
      User.findById(userId).select('-password -refreshToken').lean(),
      Booking.find({
        $or: [
          { customer: userId },
          { employee: userId }
        ]
      }).lean(),
      AuditLog.find({ userId })
        .select('-ipAddress -userAgent') // Privacy: exclude tracking data
        .limit(1000)
        .sort({ createdAt: -1 })
        .lean(),
      SMSConsent.findOne({ user: userId }).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Compile data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: user.email,
      data: {
        profile: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        bookings: {
          total: bookings.length,
          asCustomer: bookings.filter(b => b.customer?.toString() === userId.toString()).length,
          asEmployee: bookings.filter(b => b.employee?.toString() === userId.toString()).length,
          data: bookings.map(b => ({
            id: b._id,
            date: b.date,
            status: b.status,
            service: b.serviceName,
            notes: b.notes,
            createdAt: b.createdAt
          }))
        },
        consents: {
          sms: smsConsent ? {
            hasConsent: smsConsent.hasConsent,
            consentGivenAt: smsConsent.consentGivenAt,
            lastUpdated: smsConsent.updatedAt
          } : null,
          marketing: user.marketingConsent,
          email: user.emailConsent
        },
        auditLogs: {
          total: auditLogs.length,
          recentActions: auditLogs.slice(0, 50).map(log => ({
            action: log.action,
            category: log.category,
            description: log.description,
            timestamp: log.createdAt
          }))
        },
        dataRetention: {
          accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
          lastActivity: user.lastLogin || user.updatedAt
        }
      }
    };

    // Log the export
    await AuditLog.logAction({
      userId,
      userEmail: user.email,
      action: 'EXPORT_DATA',
      category: 'compliance',
      description: 'User exported their personal data (GDPR)',
      resourceType: 'user',
      resourceId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Daten erfolgreich exportiert',
      data: exportData
    });

  } catch (error) {
    logger.error('❌ GDPR Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Export fehlgeschlagen. Bitte kontaktieren Sie den Support.'
    });
  }
};

// ==================== DATA DELETION ====================

export const deleteUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { confirmPassword } = req.body;

    logger.warn(`🗑️ GDPR Data Deletion requested by user: ${userId}`);

    // Verify user exists
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Verify password for security
    const isPasswordValid = await user.comparePassword(confirmPassword);
    if (!isPasswordValid) {
      await AuditLog.logAction({
        userId,
        action: 'DELETE_DATA_FAILED',
        category: 'security',
        description: 'Data deletion failed: Invalid password',
        status: 'failed',
        ipAddress: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Falsches Passwort'
      });
    }

    // Log BEFORE deletion
    await AuditLog.logAction({
      userId,
      userEmail: user.email,
      action: 'DELETE_DATA',
      category: 'compliance',
      description: 'User requested account deletion (GDPR Right to be Forgotten)',
      resourceType: 'user',
      resourceId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
      metadata: {
        deletionType: 'soft-delete',
        reason: 'GDPR compliance'
      }
    });

    // SOFT DELETE: Anonymize instead of hard delete (business records requirement)
    const anonymizedEmail = `deleted_${userId}@deleted.local`;

    await User.findByIdAndUpdate(userId, {
      email: anonymizedEmail,
      phone: null,
      firstName: 'Gelöscht',
      lastName: 'Benutzer',
      password: null, // Clear password hash
      refreshToken: null,
      twoFactorSecret: null,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
      marketingConsent: false,
      emailConsent: false
    });

    // Anonymize bookings (keep for business records)
    await Booking.updateMany(
      { customer: userId },
      {
        customerName: 'Gelöschter Kunde',
        customerEmail: null,
        customerPhone: null,
        notes: 'Kundendaten gelöscht (GDPR)'
      }
    );

    // Delete SMS consent
    await SMSConsent.deleteMany({ user: userId });

    logger.info(`✅ User data anonymized: ${userId}`);

    res.json({
      success: true,
      message: 'Ihre Daten wurden erfolgreich gelöscht. Ihr Account wurde deaktiviert.',
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ GDPR Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Löschung fehlgeschlagen. Bitte kontaktieren Sie den Support.'
    });
  }
};

// ==================== DATA RETENTION INFO ====================

export const getDataRetentionInfo = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('createdAt lastLogin');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
    }

    const bookingsCount = await Booking.countDocuments({
      $or: [{ customer: userId }, { employee: userId }]
    });

    const auditLogsCount = await AuditLog.countDocuments({ userId });

    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        accountCreated: user.createdAt,
        accountAge: `${accountAgeDays} Tage`,
        lastActivity: user.lastLogin || user.updatedAt,
        dataStored: {
          bookings: bookingsCount,
          auditLogs: auditLogsCount
        },
        retentionPolicy: {
          bookings: 'Unbegrenzt (Geschäftsunterlagen)',
          auditLogs: '90 Tage',
          inactiveAccounts: '1 Jahr nach letzter Aktivität'
        },
        yourRights: {
          access: 'Sie können Ihre Daten jederzeit exportieren',
          rectification: 'Sie können Ihre Daten in den Einstellungen ändern',
          erasure: 'Sie können Ihr Konto löschen (anonymisiert)',
          portability: 'Export in JSON-Format verfügbar'
        }
      }
    });

  } catch (error) {
    logger.error('❌ Data Retention Info Error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Informationen' });
  }
};

export default {
  exportUserData,
  deleteUserData,
  getDataRetentionInfo,
  exportCustomerData,
  deleteCustomerData
};
