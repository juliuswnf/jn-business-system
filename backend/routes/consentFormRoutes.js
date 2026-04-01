import express from 'express';
import {
  createConsentForm,
  getCustomerConsents,
  getConsentById,
  revokeConsent,
  checkConsentValidity,
  getExpiringConsents,
  downloadConsentPDF,
  addWitnessSignature,
  getSalonConsents
} from '../controllers/consentFormController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const { protect, authorize } = authMiddleware;

const router = express.Router();

// ==================== ROUTES ====================

// Create consent form (Public - Customer signs)
router.post('/', createConsentForm);

// Get customer's consents (Protected)
router.get('/customer/:customerId', protect, getCustomerConsents);

// Check consent validity (Protected)
router.get('/check/:customerId/:consentType', protect, checkConsentValidity);

// Get expiring consents (Protected - Salon admin)
router.get('/salon/:salonId/expiring', protect, authorize('salon_owner', 'employee', 'admin', 'ceo'), getExpiringConsents);

// Get all salon consents (Protected - Salon admin)
router.get('/salon/:salonId', protect, authorize('salon_owner', 'employee', 'admin', 'ceo'), getSalonConsents);

// Download consent PDF (Protected)
router.get('/:id/pdf', protect, downloadConsentPDF);

// Add witness signature (Protected)
router.post('/:id/witness', protect, authorize('salon_owner', 'employee', 'admin', 'ceo'), addWitnessSignature);

// Revoke consent (Protected)
router.patch('/:id/revoke', protect, revokeConsent);
// Backward compatibility for existing clients using POST
router.post('/:id/revoke', protect, revokeConsent);

// Get consent by ID (Protected)
router.get('/:id', protect, getConsentById);

export default router;

