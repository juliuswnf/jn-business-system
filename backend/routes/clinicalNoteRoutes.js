import express from 'express';
import {
  createClinicalNote,
  getClinicalNote,
  getPatientClinicalNotes,
  updateClinicalNote,
  deleteClinicalNote,
  shareClinicalNote
} from '../controllers/clinicalNoteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const { protect } = authMiddleware;

const router = express.Router();

// ?? ALL ROUTES ARE PROTECTED - HIPAA COMPLIANCE
// Every access is logged in AuditLog

// ==================== ROUTES ====================

// Create clinical note (Protected - Practitioner only)
router.post('/', protect, createClinicalNote);

// Get clinical note by ID (Protected - Decrypts content + Audit Log)
router.get('/:id', protect, getClinicalNote);

// Get all clinical notes for a patient (Protected - Batch access logged)
router.get('/patient/:customerId', protect, getPatientClinicalNotes);

// Update clinical note (Protected - Re-encrypts content)
router.patch('/:id', protect, updateClinicalNote);

// Delete clinical note (Protected - Soft delete)
router.delete('/:id', protect, deleteClinicalNote);

// Share clinical note with another practitioner (Protected)
router.post('/:id/share', protect, shareClinicalNote);

export default router;

