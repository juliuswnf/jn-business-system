import express from 'express';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
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
  authenticateToken,
  authorize(['ceo', 'admin']),
  getBaas
);

// Create BAA
router.post(
  '/baas',
  authenticateToken,
  authorize(['ceo', 'admin']),
  upload.single('document'),
  createBaa
);

// Update BAA
router.patch(
  '/baas/:id',
  authenticateToken,
  authorize(['ceo', 'admin']),
  updateBaa
);

// Renew BAA
router.post(
  '/baas/:id/renew',
  authenticateToken,
  authorize(['ceo', 'admin']),
  renewBaa
);

// Terminate BAA
router.delete(
  '/baas/:id',
  authenticateToken,
  authorize(['ceo', 'admin']),
  terminateBaa
);

// ============= Compliance Status =============

// Get overall compliance status
router.get(
  '/status',
  authenticateToken,
  authorize(['ceo', 'admin', 'manager']),
  getComplianceStatus
);

// ============= Audit Logs =============

// Get patient audit trail
router.get(
  '/audit/patient/:customerId',
  authenticateToken,
  authorize(['ceo', 'admin', 'provider']),
  getPatientAuditTrail
);

// Generate compliance report
router.get(
  '/audit/report/:salonId',
  authenticateToken,
  authorize(['ceo', 'admin']),
  generateComplianceReport
);

// ============= Encryption Key Rotation =============

// Manual key rotation (emergency use)
router.post(
  '/encryption/rotate',
  authenticateToken,
  authorize(['ceo']),
  manualKeyRotation
);

// Get key rotation status
router.get(
  '/encryption/status',
  authenticateToken,
  authorize(['ceo', 'admin']),
  getRotationStatus
);

// ============= Data Portability (GDPR) =============

// Export customer data
router.get(
  '/data-export/:customerId',
  authenticateToken,
  exportCustomerData
);

// Request data deletion
router.post(
  '/data-deletion/:customerId',
  authenticateToken,
  requestDataDeletion
);

// Get export history
router.get(
  '/data-export-history/:customerId',
  authenticateToken,
  getExportHistory
);

// ============= Breach Management =============

// Get breach incidents
router.get(
  '/breaches',
  authenticateToken,
  authorize(['ceo', 'admin']),
  getBreachIncidents
);

export default router;
