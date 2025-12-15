import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
  createSession,
  getProjectSessions,
  updateSession,
  completeSession,
  uploadSessionPhotos,
  createConsent,
  getCustomerConsents,
  signConsent,
  downloadConsentPDF,
  getPortfolio
} from '../controllers/tattooController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PROJECTS ====================
router.post('/projects', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), createProject);
router.get('/projects', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), getProjects);
router.get('/projects/stats', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), getProjectStats);
router.get('/projects/:id', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), getProject);
router.put('/projects/:id', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), updateProject);
router.delete('/projects/:id', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), deleteProject);

// ==================== SESSIONS ====================
router.post('/sessions', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), createSession);
router.get('/sessions/:projectId', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), getProjectSessions);
router.put('/sessions/:id', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), updateSession);
router.post('/sessions/:id/complete', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), completeSession);
router.post('/sessions/:id/photos', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), uploadSessionPhotos);

// ==================== CONSENTS ====================
router.post('/consents', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), createConsent);
router.get('/consents/:customerId', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), getCustomerConsents);
router.post('/consents/:id/sign', authMiddleware.protect, signConsent); // Customers can also sign
router.get('/consents/:id/pdf', authMiddleware.protect, authMiddleware.authorize('business', 'ceo'), downloadConsentPDF);

// ==================== PORTFOLIO (Public) ====================
router.get('/portfolio/:salonId', getPortfolio); // No auth - public gallery

export default router;
