import User from '../models/User.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import SMSConsent from '../models/SMSConsent.js';
import logger from '../utils/logger.js';

/**
 * GDPR Compliance Controller
 * Handles data export (Right to Access) and deletion (Right to be Forgotten)
 */

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
  getDataRetentionInfo
};
