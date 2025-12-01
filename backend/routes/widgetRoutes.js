import express from 'express';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { validateBooking } from '../middleware/validationMiddleware.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * Widget Routes - Embeddable Booking Widget API
 * Public endpoints für externe Salon-Websites
 * Kein Auth erforderlich - Slug-basiert
 */

// ==================== GET WIDGET CONFIG ====================
router.get('/config/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const salon = await Salon.findOne({ slug })
      .select('name logo primaryColor secondaryColor openingHours address phone email');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      config: {
        salonName: salon.name,
        logo: salon.logo,
        primaryColor: salon.primaryColor || '#3B82F6',
        secondaryColor: salon.secondaryColor || '#1E40AF',
        openingHours: salon.openingHours,
        address: salon.address,
        phone: salon.phone,
        email: salon.email
      }
    });
  } catch (error) {
    console.error('Widget Config Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading widget configuration'
    });
  }
});

// ==================== GET AVAILABLE SERVICES ====================
router.get('/services/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const services = await Service.find({ 
      salonId: salon._id,
      isActive: true 
    }).select('name description price duration category');

    res.status(200).json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Widget Services Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading services'
    });
  }
});

// ==================== GET AVAILABLE TIME SLOTS ====================
router.get('/timeslots/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Date and serviceId required'
      });
    }

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    const existingBookings = await Booking.find({
      salonId: salon._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('date duration');

    const dayOfWeek = requestedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const openingHours = salon.openingHours?.[dayName];
    
    if (!openingHours?.isOpen) {
      return res.status(200).json({
        success: true,
        timeSlots: []
      });
    }

    const [openTime, closeTime] = openingHours.hours.split('-');
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const timeSlots = [];
    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour || 
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      const slotTime = new Date(requestedDate);
      slotTime.setHours(currentHour, currentMinute, 0, 0);

      const isAvailable = !existingBookings.some(booking => {
        const bookingEnd = new Date(booking.date.getTime() + booking.duration * 60000);
        const slotEnd = new Date(slotTime.getTime() + service.duration * 60000);
        return (
          (slotTime >= booking.date && slotTime < bookingEnd) ||
          (slotEnd > booking.date && slotEnd <= bookingEnd)
        );
      });

      if (isAvailable) {
        timeSlots.push(timeString);
      }

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    res.status(200).json({
      success: true,
      timeSlots
    });
  } catch (error) {
    console.error('Widget Timeslots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading time slots'
    });
  }
});

// ==================== CREATE BOOKING (NO AUTH) ====================
router.post('/book/:slug', validateBooking, async (req, res) => {
  try {
    const { slug } = req.params;
    const { customerName, customerEmail, customerPhone, serviceId, date, time, notes } = req.body;

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    let customer = await User.findOne({ email: customerEmail });
    
    if (!customer) {
      customer = await User.create({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        role: 'customer',
        emailVerified: false,
        password: Math.random().toString(36).slice(-8)
      });
    }

    const [hours, minutes] = time.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(hours, minutes, 0, 0);

    const booking = await Booking.create({
      salonId: salon._id,
      customerId: customer._id,
      serviceId: service._id,
      date: bookingDate,
      duration: service.duration,
      price: service.price,
      status: 'pending',
      notes,
      customerName,
      customerEmail,
      customerPhone
    });

    try {
      await emailService.sendBookingConfirmation(booking._id);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        salonName: salon.name,
        serviceName: service.name,
        date: bookingDate,
        customerName,
        customerEmail,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Widget Booking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
});

export default router;
