/**
 * CRM Routes - Customer Relationship Management
 *
 * @route /api/crm
 */

import express from 'express';
import { body } from 'express-validator';
import { validateBody } from '../middleware/validationMiddleware.js';
import paginationMiddleware from '../middleware/paginationMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getCustomers,
  getCustomerDetails,
  getCRMStats,
  addCustomerNote
} from '../controllers/crmController.js';

const router = express.Router();

// All routes require authentication (applied in server.js)
router.use(authMiddleware.requireRole('salon_owner', 'employee', 'ceo'));

/**
 * @route   GET /api/crm/customers
 * @desc    Get all customers for the salon
 * @access  Protected (salon_owner, employee)
 */
router.get('/customers', paginationMiddleware, getCustomers);

/**
 * @route   GET /api/crm/customers/:email
 * @desc    Get customer details with booking history
 * @access  Protected (salon_owner, employee)
 */
router.get('/customers/:email', paginationMiddleware, getCustomerDetails);

/**
 * @route   GET /api/crm/stats
 * @desc    Get CRM statistics overview
 * @access  Protected (salon_owner)
 */
router.get('/stats', authMiddleware.requireRole('salon_owner', 'ceo'), getCRMStats);

/**
 * @route   POST /api/crm/customers/:email/notes
 * @desc    Add a note to a customer
 * @access  Protected (salon_owner, employee)
 */
router.post(
  '/customers/:email/notes',
  [body('note').trim().notEmpty().withMessage('Notiz ist erforderlich')],
  validateBody,
  addCustomerNote
);

export default router;
