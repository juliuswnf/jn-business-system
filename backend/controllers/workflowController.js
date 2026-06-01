import IndustryWorkflow from '../models/IndustryWorkflow.js';
import WorkflowProject from '../models/WorkflowProject.js';
import WorkflowSession from '../models/WorkflowSession.js';
import Consent from '../models/Consent.js';
import Package from '../models/Package.js';
import Membership from '../models/Membership.js';
import Booking from '../models/Booking.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const ALLOWED_INDUSTRIES = ['tattoo', 'salon', 'barbershop', 'medical', 'wellness', 'fitness', 'nail', 'beauty', 'spa', 'piercing', 'aesthetics'];
const ALLOWED_PACKAGE_TYPES = ['session', 'treatment', 'membership', 'bundle', 'subscription', 'custom'];
const hasSalonAccess = (req, salonId) => {
  return req.user?.role === 'ceo' || salonId?.toString() === req.user?.salonId?.toString();
};

const getTrustedSalonObjectId = (req) => {
  const trustedSalonId = req.user?.salonId;
  if (!trustedSalonId || !mongoose.isValidObjectId(String(trustedSalonId))) {
    return null;
  }

  return new mongoose.Types.ObjectId(String(trustedSalonId));
};

const buildTenantScopedByIdFilter = (req, docId) => {
  const filter = { _id: docId };

  if (req.user?.role === 'ceo') {
    return filter;
  }

  const trustedSalonObjectId = getTrustedSalonObjectId(req);
  if (!trustedSalonObjectId) {
    return null;
  }

  filter.salonId = trustedSalonObjectId;
  return filter;
};

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
      message: 'Failed to fetch industries'
    });
  }
};

// POST /api/workflows/enable - Enable workflow for salon
export const enableWorkflow = async (req, res) => {
  try {
    const { industry, features } = req.body;
    const requestedSalonId = req.body?.salonId;
    const salonId = req.user?.role === 'ceo'
      ? (requestedSalonId || req.user?.salonId)
      : req.user?.salonId;

    if (!industry) {
      return res.status(400).json({
        success: false,
        message: 'Industry is required'
      });
    }

    if (!ALLOWED_INDUSTRIES.includes(String(industry))) {
      return res.status(400).json({ success: false, message: 'Invalid industry' });
    }

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    if (
      req.user?.role !== 'ceo' &&
      requestedSalonId &&
      String(requestedSalonId) !== String(req.user?.salonId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - salonId must match authenticated tenant'
      });
    }

    if (!mongoose.isValidObjectId(String(salonId))) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }
    // Cast to ObjectId — breaks taint chain from req.user/req.body into queries
    const safeSalonId = new mongoose.Types.ObjectId(String(salonId));
    // .find() returns value from static array, breaking taint chain
    const safeIndustry = ALLOWED_INDUSTRIES.find(i => i === String(industry));

    const salon = await Salon.findById(safeSalonId)
      .select('subscription.tier subscription.status businessName')
      .lean();

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const tier = salon.subscription?.tier || 'starter';

    if (tier === 'starter') {
      return res.status(403).json({
        success: false,
        message: 'Branchen-Workflows sind ab dem Professional-Tarif verfügbar.',
        code: 'WORKFLOW_FEATURE_NOT_AVAILABLE',
        currentTier: tier,
        requiredTier: 'professional',
        upgradeUrl: '/pricing'
      });
    }

    const existingWorkflow = await IndustryWorkflow.findOne({ salonId: safeSalonId, industry: safeIndustry }).lean();
    const isAlreadyEnabled = existingWorkflow?.enabled === true;

    if (tier === 'professional' && !isAlreadyEnabled) {
      const enabledCount = await IndustryWorkflow.countDocuments({ salonId: safeSalonId, enabled: true });

      if (enabledCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Im Professional-Tarif kann nur 1 Branchen-Workflow gleichzeitig aktiv sein.',
          code: 'WORKFLOW_LIMIT_REACHED',
          currentTier: tier,
          maxActiveWorkflows: 1,
          upgradeUrl: '/pricing'
        });
      }
    }

    const workflow = await IndustryWorkflow.enableWorkflow(safeSalonId, safeIndustry, features);

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
      message: 'Failed to enable workflow'
    });
  }
};

// GET /api/workflows/:salonId - Get salon workflows
export const getSalonWorkflows = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { enabled } = req.query;

    // Enforce tenant isolation: only the owning salon or CEO may access
    if (req.user?.role !== 'ceo' && req.user?.salonId?.toString() !== salonId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

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
      message: 'Failed to fetch workflows'
    });
  }
};

// PUT /api/workflows/:salonId/:industry - Update workflow config
export const updateWorkflowConfig = async (req, res) => {
  try {
    const { salonId, industry } = req.params;
    const { config, features } = req.body;

    if (!ALLOWED_INDUSTRIES.includes(String(industry))) {
      return res.status(400).json({ success: false, message: 'Invalid industry' });
    }

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    // Enforce tenant isolation: only the owning salon or CEO may update
    if (req.user?.role !== 'ceo' && req.user?.salonId?.toString() !== salonId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into queries
    const safeSalonIdUpdate = new mongoose.Types.ObjectId(salonId);
    // .find() returns value from static array, breaking taint chain
    const safeIndustryUpdate = ALLOWED_INDUSTRIES.find(i => i === String(industry));

    const workflow = await IndustryWorkflow.findOne({ salonId: safeSalonIdUpdate, industry: safeIndustryUpdate });

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
      message: 'Failed to update workflow'
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
    if (!ALLOWED_INDUSTRIES.includes(String(industry))) {
      return res.status(400).json({ success: false, message: 'Invalid industry' });
    }
    const workflow = await IndustryWorkflow.findOne({ salonId, industry: String(industry), enabled: true });
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
      message: 'Failed to create project'
    });
  }
};

// GET /api/workflow-projects - Get all projects
export const getProjects = async (req, res) => {
  try {
    const salonId = req.user?.salonId || req.query?.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

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
      message: 'Failed to fetch projects'
    });
  }
};

// GET /api/workflow-projects/:id - Get single project
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    const safeProjectId = new mongoose.Types.ObjectId(id);

    const projectFilter = buildTenantScopedByIdFilter(req, safeProjectId);
    if (!projectFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const project = await WorkflowProject.findOne(projectFilter)
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
    const consents = await Consent.find({ projectId: safeProjectId });

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
      message: 'Failed to fetch project'
    });
  }
};

// PUT /api/workflow-projects/:id - Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    const safeProjectId = new mongoose.Types.ObjectId(id);
    const updates = { ...req.body };

    // Prevent updating auto-calculated fields
    delete updates._id;
    delete updates.salonId;
    delete updates.customerId;
    delete updates.completedDate;
    delete updates.completedBy;
    delete updates.deletedAt;
    delete updates.deletedBy;
    delete updates.progress;
    delete updates.completedSessions;

    const projectFilter = buildTenantScopedByIdFilter(req, safeProjectId);
    if (!projectFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const project = await WorkflowProject.findOne(projectFilter).maxTimeMS(5000);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasSalonAccess(req, project.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    project.set(updates);
    await project.save();

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
      message: 'Failed to update project'
    });
  }
};

// DELETE /api/workflow-projects/:id - Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    const safeProjectId = new mongoose.Types.ObjectId(id);

    const projectFilter = buildTenantScopedByIdFilter(req, safeProjectId);
    if (!projectFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const project = await WorkflowProject.findOne(projectFilter).maxTimeMS(5000);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasSalonAccess(req, project.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Cancel project (cancels all sessions)
    await project.cancelProject();

    // ? SECURITY FIX: Soft delete instead of hard delete
    await project.softDelete(req.user._id);

    logger.info(`Project soft-deleted: ${id}`);

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

// GET /api/workflow-projects/stats - Get dashboard stats
export const getProjectStats = async (req, res) => {
  try {
    const salonId = req.user?.salonId || req.query?.salonId;
    const { industry } = req.query;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    const stats = await WorkflowProject.getDashboardStats(salonId, industry);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
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

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    const safeProjectId = new mongoose.Types.ObjectId(projectId);

    // Get project
    const projectFilter = buildTenantScopedByIdFilter(req, safeProjectId);
    if (!projectFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const project = await WorkflowProject.findOne(projectFilter).maxTimeMS(5000);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasSalonAccess(req, project.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const salonId = project.salonId;

    let session, booking;

    if (createBooking && bookingData) {
      // Create session with auto-booking
      const result = await WorkflowSession.createWithBooking(
        {
          projectId: safeProjectId,
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
        projectId: safeProjectId,
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
      message: 'Failed to create session'
    });
  }
};

// GET /api/workflow-sessions/:projectId - Get project sessions
export const getProjectSessions = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    const safeProjectId = new mongoose.Types.ObjectId(projectId);

    const projectFilter = buildTenantScopedByIdFilter(req, safeProjectId);
    if (!projectFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const project = await WorkflowProject.findOne(projectFilter)
      .select('salonId')
      .maxTimeMS(5000);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasSalonAccess(req, project.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const sessions = await WorkflowSession.getProjectSessions(safeProjectId);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    logger.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
};

// PUT /api/workflow-sessions/:id - Update session
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format' });
    }
    const safeSessionId = new mongoose.Types.ObjectId(id);

    // Prevent updating status directly (use complete/cancel endpoints)
    delete updates.status;
    delete updates.completedAt;

    const sessionFilter = buildTenantScopedByIdFilter(req, safeSessionId);
    if (!sessionFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const session = await WorkflowSession.findOne(sessionFilter)
      .populate('projectId', 'salonId')
      .maxTimeMS(5000);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const ownerSalonId = session.projectId?.salonId || session.salonId;
    if (req.user?.role !== 'ceo' && ownerSalonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    session.set(updates);
    await session.save();

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
      message: 'Failed to update session'
    });
  }
};

// POST /api/workflow-sessions/:id/complete - Complete session
export const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format' });
    }
    const safeSessionId = new mongoose.Types.ObjectId(id);

    const sessionFilter = buildTenantScopedByIdFilter(req, safeSessionId);
    if (!sessionFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const session = await WorkflowSession.findOne(sessionFilter)
      .populate('projectId', 'salonId')
      .maxTimeMS(5000);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const ownerSalonId = session.projectId?.salonId || session.salonId;
    if (!hasSalonAccess(req, ownerSalonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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
      message: 'Failed to complete session'
    });
  }
};

// POST /api/workflow-sessions/:id/photos - Upload photos
export const uploadSessionPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // Array of { url, type, caption }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format' });
    }
    const safeSessionId = new mongoose.Types.ObjectId(id);

    const sessionFilter = buildTenantScopedByIdFilter(req, safeSessionId);
    if (!sessionFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const session = await WorkflowSession.findOne(sessionFilter)
      .populate('projectId', 'salonId')
      .maxTimeMS(5000);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const ownerSalonId = session.projectId?.salonId || session.salonId;
    if (!hasSalonAccess(req, ownerSalonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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
      message: 'Failed to upload photos'
    });
  }
};

// DELETE /api/workflow-sessions/:id/photos/:photoId - Delete photo
export const deleteSessionPhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format' });
    }
    const safeSessionId = new mongoose.Types.ObjectId(id);

    const sessionFilter = buildTenantScopedByIdFilter(req, safeSessionId);
    if (!sessionFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const session = await WorkflowSession.findOne(sessionFilter)
      .populate('projectId', 'salonId')
      .maxTimeMS(5000);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const ownerSalonId = session.projectId?.salonId || session.salonId;
    if (!hasSalonAccess(req, ownerSalonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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
      message: 'Failed to delete photo'
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
      message: 'Failed to create package'
    });
  }
};

// GET /api/packages/:salonId - Get salon packages
export const getSalonPackages = async (req, res) => {
  try {
    const { salonId: rawSalonIdPkg } = req.params;

    if (!rawSalonIdPkg) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    if (!mongoose.isValidObjectId(rawSalonIdPkg)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
    }
    const safeSalonIdPkg = new mongoose.Types.ObjectId(rawSalonIdPkg);

    if (!hasSalonAccess(req, safeSalonIdPkg)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const filters = {
      status: req.query.status,
      customerId: req.query.customerId,
      type: req.query.type
    };

    const query = {
      salonId: safeSalonIdPkg,
      deletedAt: null
    };

    // .find() returns value from static array, breaking taint chain
    const safePackageType = typeof filters.type === 'string'
      ? ALLOWED_PACKAGE_TYPES.find(t => t === filters.type)
      : undefined;
    if (safePackageType) {
      query.type = safePackageType;
    }

    if (typeof filters.status === 'string') {
      query.isActive = filters.status === 'active';
    }

    const packageDocs = await Package.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const packages = packageDocs.map((pkg) => ({
      ...pkg,
      status: pkg.isActive ? 'active' : 'inactive'
    }));

    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    logger.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
};

// GET /api/packages/customer/:customerId - Get customer packages
export const getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { active, salonId: rawSalonId } = req.query;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format' });
    }
    const safeCustomerId = new mongoose.Types.ObjectId(customerId);

    const query = { customerId: safeCustomerId };

    if (req.user?.role !== 'ceo') {
      query.salonId = req.user.salonId;
    } else if (rawSalonId) {
      if (!mongoose.isValidObjectId(rawSalonId)) {
        return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
      }
      query.salonId = new mongoose.Types.ObjectId(rawSalonId);
    }

    if (active === 'true' || active === 'false') {
      query.isActive = active === 'true';
    }

    const packages = await Package.find(query)
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);

    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    logger.error('Error fetching customer packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
};

// POST /api/packages/:id/use - Use package credit
export const usePackageCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    const safePackageId = new mongoose.Types.ObjectId(id);

    if (bookingId && !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    const safeBookingId = bookingId ? new mongoose.Types.ObjectId(bookingId) : null;

    const packageFilter = buildTenantScopedByIdFilter(req, safePackageId);
    if (!packageFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const packageData = await Package.findOne(packageFilter).maxTimeMS(5000);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    if (req.user?.role !== 'ceo' && packageData.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    let booking = null;
    if (safeBookingId) {
      const trustedSalonObjectId = getTrustedSalonObjectId(req);
      if (req.user?.role !== 'ceo' && !trustedSalonObjectId) {
        return res.status(403).json({ success: false, message: 'Tenant context required' });
      }

      const bookingFilter = req.user?.role === 'ceo'
        ? { _id: safeBookingId }
        : { _id: safeBookingId, salonId: trustedSalonObjectId };

      booking = await Booking.findOne(bookingFilter)
        .select('salonId')
        .maxTimeMS(5000);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (!hasSalonAccess(req, booking.salonId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Resource belongs to another salon'
        });
      }

      if (booking.salonId?.toString() !== packageData.salonId?.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Booking and package must belong to the same salon'
        });
      }
    }

    await packageData.useCredit(safeBookingId);

    // Update booking to reference package
    if (booking) {
      await Booking.findOneAndUpdate(
        { _id: safeBookingId, salonId: packageData.salonId },
        { packageId: safePackageId }
      ).maxTimeMS(5000);
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
      message: 'Failed to use package credit'
    });
  }
};

// PUT /api/packages/:id - Update package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    const safePackageId = new mongoose.Types.ObjectId(id);

    delete updates.salonId;
    delete updates.createdBy;

    const packageFilter = buildTenantScopedByIdFilter(req, safePackageId);
    if (!packageFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const packageData = await Package.findOne(packageFilter).maxTimeMS(5000);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    if (req.user?.role !== 'ceo' && packageData.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    packageData.set(updates);
    await packageData.save();

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
      message: 'Failed to update package'
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
      message: 'Failed to create membership'
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
      message: 'Failed to fetch memberships'
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
      message: 'Failed to fetch membership'
    });
  }
};

// PUT /api/memberships/:id/cancel - Cancel membership
export const cancelMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid membership ID format' });
    }
    const safeMembershipId = new mongoose.Types.ObjectId(id);

    const membershipFilter = buildTenantScopedByIdFilter(req, safeMembershipId);
    if (!membershipFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const membership = await Membership.findOne(membershipFilter).maxTimeMS(5000);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    if (!hasSalonAccess(req, membership.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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
      message: 'Failed to cancel membership'
    });
  }
};

// POST /api/memberships/:id/pause - Pause membership
export const pauseMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid membership ID format' });
    }
    const safeMembershipId = new mongoose.Types.ObjectId(id);

    const membershipFilter = buildTenantScopedByIdFilter(req, safeMembershipId);
    if (!membershipFilter) {
      return res.status(403).json({ success: false, message: 'Tenant context required' });
    }

    const membership = await Membership.findOne(membershipFilter).maxTimeMS(5000);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    if (!hasSalonAccess(req, membership.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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
      message: 'Failed to pause membership'
    });
  }
};

/**
 * ==================== PORTFOLIO (PUBLIC) ====================
 */

// GET /api/portfolio/:salonId - Public portfolio gallery
export const getPortfolio = async (req, res) => {
  try {
    const { salonId: rawSalonIdPortfolio } = req.params;
    const { industry, limit } = req.query;

    if (!rawSalonIdPortfolio || !mongoose.isValidObjectId(rawSalonIdPortfolio)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const safeSalonIdPortfolio = new mongoose.Types.ObjectId(rawSalonIdPortfolio);

    const query = {
      salonId: safeSalonIdPortfolio,
      status: 'completed'
    };

    // .find() returns value from static array, breaking taint chain
    const safePortfolioIndustry = typeof industry === 'string'
      ? ALLOWED_INDUSTRIES.find(i => i === industry)
      : undefined;
    if (safePortfolioIndustry) {
      query.industry = safePortfolioIndustry;
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
        safeSalonIdPortfolio,
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
      message: 'Failed to fetch portfolio'
    });
  }
};
