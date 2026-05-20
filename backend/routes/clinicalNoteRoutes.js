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

const { protect, requireRole } = authMiddleware;
const requireClinicalNoteRole = requireRole('salon_owner', 'employee', 'admin', 'ceo');

const router = express.Router();

// ?? ALL ROUTES ARE PROTECTED - HIPAA COMPLIANCE
// Every access is logged in AuditLog

// ==================== ROUTES ====================

// Create clinical note (Protected - Practitioner only)
router.post('/', protect, requireClinicalNoteRole, createClinicalNote);

// Get clinical note by ID (Protected - Decrypts content + Audit Log)
router.get('/:id', protect, requireClinicalNoteRole, getClinicalNote);

// Get all clinical notes for a patient (Protected - Batch access logged)
router.get('/patient/:customerId', protect, requireClinicalNoteRole, getPatientClinicalNotes);

// Update clinical note (Protected - Re-encrypts content)
router.patch('/:id', protect, requireClinicalNoteRole, updateClinicalNote);

// Delete clinical note (Protected - Soft delete)
router.delete('/:id', protect, requireClinicalNoteRole, deleteClinicalNote);

// Share clinical note with another practitioner (Protected)
router.post('/:id/share', protect, requireClinicalNoteRole, shareClinicalNote);

export default router;

