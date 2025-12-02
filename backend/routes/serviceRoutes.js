import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Get all services for salon
router.get('/', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);
    const services = await Service.find({ salonId: req.user.salonId || req.user._id })
      .select('-__v')
      .limit(100);
    
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create service
router.post('/', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);
    const service = new Service({
      ...req.body,
      salonId: req.user.salonId || req.user._id
    });
    
    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
