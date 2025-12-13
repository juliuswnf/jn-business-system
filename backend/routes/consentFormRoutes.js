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

const { protect } = authMiddleware;

const router = express.Router();

// ==================== ROUTES ====================

// Create consent form (Public - Customer signs)
router.post('/', createConsentForm);

// Get customer's consents (Public/Protected)
router.get('/customer/:customerId', getCustomerConsents);

// Get consent by ID (Public/Protected)
router.get('/:id', getConsentById);

// Revoke consent (Protected - Customer or Admin)
router.patch('/:id/revoke', protect, revokeConsent);

// Check consent validity (Public - For booking flow)
router.get('/check/:customerId/:consentType', checkConsentValidity);

// Get expiring consents (Protected - Salon admin)
router.get('/salon/:salonId/expiring', protect, getExpiringConsents);

// Download consent PDF (Public/Protected)
router.get('/:id/pdf', downloadConsentPDF);

// Add witness signature (Protected)
router.post('/:id/witness', protect, addWitnessSignature);

// Get all salon consents (Protected - Salon admin)
router.get('/salon/:salonId', protect, getSalonConsents);

export default router;

