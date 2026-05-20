import express from 'express';
import * as supportController from '../controllers/supportController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateContentType } from '../middleware/securityMiddleware.js';

const router = express.Router();
const requireSupportRole = authMiddleware.requireRole('customer', 'employee', 'salon_owner', 'admin', 'ceo', 'business');

/**
 * Customer Support Routes
 * All routes require authentication
 */

// Create a new support ticket
router.post(
  '/tickets',
  authMiddleware.protect,
  requireSupportRole,
  validateContentType,
  supportController.createTicket
);

// Get all tickets for current user
router.get(
  '/tickets',
  authMiddleware.protect,
  requireSupportRole,
  supportController.getMyTickets
);

// Get single ticket details
router.get(
  '/tickets/:ticketId',
  authMiddleware.protect,
  requireSupportRole,
  supportController.getTicketDetails
);

// Add message to ticket
router.post(
  '/tickets/:ticketId/messages',
  authMiddleware.protect,
  requireSupportRole,
  validateContentType,
  supportController.addMessage
);

// Close ticket
router.patch(
  '/tickets/:ticketId/close',
  authMiddleware.protect,
  requireSupportRole,
  supportController.closeTicket
);

export default router;
