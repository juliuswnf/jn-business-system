import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import * as workflowController from '../controllers/workflowController.js';

const router = express.Router();

/**
 * ==================== WORKFLOW MANAGEMENT ====================
 * Manage industry-specific workflows
 */

// GET /api/workflows/industries - Get available industries (public info)
router.get('/industries', workflowController.getAvailableIndustries);

// POST /api/workflows/enable - Enable workflow (Business/CEO only)
router.post(
  '/enable',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner'),
  workflowController.enableWorkflow
);

// GET /api/workflows/:salonId - Get salon workflows
router.get(
  '/:salonId',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.getSalonWorkflows
);

// PUT /api/workflows/:salonId/:industry - Update workflow config
router.put(
  '/:salonId/:industry',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner'),
  workflowController.updateWorkflowConfig
);

/**
 * ==================== PROJECT MANAGEMENT ====================
 * Manage workflow projects (tattoo projects, treatment plans, etc.)
 */

// POST /api/workflow-projects - Create project
router.post(
  '/projects',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.createProject
);

// GET /api/workflow-projects - Get all projects
router.get(
  '/projects',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getProjects
);

// GET /api/workflow-projects/stats - Get stats
router.get(
  '/projects/stats',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.getProjectStats
);

// GET /api/workflow-projects/:id - Get single project
router.get(
  '/projects/:id',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getProject
);

// PUT /api/workflow-projects/:id - Update project
router.put(
  '/projects/:id',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.updateProject
);

// DELETE /api/workflow-projects/:id - Delete project
router.delete(
  '/projects/:id',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.deleteProject
);

/**
 * ==================== SESSION MANAGEMENT ====================
 * Manage workflow sessions
 */

// POST /api/workflow-sessions - Create session
router.post(
  '/sessions',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.createSession
);

// GET /api/workflow-sessions/:projectId - Get project sessions
router.get(
  '/sessions/:projectId',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getProjectSessions
);

// PUT /api/workflow-sessions/:id - Update session
router.put(
  '/sessions/:id',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.updateSession
);

// POST /api/workflow-sessions/:id/complete - Complete session
router.post(
  '/sessions/:id/complete',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.completeSession
);

// POST /api/workflow-sessions/:id/photos - Upload photos
router.post(
  '/sessions/:id/photos',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.uploadSessionPhotos
);

// DELETE /api/workflow-sessions/:id/photos/:photoId - Delete photo
router.delete(
  '/sessions/:id/photos/:photoId',
  authMiddleware.protect,
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.deleteSessionPhoto
);

/**
 * ==================== PACKAGE MANAGEMENT ====================
 * Manage packages (credit-based, time-based)
 */

// POST /api/packages - Create package
router.post(
  '/packages',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.createPackage
);

// GET /api/packages/:salonId - Get salon packages
router.get(
  '/packages/:salonId',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getSalonPackages
);

// GET /api/packages/customer/:customerId - Get customer packages
router.get(
  '/packages/customer/:customerId',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getCustomerPackages
);

// POST /api/packages/:id/use - Use package credit
router.post(
  '/packages/:id/use',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.usePackageCredit
);

// PUT /api/packages/:id - Update package
router.put(
  '/packages/:id',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.updatePackage
);

/**
 * ==================== MEMBERSHIP MANAGEMENT ====================
 * Manage memberships (recurring subscriptions)
 */

// POST /api/memberships - Create membership
router.post(
  '/memberships',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.createMembership
);

// GET /api/memberships/:salonId - Get salon memberships
router.get(
  '/memberships/:salonId',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.getSalonMemberships
);

// GET /api/memberships/customer/:customerId - Get customer membership
router.get(
  '/memberships/customer/:customerId',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin', 'employee'),
  workflowController.getCustomerMembership
);

// PUT /api/memberships/:id/cancel - Cancel membership
router.put(
  '/memberships/:id/cancel',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.cancelMembership
);

// POST /api/memberships/:id/pause - Pause membership
router.post(
  '/memberships/:id/pause',
  authMiddleware.protect,
  checkFeatureAccess('servicePackages'),
  authMiddleware.authorize('business', 'ceo', 'salon_owner', 'admin'),
  workflowController.pauseMembership
);

/**
 * ==================== PORTFOLIO (PUBLIC) ====================
 * Public portfolio gallery
 */

// GET /api/portfolio/:salonId - Get portfolio (NO AUTH - Public)
router.get('/portfolio/:salonId', workflowController.getPortfolio);

export default router;
