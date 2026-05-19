/**
 * Multi-Location Routes
 *
 * @route /api/locations
 */

import express from 'express';
import Joi from 'joi';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateBody, validateParams } from '../middleware/validationMiddleware.js';
import {
  getLocations,
  getConsolidatedDashboard,
  addLocation,
  switchLocation,
  removeLocation
} from '../controllers/multiLocationController.js';

const router = express.Router();

const addLocationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  businessType: Joi.string().trim().max(80).optional(),
  address: Joi.alternatives().try(
    Joi.string().trim().max(500),
    Joi.object().unknown(true)
  ).optional()
});

const salonIdParamSchema = Joi.object({
  salonId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required().messages({
    'string.pattern.base': 'Ungültige salonId'
  })
});

// All routes require authentication (applied in server.js)
router.use(authMiddleware.authorize('ceo', 'salon_owner'));

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
  validateBody(addLocationSchema),
  addLocation
);

/**
 * @route   POST /api/locations/:salonId/switch
 * @desc    Switch active location context
 * @access  Protected
 */
router.post('/:salonId/switch', validateParams(salonIdParamSchema), switchLocation);

/**
 * @route   DELETE /api/locations/:salonId
 * @desc    Remove a location
 * @access  Protected (Enterprise tier)
 */
router.delete('/:salonId', validateParams(salonIdParamSchema), removeLocation);

export default router;
