import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
// ? SECURITY FIX: Use centralized file upload middleware
import { upload, validateImageDimensions, handleUploadError } from '../middleware/fileUploadMiddleware.js';
import {
  getBaas,
  createBaa,
  updateBaa,
  renewBaa,
  terminateBaa,
  getComplianceStatus
} from '../controllers/complianceController.js';
import {
  getPatientAuditTrail,
  generateComplianceReport
} from '../middleware/hipaaAuditMiddleware.js';
import {
  manualKeyRotation,
  getRotationStatus
} from '../services/keyRotationService.js';
import {
  exportCustomerData,
  requestDataDeletion,
  getExportHistory
} from '../services/dataPortabilityService.js';
import {
  getBreachIncidents
} from '../services/breachNotificationService.js';

const router = express.Router();

/**
 * All compliance routes require authentication
 * Most require CEO/Admin authorization
 */

// ============= BAA Management =============

// Get all BAAs
router.get(
  '/baas',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  getBaas
);

// Create BAA
// ? SECURITY FIX: Uses centralized file upload validation
router.post(
  '/baas',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  upload.single('document'),
  handleUploadError,
  async (req, res, next) => {
    try {
      // ? SECURITY FIX: Validate file if it's an image
      if (req.file && req.file.mimetype.startsWith('image/')) {
        await validateImageDimensions(req.file.path);
      }
      next();
    } catch (error) {
      // Clean up invalid file
      if (req.file) {
        const fs = await import('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
      return res.status(400).json({
        success: false,
        message: error.message || 'File validation failed'
      });
    }
  },
  createBaa
);

// Update BAA
router.patch(
  '/baas/:id',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  updateBaa
);

// Renew BAA
router.post(
  '/baas/:id/renew',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  renewBaa
);

// Terminate BAA
router.delete(
  '/baas/:id',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  terminateBaa
);

// ============= Compliance Status =============

// Get overall compliance status
router.get(
  '/status',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin', 'manager'),
  getComplianceStatus
);

// ============= Audit Logs =============

// Get patient audit trail
router.get(
  '/audit/patient/:customerId',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin', 'provider'),
  getPatientAuditTrail
);

// Generate compliance report
router.get(
  '/audit/report/:salonId',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  generateComplianceReport
);

// ============= Encryption Key Rotation =============

// Manual key rotation (emergency use)
router.post(
  '/encryption/rotate',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo'),
  manualKeyRotation
);

// Get key rotation status
router.get(
  '/encryption/status',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  getRotationStatus
);

// ============= Data Portability (GDPR) =============

// Export customer data
router.get(
  '/data-export/:customerId',
  authMiddleware.protect,
  exportCustomerData
);

// Request data deletion
router.post(
  '/data-deletion/:customerId',
  authMiddleware.protect,
  requestDataDeletion
);

// Get export history
router.get(
  '/data-export-history/:customerId',
  authMiddleware.protect,
  getExportHistory
);

// ============= Breach Management =============

// Get breach incidents
router.get(
  '/breaches',
  authMiddleware.protect,
  checkFeatureAccess('hipaaCompliance'),
  authMiddleware.authorize('ceo', 'admin'),
  getBreachIncidents
);

export default router;
