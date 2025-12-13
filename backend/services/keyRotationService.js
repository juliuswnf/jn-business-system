import crypto from 'crypto';
import ClinicalNote from '../models/ClinicalNote.js';
import ConsentForm from '../models/ConsentForm.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';

/**
 * Encryption Key Rotation Service
 * HIPAA requires regular key rotation for PHI encryption
 */

// Key storage (in production, use AWS KMS or Azure Key Vault)
let ENCRYPTION_KEYS = {
  current: {
    version: 1,
    key: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    createdAt: new Date(),
    rotatedAt: null
  },
  previous: null
};

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypt data with current key
 */
export function encrypt(text, keyVersion = ENCRYPTION_KEYS.current.version) {
  try {
    if (!text) return null;

    const key = getKeyByVersion(keyVersion);
    if (!key) {
      throw new Error(`Encryption key version ${keyVersion} not found`);
    }

    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from master key + salt
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.from(key.key, 'hex'),
      salt,
      100000,
      32,
      'sha512'
    );

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: version + salt + iv + authTag + encrypted
    const combined = Buffer.concat([
      Buffer.from([key.version]), // 1 byte
      salt,                         // 64 bytes
      iv,                           // 16 bytes
      authTag,                      // 16 bytes
      Buffer.from(encrypted, 'hex') // Variable
    ]);

    return combined.toString('base64');

  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data (supports multiple key versions)
 */
export function decrypt(encryptedData) {
  try {
    if (!encryptedData) return null;

    // Decode from base64
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract components
    const keyVersion = buffer[0];
    const salt = buffer.slice(1, 1 + SALT_LENGTH);
    const iv = buffer.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.slice(
      1 + SALT_LENGTH + IV_LENGTH,
      1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = buffer.slice(1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Get key by version
    const key = getKeyByVersion(keyVersion);
    if (!key) {
      throw new Error(`Decryption key version ${keyVersion} not found`);
    }

    // Derive key
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.from(key.key, 'hex'),
      salt,
      100000,
      32,
      'sha512'
    );

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Get key by version
 */
function getKeyByVersion(version) {
  if (ENCRYPTION_KEYS.current.version === version) {
    return ENCRYPTION_KEYS.current;
  }
  if (ENCRYPTION_KEYS.previous && ENCRYPTION_KEYS.previous.version === version) {
    return ENCRYPTION_KEYS.previous;
  }
  return null;
}

/**
 * Rotate encryption keys
 * This should be called monthly (HIPAA best practice)
 */
export async function rotateKeys() {
  try {
    logger.info('Starting encryption key rotation...');

    // Generate new key
    const newKey = {
      version: ENCRYPTION_KEYS.current.version + 1,
      key: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date(),
      rotatedAt: null
    };

    // Store current key as previous
    const previousKey = { ...ENCRYPTION_KEYS.current };
    previousKey.rotatedAt = new Date();

    // Update key storage
    ENCRYPTION_KEYS.previous = previousKey;
    ENCRYPTION_KEYS.current = newKey;

    logger.info('New encryption key generated', {
      newVersion: newKey.version,
      previousVersion: previousKey.version
    });

    // Re-encrypt all PHI data
    await reEncryptAllData(previousKey.version, newKey.version);

    // In production, store keys in secure vault
    await storeKeysSecurely(ENCRYPTION_KEYS);

    logger.info('Encryption key rotation completed successfully');

    return {
      success: true,
      newVersion: newKey.version,
      previousVersion: previousKey.version,
      rotatedAt: new Date()
    };

  } catch (error) {
    logger.error('Key rotation failed:', error);
    throw error;
  }
}

/**
 * Re-encrypt all PHI data with new key
 */
async function reEncryptAllData(oldVersion, newVersion) {
  try {
    logger.info('Re-encrypting all PHI data...');

    // Re-encrypt Clinical Notes
    const clinicalNotes = await ClinicalNote.find({
      keyVersion: oldVersion
    }).lean();

    logger.info(`Found ${clinicalNotes.length} clinical notes to re-encrypt`);

    for (const note of clinicalNotes) {
      try {
        // Decrypt with old key
        const decrypted = {
          chiefComplaint: note.chiefComplaint ? decrypt(note.chiefComplaint) : null,
          diagnosis: note.diagnosis ? decrypt(note.diagnosis) : null,
          treatmentPlan: note.treatmentPlan ? decrypt(note.treatmentPlan) : null,
          medications: note.medications ? decrypt(note.medications) : null,
          notes: note.notes ? decrypt(note.notes) : null
        };

        // Encrypt with new key
        const encrypted = {
          chiefComplaint: decrypted.chiefComplaint ? encrypt(decrypted.chiefComplaint, newVersion) : null,
          diagnosis: decrypted.diagnosis ? encrypt(decrypted.diagnosis, newVersion) : null,
          treatmentPlan: decrypted.treatmentPlan ? encrypt(decrypted.treatmentPlan, newVersion) : null,
          medications: decrypted.medications ? encrypt(decrypted.medications, newVersion) : null,
          notes: decrypted.notes ? encrypt(decrypted.notes, newVersion) : null
        };

        // Update record
        await ClinicalNote.findByIdAndUpdate(note._id, {
          ...encrypted,
          keyVersion: newVersion,
          lastEncrypted: new Date()
        });

      } catch (error) {
        logger.error(`Failed to re-encrypt clinical note ${note._id}:`, error);
        // Continue with other notes
      }
    }

    // Re-encrypt Consent Forms (signatures are PHI)
    const consentForms = await ConsentForm.find({
      keyVersion: oldVersion,
      signature: { $exists: true }
    }).lean();

    logger.info(`Found ${consentForms.length} consent forms to re-encrypt`);

    for (const form of consentForms) {
      try {
        // Decrypt with old key
        const decryptedSignature = decrypt(form.signature);

        // Encrypt with new key
        const encryptedSignature = encrypt(decryptedSignature, newVersion);

        // Update record
        await ConsentForm.findByIdAndUpdate(form._id, {
          signature: encryptedSignature,
          keyVersion: newVersion
        });

      } catch (error) {
        logger.error(`Failed to re-encrypt consent form ${form._id}:`, error);
      }
    }

    logger.info('PHI re-encryption completed');

  } catch (error) {
    logger.error('Re-encryption failed:', error);
    throw error;
  }
}

/**
 * Store keys securely (production implementation)
 */
async function storeKeysSecurely(_keys) {
  // In production, use:
  // - AWS KMS (Key Management Service)
  // - Azure Key Vault
  // - Google Cloud KMS
  // - HashiCorp Vault

  // For now, log warning
  logger.warn('PRODUCTION WARNING: Keys should be stored in secure vault (AWS KMS, Azure Key Vault, etc.)');

  // Example AWS KMS integration:
  /*
  const AWS = require('aws-sdk');
  const kms = new AWS.KMS({ region: process.env.AWS_REGION });

  await kms.encrypt({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: JSON.stringify(keys)
  }).promise();
  */

  // Example Azure Key Vault integration:
  /*
  const { SecretClient } = require('@azure/keyvault-secrets');
  const client = new SecretClient(process.env.KEY_VAULT_URL, credential);

  await client.setSecret('encryption-keys', JSON.stringify(keys));
  */
}

/**
 * Schedule automatic key rotation (monthly)
 */
export function scheduleKeyRotation() {
  // Run on 1st day of each month at 2 AM
  cron.schedule('0 2 1 * *', async () => {
    logger.info('Scheduled key rotation triggered');
    try {
      await rotateKeys();
    } catch (error) {
      logger.error('Scheduled key rotation failed:', error);
      // Alert administrators
      await alertAdministrators('Key rotation failed', error);
    }
  });

  logger.info('Encryption key rotation scheduled (monthly)');
}

/**
 * Alert administrators about critical events
 */
async function alertAdministrators(subject, error) {
  // In production, send email/SMS alerts
  logger.error('ADMIN ALERT:', { subject, error: error.message });

  // Example email integration:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({ ... });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: process.env.ADMIN_EMAILS,
    subject: `[CRITICAL] ${subject}`,
    text: `Error: ${error.message}\n\nStack: ${error.stack}`
  });
  */
}

/**
 * Get current key version
 */
export function getCurrentKeyVersion() {
  return ENCRYPTION_KEYS.current.version;
}

/**
 * Get key rotation status
 */
export function getKeyRotationStatus() {
  return {
    currentVersion: ENCRYPTION_KEYS.current.version,
    currentKeyAge: Math.floor(
      (Date.now() - ENCRYPTION_KEYS.current.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    ), // days
    previousVersion: ENCRYPTION_KEYS.previous?.version || null,
    lastRotation: ENCRYPTION_KEYS.previous?.rotatedAt || null,
    nextScheduledRotation: '1st of next month at 2:00 AM',
    recommendedRotationInterval: '30 days',
    status: shouldRotateKeys() ? 'ROTATION_DUE' : 'OK'
  };
}

/**
 * Check if keys should be rotated
 */
function shouldRotateKeys() {
  const keyAge = Date.now() - ENCRYPTION_KEYS.current.createdAt.getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return keyAge > thirtyDays;
}

/**
 * Manual key rotation endpoint (for testing or emergency)
 */
export async function manualKeyRotation(req, res) {
  try {
    // Require CEO/Admin role
    if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only CEO/Admin can manually rotate encryption keys'
      });
    }

    const result = await rotateKeys();

    res.json({
      success: true,
      message: 'Encryption keys rotated successfully',
      result
    });

  } catch (error) {
    logger.error('Manual key rotation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Key rotation failed',
      error: error.message
    });
  }
}

/**
 * Get key rotation status endpoint
 */
export async function getRotationStatus(req, res) {
  try {
    const status = getKeyRotationStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Failed to get rotation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rotation status'
    });
  }
}

export default {
  encrypt,
  decrypt,
  rotateKeys,
  scheduleKeyRotation,
  getCurrentKeyVersion,
  getKeyRotationStatus,
  manualKeyRotation,
  getRotationStatus
};
