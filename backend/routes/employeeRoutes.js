import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as employeeController from '../controllers/employeeController.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (no auth required) ====================
// Must be declared BEFORE router.use(protect) to skip authentication

// Employee activates account via invite link
router.post('/setup-password', employeeController.setupEmployeePassword);

// ==================== PROTECTED ROUTES (auth required) ====================
router.use(authMiddleware.protect);

// Invite a new employee (salon_owner only)
router.post('/invite', authMiddleware.requireRole('salon_owner'), employeeController.inviteEmployee);

// Get all employees (management only)
router.get('/', authMiddleware.requireRole('salon_owner', 'ceo'), employeeController.getAllEmployees);

// Get my stats (must be before /:employeeId)
router.get('/my-stats', employeeController.getMyStats);

// Get employee by ID (management only)
router.get('/:employeeId', authMiddleware.requireRole('salon_owner', 'ceo'), employeeController.getEmployeeById);

// Update employee (management only)
router.put('/:employeeId', authMiddleware.requireRole('salon_owner', 'ceo'), employeeController.updateEmployee);

// Delete employee (management only)
router.delete('/:employeeId', authMiddleware.requireRole('salon_owner', 'ceo'), employeeController.deleteEmployee);

export default router;
