import express from 'express';
import salonController from '../controllers/salonController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication (handled by server.js)
// Routes are protected by authMiddleware.protect in server.js

// ==================== SALON MANAGEMENT ====================

// Get salon info
router.get('/info', salonController.getSalonInfo);
router.get('/:salonId/info', salonController.getSalonInfo);

// Update salon
router.put('/update', salonController.updateSalon);
router.put('/:salonId/update', salonController.updateSalon);

// Get salon services
router.get('/services', salonController.getSalonServices);
router.get('/:salonId/services', salonController.getSalonServices);

// Get salon bookings
router.get('/bookings', salonController.getSalonBookings);
router.get('/:salonId/bookings', salonController.getSalonBookings);

// Get salon stats
router.get('/stats', salonController.getSalonStats);
router.get('/:salonId/stats', salonController.getSalonStats);

// ==================== DASHBOARD (SIMPLE) ====================

// Salon dashboard - returns basic salon info + stats
router.get('/dashboard', async (req, res) => {
  try {
    const salonId = req.user.salonId;
    
    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'No salon associated with this user'
      });
    }

    // Reuse existing controllers
    const salon = await salonController.getSalonInfo(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

export default router;
