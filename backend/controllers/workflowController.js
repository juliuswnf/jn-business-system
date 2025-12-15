import IndustryWorkflow from '../models/IndustryWorkflow.js';
import WorkflowProject from '../models/WorkflowProject.js';
import WorkflowSession from '../models/WorkflowSession.js';
import Consent from '../models/Consent.js';
import Package from '../models/Package.js';
import Membership from '../models/Membership.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

/**
 * ==================== WORKFLOW MANAGEMENT ====================
 */

// GET /api/workflows/industries - Get all available industries
export const getAvailableIndustries = async (req, res) => {
  try {
    const industries = IndustryWorkflow.getAvailableIndustries();

    res.json({
      success: true,
      count: industries.length,
      data: industries
    });
  } catch (error) {
    logger.error('Error fetching industries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industries',
      error: error.message
    });
  }
};

// POST /api/workflows/enable - Enable workflow for salon
export const enableWorkflow = async (req, res) => {
  try {
    const { industry, features } = req.body;
    const salonId = req.user.salonId;

    if (!industry) {
      return res.status(400).json({
        success: false,
        message: 'Industry is required'
      });
    }

    const workflow = await IndustryWorkflow.enableWorkflow(salonId, industry, features);

    logger.info(`Workflow enabled: ${industry} for salon ${salonId}`);

    res.status(201).json({
      success: true,
      message: `${workflow.displayName} workflow enabled`,
      data: workflow
    });
  } catch (error) {
    logger.error('Error enabling workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable workflow',
      error: error.message
    });
  }
};

// GET /api/workflows/:salonId - Get salon workflows
export const getSalonWorkflows = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { enabled } = req.query;

    const workflows = await IndustryWorkflow.getSalonWorkflows(
      salonId,
      enabled === 'true'
    );

    res.json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    logger.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message
    });
  }
};

// PUT /api/workflows/:salonId/:industry - Update workflow config
export const updateWorkflowConfig = async (req, res) => {
  try {
    const { salonId, industry } = req.params;
    const { config, features } = req.body;

    const workflow = await IndustryWorkflow.findOne({ salonId, industry });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    if (config) {
      await workflow.updateConfig(config);
    }

    if (features) {
      workflow.features = features;
      await workflow.save();
    }

    res.json({
      success: true,
      message: 'Workflow updated',
      data: workflow
    });
  } catch (error) {
    logger.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
      error: error.message
    });
  }
};

/**
 * ==================== PROJECT MANAGEMENT ====================
 */

// POST /api/workflow-projects - Create project
export const createProject = async (req, res) => {
  try {
    const {
      customerId,
      industry,
      type,
      name,
      description,
      totalSessions,
      metadata,
      totalPrice,
      artistId,
      checklist
    } = req.body;

    const salonId = req.user.salonId;

    // Check if workflow is enabled
    const workflow = await IndustryWorkflow.findOne({ salonId, industry, enabled: true });
    if (!workflow) {
      return res.status(400).json({
        success: false,
        message: `${industry} workflow is not enabled for this salon`
      });
    }

    const project = await WorkflowProject.create({
      salonId,
      customerId,
      industry,
      type,
      name,
      description,
      totalSessions: totalSessions || 1,
      metadata: new Map(Object.entries(metadata || {})),
      totalPrice: totalPrice || 0,
      artistId,
      checklist: checklist || []
    });

    logger.info(`Project created: ${project._id} for salon ${salonId}`);

    res.status(201).json({
      success: true,
      message: 'Project created',
      data: project
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

// GET /api/workflow-projects - Get all projects
export const getProjects = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const filters = {
      industry: req.query.industry,
      status: req.query.status,
      customerId: req.query.customerId,
      artistId: req.query.artistId,
      type: req.query.type,
      search: req.query.search
    };

    const projects = await WorkflowProject.getProjectsWithStats(salonId, filters);

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

// GET /api/workflow-projects/:id - Get single project
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await WorkflowProject.findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('artistId', 'firstName lastName')
      .populate('sessions');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get consents for this project
    const consents = await Consent.find({ projectId: id });

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        consents
      }
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

// PUT /api/workflow-projects/:id - Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating auto-calculated fields
    delete updates.progress;
    delete updates.completedSessions;
    delete updates.completedDate;

    const project = await WorkflowProject.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    logger.info(`Project updated: ${id}`);

    res.json({
      success: true,
      message: 'Project updated',
      data: project
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

// DELETE /api/workflow-projects/:id - Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await WorkflowProject.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Cancel project (cancels all sessions)
    await project.cancelProject();

    // Delete project
    await WorkflowProject.findByIdAndDelete(id);

    logger.info(`Project deleted: ${id}`);

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

// GET /api/workflow-projects/stats - Get dashboard stats
export const getProjectStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { industry } = req.query;

    const stats = await WorkflowProject.getDashboardStats(salonId, industry);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

/**
 * ==================== SESSION MANAGEMENT ====================
 */

// POST /api/workflow-sessions - Create session
export const createSession = async (req, res) => {
  try {
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

    const salonId = req.user.salonId;

    // Get project
    const project = await WorkflowProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let session, booking;

    if (createBooking && bookingData) {
      // Create session with auto-booking
      const result = await WorkflowSession.createWithBooking(
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
          notes: `${project.name} - Session ${sessionNumber}`
        }
      );

      session = result.session;
      booking = result.booking;
    } else {
      // Create session without booking
      session = await WorkflowSession.create({
        projectId,
        salonId,
        sessionNumber,
        phase,
        duration,
        price,
        scheduledDate,
        checklist: checklist || []
      });

      await project.addSession(session._id);
    }

    // Start project if first session
    if (project.status === 'draft') {
      await project.startProject();
    }

    logger.info(`Session created: ${session._id}`);

    res.status(201).json({
      success: true,
      message: 'Session created',
      data: {
        session,
        booking
      }
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

// GET /api/workflow-sessions/:projectId - Get project sessions
export const getProjectSessions = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sessions = await WorkflowSession.getProjectSessions(projectId);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    logger.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// PUT /api/workflow-sessions/:id - Update session
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating status directly (use complete/cancel endpoints)
    delete updates.status;
    delete updates.completedAt;

    const session = await WorkflowSession.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    logger.info(`Session updated: ${id}`);

    res.json({
      success: true,
      message: 'Session updated',
      data: session
    });
  } catch (error) {
    logger.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

// POST /api/workflow-sessions/:id/complete - Complete session
export const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, notes } = req.body;

    const session = await WorkflowSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.completeSession(progress, notes);

    logger.info(`Session completed: ${id}`);

    res.json({
      success: true,
      message: 'Session completed',
      data: session
    });
  } catch (error) {
    logger.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete session',
      error: error.message
    });
  }
};

// POST /api/workflow-sessions/:id/photos - Upload photos
export const uploadSessionPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // Array of { url, type, caption }

    const session = await WorkflowSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.addPhotos(photos);

    logger.info(`Photos added to session: ${id}`);

    res.json({
      success: true,
      message: 'Photos uploaded',
      data: session
    });
  } catch (error) {
    logger.error('Error uploading photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
};

// DELETE /api/workflow-sessions/:id/photos/:photoId - Delete photo
export const deleteSessionPhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;

    const session = await WorkflowSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.deletePhoto(photoId);

    logger.info(`Photo deleted from session: ${id}`);

    res.json({
      success: true,
      message: 'Photo deleted'
    });
  } catch (error) {
    logger.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
};

/**
 * ==================== PACKAGE MANAGEMENT ====================
 */

// POST /api/packages - Create package
export const createPackage = async (req, res) => {
  try {
    const {
      customerId,
      name,
      description,
      type,
      creditsTotal,
      validUntil,
      price,
      services
    } = req.body;

    const salonId = req.user.salonId;

    const packageData = await Package.create({
      salonId,
      customerId,
      name,
      description,
      type: type || 'credit_based',
      creditsTotal: creditsTotal || 0,
      creditsUsed: 0,
      creditsRemaining: creditsTotal || 0,
      validUntil,
      price,
      paidAmount: 0,
      services: services || [],
      status: 'active'
    });

    logger.info(`Package created: ${packageData._id}`);

    res.status(201).json({
      success: true,
      message: 'Package created',
      data: packageData
    });
  } catch (error) {
    logger.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
};

// GET /api/packages/:salonId - Get salon packages
export const getSalonPackages = async (req, res) => {
  try {
    const { salonId } = req.params;
    const filters = {
      status: req.query.status,
      customerId: req.query.customerId,
      type: req.query.type
    };

    const packages = await Package.getSalonPackages(salonId, filters);

    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    logger.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// GET /api/packages/customer/:customerId - Get customer packages
export const getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { active } = req.query;

    const packages = await Package.getCustomerPackages(
      customerId,
      active === 'true'
    );

    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    logger.error('Error fetching customer packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// POST /api/packages/:id/use - Use package credit
export const usePackageCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body;

    const packageData = await Package.findById(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    await packageData.useCredit(bookingId);

    // Update booking to reference package
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { packageId: id });
    }

    logger.info(`Package credit used: ${id}`);

    res.json({
      success: true,
      message: 'Credit used',
      data: packageData
    });
  } catch (error) {
    logger.error('Error using package credit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /api/packages/:id - Update package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const packageData = await Package.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    logger.info(`Package updated: ${id}`);

    res.json({
      success: true,
      message: 'Package updated',
      data: packageData
    });
  } catch (error) {
    logger.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message
    });
  }
};

/**
 * ==================== MEMBERSHIP MANAGEMENT ====================
 */

// POST /api/memberships - Create membership
export const createMembership = async (req, res) => {
  try {
    const {
      customerId,
      plan,
      name,
      description,
      priceMonthly,
      benefits,
      billingCycle,
      creditsMonthly
    } = req.body;

    const salonId = req.user.salonId;

    const membership = await Membership.create({
      salonId,
      customerId,
      plan: plan || 'basic',
      name,
      description,
      priceMonthly,
      benefits: benefits || [],
      billingCycle: billingCycle || 'monthly',
      status: 'active',
      startDate: new Date(),
      creditsMonthly: creditsMonthly || 0,
      creditsUsedThisMonth: 0
    });

    // Calculate first billing date
    await membership.updateBilling();

    logger.info(`Membership created: ${membership._id}`);

    res.status(201).json({
      success: true,
      message: 'Membership created',
      data: membership
    });
  } catch (error) {
    logger.error('Error creating membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create membership',
      error: error.message
    });
  }
};

// GET /api/memberships/:salonId - Get salon memberships
export const getSalonMemberships = async (req, res) => {
  try {
    const { salonId } = req.params;
    const filters = {
      status: req.query.status,
      plan: req.query.plan,
      customerId: req.query.customerId
    };

    const memberships = await Membership.getSalonMemberships(salonId, filters);

    res.json({
      success: true,
      count: memberships.length,
      data: memberships
    });
  } catch (error) {
    logger.error('Error fetching memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memberships',
      error: error.message
    });
  }
};

// GET /api/memberships/customer/:customerId - Get customer membership
export const getCustomerMembership = async (req, res) => {
  try {
    const { customerId } = req.params;

    const membership = await Membership.getCustomerMembership(customerId);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No active membership found'
      });
    }

    res.json({
      success: true,
      data: membership
    });
  } catch (error) {
    logger.error('Error fetching membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership',
      error: error.message
    });
  }
};

// PUT /api/memberships/:id/cancel - Cancel membership
export const cancelMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const membership = await Membership.findById(id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    await membership.cancel(reason);

    logger.info(`Membership cancelled: ${id}`);

    res.json({
      success: true,
      message: 'Membership cancelled',
      data: membership
    });
  } catch (error) {
    logger.error('Error cancelling membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel membership',
      error: error.message
    });
  }
};

// POST /api/memberships/:id/pause - Pause membership
export const pauseMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const membership = await Membership.findById(id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    await membership.pause(reason);

    logger.info(`Membership paused: ${id}`);

    res.json({
      success: true,
      message: 'Membership paused',
      data: membership
    });
  } catch (error) {
    logger.error('Error pausing membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause membership',
      error: error.message
    });
  }
};

/**
 * ==================== PORTFOLIO (PUBLIC) ====================
 */

// GET /api/portfolio/:salonId - Public portfolio gallery
export const getPortfolio = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { industry, limit } = req.query;

    const query = {
      salonId,
      status: 'completed'
    };

    if (industry) {
      query.industry = industry;
    }

    let projects = await WorkflowProject.find(query)
      .populate('sessions')
      .sort({ completedDate: -1 })
      .limit(parseInt(limit) || 50);

    // Filter projects with photos and valid photo consent
    const projectsWithPhotos = [];

    for (const project of projects) {
      // Check photo consent
      const hasConsent = await Consent.hasValidConsent(
        salonId,
        project.customerId,
        'photo_consent'
      );

      if (hasConsent) {
        const sessions = await WorkflowSession.find({ projectId: project._id });
        const allPhotos = sessions.flatMap(s => s.photos || []);

        if (allPhotos.length > 0) {
          projectsWithPhotos.push({
            id: project._id,
            name: project.name,
            industry: project.industry,
            metadata: Object.fromEntries(project.metadata),
            completedDate: project.completedDate,
            photos: allPhotos
          });
        }
      }
    }

    res.json({
      success: true,
      count: projectsWithPhotos.length,
      data: projectsWithPhotos
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error: error.message
    });
  }
};
