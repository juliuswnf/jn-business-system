import Booking from '../models/Booking.js';
import ProgressEntry from '../models/ProgressEntry.js';
import ClinicalNote from '../models/ClinicalNote.js';
import Package from '../models/Package.js';
import ConsentForm from '../models/ConsentForm.js';
import ArtistPortfolio from '../models/ArtistPortfolio.js';
import { decrypt } from '../services/keyRotationService.js';
import logger from '../utils/logger.js';
import archiver from 'archiver';
import { createWriteStream, unlinkSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

/**
 * Data Portability Service
 * GDPR Article 20 - Right to Data Portability
 * HIPAA - Right of Access to PHI
 */

/**
 * Export all customer data
 */
export const exportCustomerData = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { format = 'json' } = req.query;

    // Verify authorization
    if (req.user.role !== 'ceo' && req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export this customer data'
      });
    }

    logger.info('Data export requested', {
      customerId,
      requestedBy: req.user.id,
      format
    });

    // Gather all customer data
    const customerData = await gatherCustomerData(customerId);

    // Generate export file
    const exportFile = await generateExportFile(customerData, format, customerId);

    // Log export event (HIPAA audit requirement)
    await logDataExport(req.user.id, customerId, format);

    // Send file
    res.download(exportFile.path, exportFile.filename, (error) => {
      if (error) {
        logger.error('Failed to send export file:', error);
      }

      // Clean up file after download
      setTimeout(() => {
        try {
          unlinkSync(exportFile.path);
        } catch (err) {
          logger.error('Failed to delete export file:', err);
        }
      }, 60000); // Delete after 1 minute
    });

  } catch (error) {
    logger.error('Data export failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export customer data',
      error: error.message
    });
  }
};

/**
 * Gather all customer data from all collections
 */
async function gatherCustomerData(customerId) {
  try {
    logger.info('Gathering customer data', { customerId });

    const [
      bookings,
      progressEntries,
      clinicalNotes,
      packages,
      consentForms,
      portfolioItems
    ] = await Promise.all([
      // Bookings
      Booking.find({ customerId })
        .populate('serviceId', 'name duration price')
        .populate('staffId', 'firstName lastName')
        .lean(),

      // Progress Entries
      ProgressEntry.find({ customerId })
        .lean(),

      // Clinical Notes (decrypt PHI)
      ClinicalNote.find({ customerId })
        .populate('providerId', 'firstName lastName')
        .lean(),

      // Packages
      Package.find({ salonId: { $exists: true } })
        .where('purchasedBy').equals(customerId)
        .lean(),

      // Consent Forms
      ConsentForm.find({ customerId })
        .lean(),

      // Portfolio (best-effort): customer linkage is optional depending on studio setup
      ArtistPortfolio.find({ tags: { $in: [String(customerId)] } })
        .populate('artistId', 'firstName lastName')
        .lean()
    ]);

    // Decrypt clinical notes
    const decryptedClinicalNotes = clinicalNotes.map(note => ({
      ...note,
      chiefComplaint: note.chiefComplaint ? decrypt(note.chiefComplaint) : null,
      diagnosis: note.diagnosis ? decrypt(note.diagnosis) : null,
      treatmentPlan: note.treatmentPlan ? decrypt(note.treatmentPlan) : null,
      medications: note.medications ? decrypt(note.medications) : null,
      notes: note.notes ? decrypt(note.notes) : null
    }));

    // Decrypt consent form signatures
    const decryptedConsentForms = consentForms.map(form => ({
      ...form,
      signature: form.signature ? decrypt(form.signature) : null
    }));

    return {
      exportDate: new Date().toISOString(),
      customerId,
      dataTypes: {
        bookings: bookings.length,
        progressEntries: progressEntries.length,
        clinicalNotes: clinicalNotes.length,
        packages: packages.length,
        consentForms: consentForms.length,
        portfolioItems: portfolioItems.length
      },
      bookings,
      progressEntries,
      clinicalNotes: decryptedClinicalNotes,
      packages,
      consentForms: decryptedConsentForms,
      portfolioItems,
      gdprCompliance: {
        rightToDataPortability: true,
        dataFormat: 'machine-readable',
        article: 'GDPR Article 20'
      },
      hipaaCompliance: {
        rightOfAccess: true,
        phiIncluded: clinicalNotes.length > 0,
        regulation: '45 CFR 164.524'
      }
    };

  } catch (error) {
    logger.error('Failed to gather customer data:', error);
    throw error;
  }
}

/**
 * Generate export file (JSON, CSV, or encrypted ZIP)
 */
async function generateExportFile(data, format, customerId) {
  const timestamp = Date.now();
  const filename = `customer_data_${customerId}_${timestamp}`;

  try {
    if (format === 'json') {
      // JSON format
      const path = join(process.cwd(), 'temp', `${filename}.json`);
      await writeFile(path, JSON.stringify(data, null, 2));

      return {
        path,
        filename: `${filename}.json`,
        size: JSON.stringify(data).length
      };

    } else if (format === 'csv') {
      // CSV format (multiple files in ZIP)
      const zipPath = join(process.cwd(), 'temp', `${filename}.zip`);
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      // Convert each data type to CSV
      archive.append(convertToCSV(data.bookings, 'bookings'), { name: 'bookings.csv' });
      archive.append(convertToCSV(data.progressEntries, 'progress'), { name: 'progress_entries.csv' });
      archive.append(convertToCSV(data.clinicalNotes, 'clinical'), { name: 'clinical_notes.csv' });
      archive.append(convertToCSV(data.packages, 'packages'), { name: 'packages.csv' });
      archive.append(convertToCSV(data.consentForms, 'consent'), { name: 'consent_forms.csv' });
      archive.append(JSON.stringify(data, null, 2), { name: 'full_export.json' });

      await archive.finalize();

      return {
        path: zipPath,
        filename: `${filename}.zip`,
        size: archive.pointer()
      };

    } else if (format === 'encrypted') {
      // Encrypted ZIP (for PHI data)
      const zipPath = join(process.cwd(), 'temp', `${filename}_encrypted.zip`);
      const password = crypto.randomBytes(16).toString('hex');
      const output = createWriteStream(zipPath);
      const archive = archiver('zip-encrypted', {
        zlib: { level: 9 },
        encryptionMethod: 'aes256',
        password
      });

      archive.pipe(output);
      archive.append(JSON.stringify(data, null, 2), { name: 'customer_data.json' });
      await archive.finalize();

      // In production, send password via secure channel (email, SMS)
      logger.info('Encrypted export created', {
        customerId,
        password // In production, don't log this - send securely
      });

      return {
        path: zipPath,
        filename: `${filename}_encrypted.zip`,
        size: archive.pointer(),
        password // In production, send via secure channel
      };
    }

  } catch (error) {
    logger.error('Failed to generate export file:', error);
    throw error;
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data, _type) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]).filter(key =>
    typeof data[0][key] !== 'object' || data[0][key] === null
  );

  // Create CSV rows
  const rows = data.map(item =>
    headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Write file helper
 */
function writeFile(path, content) {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.writeFile(path, content, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Log data export event (HIPAA requirement)
 */
async function logDataExport(userId, customerId, format) {
  const AuditLog = (await import('../models/AuditLog.js')).default;

  await AuditLog.create({
    userId,
    action: 'data_export',
    resource: 'customer_data',
    resourceId: customerId,
    details: {
      format,
      exportedAt: new Date(),
      regulation: 'GDPR Article 20 & HIPAA 45 CFR 164.524'
    },
    isPHIAccess: true,
    phiAccessDetails: {
      patientId: customerId,
      dataType: 'full_export',
      accessReason: 'data_portability_request',
      justification: 'Customer requested full data export'
    },
    timestamp: new Date()
  });

  logger.info('Data export logged', { userId, customerId, format });
}

/**
 * Request data deletion (GDPR Right to Erasure)
 */
export const requestDataDeletion = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    // Verify authorization
    if (req.user.role !== 'ceo' && req.user.id !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this customer data'
      });
    }

    // Create deletion request (requires manual review for compliance)
    const DeletionRequest = (await import('../models/DeletionRequest.js')).default;

    const request = await DeletionRequest.create({
      customerId,
      requestedBy: req.user.id,
      reason,
      status: 'pending_review',
      requestedAt: new Date()
    });

    logger.info('Data deletion requested', {
      customerId,
      requestId: request._id,
      requestedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Data deletion request submitted for review',
      requestId: request._id,
      status: 'pending_review',
      gdprCompliance: {
        rightToErasure: true,
        article: 'GDPR Article 17'
      },
      note: 'Some data may be retained for legal compliance (e.g., financial records for 7 years)'
    });

  } catch (error) {
    logger.error('Data deletion request failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request data deletion',
      error: error.message
    });
  }
};

/**
 * Get data export history
 */
export const getExportHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify authorization
    if (req.user.role !== 'ceo' && req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view export history'
      });
    }

    const AuditLog = (await import('../models/AuditLog.js')).default;

    const exports = await AuditLog.find({
      action: 'data_export',
      resourceId: customerId
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      exports,
      count: exports.length
    });

  } catch (error) {
    logger.error('Failed to get export history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export history'
    });
  }
};

export default {
  exportCustomerData,
  requestDataDeletion,
  getExportHistory
};
