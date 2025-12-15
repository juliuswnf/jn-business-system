import mongoose from 'mongoose';

const workflowProjectSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: {
    type: String,
    enum: ['tattoo', 'medical_aesthetics', 'spa_wellness', 'barbershop', 'nails', 'massage', 'physiotherapy', 'generic'],
    required: true
  },
  type: {
    type: String,
    enum: ['tattoo_project', 'treatment_plan', 'package', 'membership', 'generic'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  totalSessions: {
    type: Number,
    default: 1
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowSession'
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  startDate: Date,
  completedDate: Date,
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  referenceImages: [String],
  checklist: [{
    item: String,
    checked: { type: Boolean, default: false },
    required: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

// Indexes
workflowProjectSchema.index({ salonId: 1, status: 1 });
workflowProjectSchema.index({ customerId: 1 });
workflowProjectSchema.index({ industry: 1 });
workflowProjectSchema.index({ salonId: 1, industry: 1 });
workflowProjectSchema.index({ salonId: 1, createdAt: -1 });
workflowProjectSchema.index({ artistId: 1 });

// Virtuals
workflowProjectSchema.virtual('sessionsPopulated', {
  ref: 'WorkflowSession',
  localField: '_id',
  foreignField: 'projectId'
});

workflowProjectSchema.virtual('paymentStatus').get(function() {
  if (this.totalPrice === 0) return 'no_payment';
  if (this.paidAmount >= this.totalPrice) return 'paid';
  if (this.paidAmount > 0) return 'partial';
  return 'unpaid';
});

// Methods
workflowProjectSchema.methods.updateProgress = async function() {
  const WorkflowSession = mongoose.model('WorkflowSession');
  const sessions = await WorkflowSession.find({ projectId: this._id, status: 'completed' });

  if (sessions.length === 0) {
    this.progress = 0;
  } else {
    const totalProgress = sessions.reduce((sum, session) => sum + (session.progress || 0), 0);
    this.progress = Math.round(totalProgress / sessions.length);
  }

  this.completedSessions = sessions.length;

  // Auto-complete if all sessions done
  if (this.completedSessions >= this.totalSessions && this.status === 'active') {
    this.status = 'completed';
    this.completedDate = new Date();
  }

  await this.save();
  return this;
};

workflowProjectSchema.methods.startProject = async function() {
  if (this.status === 'draft') {
    this.status = 'active';
    this.startDate = new Date();
    await this.save();
  }
  return this;
};

workflowProjectSchema.methods.cancelProject = async function() {
  const WorkflowSession = mongoose.model('WorkflowSession');

  // Cancel all pending sessions
  await WorkflowSession.updateMany(
    { projectId: this._id, status: { $in: ['scheduled', 'draft'] } },
    { status: 'cancelled' }
  );

  this.status = 'cancelled';
  await this.save();
  return this;
};

workflowProjectSchema.methods.addSession = async function(sessionId) {
  if (!this.sessions.includes(sessionId)) {
    this.sessions.push(sessionId);
    await this.save();
  }
  return this;
};

workflowProjectSchema.methods.getMetadata = function(key) {
  return this.metadata.get(key);
};

workflowProjectSchema.methods.setMetadata = async function(key, value) {
  this.metadata.set(key, value);
  await this.save();
  return this;
};

// Statics
workflowProjectSchema.statics.getProjectsWithStats = async function(salonId, filters = {}) {
  const query = { salonId };

  if (filters.industry) query.industry = filters.industry;
  if (filters.status) query.status = filters.status;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.artistId) query.artistId = filters.artistId;
  if (filters.type) query.type = filters.type;

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return this.find(query)
    .populate('customerId', 'firstName lastName email phone')
    .populate('artistId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();
};

workflowProjectSchema.statics.getDashboardStats = async function(salonId, industry = null) {
  const query = { salonId };
  if (industry) query.industry = industry;

  const projects = await this.find(query);

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
    totalRevenue: projects.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
    potentialRevenue: projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0),
    averageProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0,
    averageSessions: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.totalSessions, 0) / projects.length)
      : 0
  };

  return stats;
};

workflowProjectSchema.statics.getByIndustry = async function(salonId, industry) {
  return this.find({ salonId, industry })
    .populate('customerId', 'firstName lastName email phone')
    .populate('artistId', 'firstName lastName')
    .sort({ createdAt: -1 });
};

const WorkflowProject = mongoose.model('WorkflowProject', workflowProjectSchema);

export default WorkflowProject;
