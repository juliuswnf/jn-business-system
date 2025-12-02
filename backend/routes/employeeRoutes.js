import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import employeeController from '../controllers/employeeController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Get all employees
router.get('/', employeeController.getAllEmployees);

// Get employee by ID
router.get('/:employeeId', employeeController.getEmployeeById);

// Update employee
router.put('/:employeeId', employeeController.updateEmployee);

// Delete employee
router.delete('/:employeeId', employeeController.deleteEmployee);

export default router;
