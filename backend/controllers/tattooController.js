import TattooProject from '../models/TattooProject.js';
import TattooSession from '../models/TattooSession.js';
import Consent from '../models/Consent.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

/**
 * Tattoo Controller
 * Handles tattoo studio specific operations:
 * - Multi-session projects
 * - Progress tracking
 * - Consent management
 * - Portfolio gallery
 */

// ==================== PROJECTS ====================

/**
 * @route   POST /api/tattoo/projects
 * @desc    Create new tattoo project
 * @access  Private (Business)
 */
export const createProject = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      customerId,
      name,
      description,
      style,
      bodyPart,
      size,
      totalSessions,
      estimatedDuration,
      estimatedPrice,
      artistId,
      referenceImages,
      checklist
    } = req.body;

    // Validate customer exists
    const customer = await Customer.findOne({ _id: customerId, salonId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const project = await TattooProject.create({
      salonId,
      customerId,
      name,
      description,
      style,
      bodyPart,
      size,
      totalSessions,
      estimatedDuration,
      estimatedPrice,
      artistId: artistId || req.user.employeeId,
      referenceImages: referenceImages || [],
      checklist: checklist || []
    });

    await project.populate('customerId', 'firstName lastName email phone');
    await project.populate('artistId', 'firstName lastName');

    logger.log(`âœ… Tattoo project created: ${project.name} for ${customer.firstName} ${customer.lastName}`);

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    logger.error('Error creating tattoo project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
};

/**
 * @route   GET /api/tattoo/projects
 * @desc    Get all tattoo projects with filters
 * @access  Private (Business)
 */
export const getProjects = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { status, customerId, artistId, search } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (artistId) filters.artistId = artistId;
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { style: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await TattooProject.getProjectsWithStats(salonId, filters);

    res.json({
      success: true,
      projects,
      count: projects.length
    });
  } catch (error) {
    logger.error('Error fetching tattoo projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
};

/**
 * @route   GET /api/tattoo/projects/:id
 * @desc    Get single project with all sessions
 * @access  Private (Business)
 */
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const project = await TattooProject.findOne({ _id: id, salonId })
      .populate('customerId', 'firstName lastName email phone')
      .populate('artistId', 'firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get all sessions
    const sessions = await TattooSession.getProjectSessions(id);

    // Get consents
    const consents = await Consent.find({
      salonId,
      projectId: id
    });

    res.json({
      success: true,
      project,
      sessions,
      consents
    });
  } catch (error) {
    logger.error('Error fetching tattoo project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
};

/**
 * @route   PUT /api/tattoo/projects/:id
 * @desc    Update tattoo project
 * @access  Private (Business)
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const updates = req.body;

    // Don't allow updating these fields directly
    delete updates.salonId;
    delete updates.completedSessions;
    delete updates.actualDuration;
    delete updates.actualPrice;

    const project = await TattooProject.findOneAndUpdate(
      { _id: id, salonId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('customerId artistId');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    logger.log(`âœ… Tattoo project updated: ${project.name}`);

    res.json({
      success: true,
      project
    });
  } catch (error) {
    logger.error('Error updating tattoo project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
};

/**
 * @route   DELETE /api/tattoo/projects/:id
 * @desc    Delete tattoo project
 * @access  Private (Business)
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const project = await TattooProject.findOne({ _id: id, salonId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Cancel all sessions first
    await project.cancelProject();

    // Delete all sessions
    await TattooSession.deleteMany({ projectId: id });

    // Delete project
    await project.deleteOne();

    logger.log(`ðŸ—‘ï¸ Tattoo project deleted: ${project.name}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tattoo project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
};

/**
 * @route   GET /api/tattoo/projects/stats
 * @desc    Get project statistics for dashboard
 * @access  Private (Business)
 */
export const getProjectStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const stats = await TattooProject.getDashboardStats(salonId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
};

// ==================== SESSIONS ====================

/**
 * @route   POST /api/tattoo/sessions
 * @desc    Create new tattoo session (with optional booking)
 * @access  Private (Business)
 */
export const createSession = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      projectId,
      sessionNumber,
      phase,
      duration,
      price,
      scheduledDate,
      checklist,
      createBooking,
      bookingData
    } = req.body;

    // Validate project
    const project = await TattooProject.findOne({ _id: projectId, salonId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    let session;
    let booking;

    if (createBooking && bookingData) {
      // Create session with linked booking
      const result = await TattooSession.createWithBooking(
        {
          projectId,
          salonId,
          sessionNumber,
          phase,
          duration,
          price,
          scheduledDate,
          checklist: checklist || []
        },
        {
          ...bookingData,
          salonId,
          customerId: project.customerId,
          notes: `Tattoo Session ${sessionNumber}/${project.totalSessions} - ${project.name}`
        }
      );

      session = result.session;
      booking = result.booking;

      // Start project if first session
      if (sessionNumber === 1 && project.status === 'draft') {
        project.startProject();
        await project.save();
      }
    } else {
      // Create standalone session
      session = await TattooSession.create({
        projectId,
        salonId,
        sessionNumber,
        phase,
        duration,
        price,
        scheduledDate,
        checklist: checklist || []
      });
    }

    await session.populate('bookingId');

    logger.log(`âœ… Tattoo session created: Session ${sessionNumber} for project ${project.name}`);

    res.status(201).json({
      success: true,
      session,
      booking
    });
  } catch (error) {
    logger.error('Error creating tattoo session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
};

/**
 * @route   GET /api/tattoo/sessions/:projectId
 * @desc    Get all sessions for a project
 * @access  Private (Business)
 */
export const getProjectSessions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const salonId = req.user.salonId;

    // Verify project belongs to salon
    const project = await TattooProject.findOne({ _id: projectId, salonId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const sessions = await TattooSession.getProjectSessions(projectId);

    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error) {
    logger.error('Error fetching project sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
};

/**
 * @route   PUT /api/tattoo/sessions/:id
 * @desc    Update tattoo session
 * @access  Private (Business)
 */
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const updates = req.body;

    const session = await TattooSession.findOneAndUpdate(
      { _id: id, salonId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('bookingId');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    logger.log(`âœ… Tattoo session updated: Session ${session.sessionNumber}`);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    logger.error('Error updating tattoo session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
};

/**
 * @route   POST /api/tattoo/sessions/:id/complete
 * @desc    Mark session as completed and update progress
 * @access  Private (Business)
 */
export const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, notes, duration, price } = req.body;
    const salonId = req.user.salonId;

    const session = await TattooSession.findOne({ _id: id, salonId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Update duration and price if provided
    if (duration) session.duration = duration;
    if (price) session.price = price;

    // Complete session
    await session.completeSession(progress, notes);

    logger.log(`âœ… Tattoo session completed: Session ${session.sessionNumber} - ${progress}% progress`);

    res.json({
      success: true,
      session,
      message: 'Session completed successfully'
    });
  } catch (error) {
    logger.error('Error completing tattoo session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session'
    });
  }
};

/**
 * @route   POST /api/tattoo/sessions/:id/photos
 * @desc    Upload photos to session
 * @access  Private (Business)
 */
export const uploadSessionPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos, type } = req.body; // type: before/during/after
    const salonId = req.user.salonId;

    const session = await TattooSession.findOne({ _id: id, salonId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos provided'
      });
    }

    await session.addPhotos(photos, type || 'during');

    logger.log(`ðŸ“¸ Photos uploaded to session ${session.sessionNumber}: ${photos.length} photos`);

    res.json({
      success: true,
      session,
      message: `${photos.length} photo(s) uploaded successfully`
    });
  } catch (error) {
    logger.error('Error uploading session photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photos'
    });
  }
};

// ==================== CONSENTS ====================

/**
 * @route   POST /api/tattoo/consents
 * @desc    Create new consent form
 * @access  Private (Business)
 */
export const createConsent = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { customerId, projectId, type, consentText, expiresAt } = req.body;

    // Validate customer
    const customer = await Customer.findOne({ _id: customerId, salonId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const consent = await Consent.create({
      salonId,
      customerId,
      projectId,
      type,
      consentText,
      expiresAt
    });

    await consent.populate('customerId', 'firstName lastName email');
    if (projectId) {
      await consent.populate('projectId', 'name');
    }

    logger.log(`ðŸ“ Consent created: ${type} for ${customer.firstName} ${customer.lastName}`);

    res.status(201).json({
      success: true,
      consent
    });
  } catch (error) {
    logger.error('Error creating consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consent'
    });
  }
};

/**
 * @route   GET /api/tattoo/consents/:customerId
 * @desc    Get all consents for a customer
 * @access  Private (Business)
 */
export const getCustomerConsents = async (req, res) => {
  try {
    const { customerId } = req.params;
    const salonId = req.user.salonId;

    const consents = await Consent.getCustomerConsents(salonId, customerId);

    res.json({
      success: true,
      consents,
      count: consents.length
    });
  } catch (error) {
    logger.error('Error fetching customer consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consents'
    });
  }
};

/**
 * @route   POST /api/tattoo/consents/:id/sign
 * @desc    Sign consent form
 * @access  Private (Business/Customer)
 */
export const signConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, ipAddress, userAgent } = req.body;
    const salonId = req.user.salonId || req.salon?._id;

    const consent = await Consent.findOne({ _id: id, salonId });
    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent not found'
      });
    }

    if (consent.status === 'signed') {
      return res.status(400).json({
        success: false,
        error: 'Consent already signed'
      });
    }

    await consent.sign(signature, { ipAddress, userAgent });

    logger.log(`âœ… Consent signed: ${consent.type} by customer ${consent.customerId}`);

    res.json({
      success: true,
      consent,
      message: 'Consent signed successfully'
    });
  } catch (error) {
    logger.error('Error signing consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign consent'
    });
  }
};

/**
 * @route   GET /api/tattoo/consents/:id/pdf
 * @desc    Download consent as PDF
 * @access  Private (Business)
 */
export const downloadConsentPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const consent = await Consent.findOne({ _id: id, salonId })
      .populate('customerId', 'firstName lastName email')
      .populate('projectId', 'name');

    if (!consent) {
      return res.status(404).json({
        success: false,
        error: 'Consent not found'
      });
    }

    // TODO: Generate actual PDF using PDFKit
    const pdfInfo = await consent.generatePDF();

    res.json({
      success: true,
      pdf: pdfInfo,
      message: 'PDF generation not yet implemented - placeholder response'
    });
  } catch (error) {
    logger.error('Error generating consent PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF'
    });
  }
};

// ==================== PORTFOLIO ====================

/**
 * @route   GET /api/tattoo/portfolio/:salonId
 * @desc    Get public portfolio gallery (completed projects with photos)
 * @access  Public
 */
export const getPortfolio = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { style, bodyPart, limit = 20 } = req.query;

    const filters = { salonId, status: 'completed' };
    if (style) filters.style = style;
    if (bodyPart) filters.bodyPart = bodyPart;

    // Get completed projects
    const projects = await TattooProject.find(filters)
      .populate('artistId', 'firstName lastName')
      .limit(parseInt(limit))
      .sort({ completedDate: -1 });

    // Get sessions with photos for each project
    const portfolioItems = await Promise.all(
      projects.map(async (project) => {
        const sessions = await TattooSession.find({
          projectId: project._id,
          status: 'completed',
          $or: [
            { 'photos.0': { $exists: true } },
            { 'afterPhotos.0': { $exists: true } }
          ]
        }).select('photos afterPhotos sessionNumber');

        // Collect all photos
        const allPhotos = sessions.reduce((acc, session) => {
          const sessionPhotos = [...session.photos, ...session.afterPhotos]
            .map(p => ({
              url: p.url,
              caption: p.caption,
              sessionNumber: session.sessionNumber
            }));
          return [...acc, ...sessionPhotos];
        }, []);

        return {
          id: project._id,
          name: project.name,
          style: project.style,
          bodyPart: project.bodyPart,
          size: project.size,
          artist: project.artistId ? `${project.artistId.firstName} ${project.artistId.lastName}` : null,
          completedDate: project.completedDate,
          photos: allPhotos,
          totalSessions: project.totalSessions
        };
      })
    );

    // Filter out projects with no photos
    const portfolioWithPhotos = portfolioItems.filter(item => item.photos.length > 0);

    res.json({
      success: true,
      portfolio: portfolioWithPhotos,
      count: portfolioWithPhotos.length
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio'
    });
  }
};
