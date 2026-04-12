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

// Get all employees
router.get('/', employeeController.getAllEmployees);

// Get my stats (must be before /:employeeId)
router.get('/my-stats', employeeController.getMyStats);

// Get employee by ID
router.get('/:employeeId', employeeController.getEmployeeById);

// Update employee
router.put('/:employeeId', employeeController.updateEmployee);

// Delete employee
router.delete('/:employeeId', employeeController.deleteEmployee);

export default router;
