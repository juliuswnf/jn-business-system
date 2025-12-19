/**
 * Multi-Location Routes
 *
 * @route /api/locations
 */

import express from 'express';
import { body } from 'express-validator';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  getLocations,
  getConsolidatedDashboard,
  addLocation,
  switchLocation,
  removeLocation
} from '../controllers/multiLocationController.js';

const router = express.Router();

// All routes require authentication (applied in server.js)

/**
 * @route   GET /api/locations
 * @desc    Get all locations for the user
 * @access  Protected (Enterprise tier)
 */
router.get('/', getLocations);

/**
 * @route   GET /api/locations/dashboard
 * @desc    Get consolidated dashboard for all locations
 * @access  Protected (Enterprise tier)
 */
router.get('/dashboard', getConsolidatedDashboard);

/**
 * @route   POST /api/locations
 * @desc    Add a new location
 * @access  Protected (Enterprise tier)
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name ist erforderlich'),
    body('email').isEmail().withMessage('Gültige E-Mail erforderlich')
  ],
  validateBody,
  addLocation
);

/**
 * @route   POST /api/locations/:salonId/switch
 * @desc    Switch active location context
 * @access  Protected
 */
router.post('/:salonId/switch', switchLocation);

/**
 * @route   DELETE /api/locations/:salonId
 * @desc    Remove a location
 * @access  Protected (Enterprise tier)
 */
router.delete('/:salonId', removeLocation);

export default router;
