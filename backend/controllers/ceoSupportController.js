import logger from '../utils/logger.js';
/**
 * CEO Support Tickets Controller
 * Customer support ticket management
 */

import SupportTicket from '../models/SupportTicket.js';

// ==================== GET ALL TICKETS ====================
export const getAllTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      page = 1,
      limit = 20,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .sort({
        priority: -1, // urgent first
        createdAt: -1
      })
      .skip((page - 1).lean().maxTimeMS(5000) * limit)
      .limit(parseInt(limit))
      .populate('salonId', 'name')
      .populate('assignedTo', 'name email');

    const total = await SupportTicket.countDocuments(query);

    // Calculate stats
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      open: 0,
      in_progress: 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
      total: 0
    };
    stats.forEach(s => {
      statsObj[s._id] = s.count;
      statsObj.total += s.count;
    });

    // Priority counts
    const priorityStats = await SupportTicket.aggregate([
      { $match: { status: { $in: ['open', 'in_progress'] } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityObj = { urgent: 0, high: 0, medium: 0, low: 0 };
    priorityStats.forEach(p => {
      priorityObj[p._id] = p.count;
    });

    res.status(200).json({
      success: true,
      tickets,
      stats: statsObj,
      priorityStats: priorityObj,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GetAllTickets Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET TICKET DETAILS ====================
export const getTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId)
      .populate('salonId', 'name ownerEmail subscription').maxTimeMS(5000)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('messages.senderId', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    logger.error('GetTicketDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CREATE TICKET (Admin created) ====================
export const createTicket = async (req, res) => {
  try {
    const {
      salonId,
      customerName,
      customerEmail,
      subject,
      description,
      category,
      priority
    } = req.body;

    if (!customerEmail || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Email, subject and description are required'
      });
    }

    const ticket = await SupportTicket.create({
      salonId,
      customerName: customerName || 'Unknown',
      customerEmail,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      messages: [{
        sender: 'customer',
        content: description,
        createdAt: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    logger.error('CreateTicket Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== UPDATE TICKET ====================
export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, assignedTo, internalNotes, tags } = req.body;

    const ticket = await SupportTicket.findById(ticketId).maxTimeMS(5000);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update fields
    if (status) {
      ticket.status = status;
      if (status === 'resolved') ticket.resolvedAt = new Date();
      if (status === 'closed') ticket.closedAt = new Date();
    }
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;
    if (internalNotes !== undefined) ticket.internalNotes = internalNotes;
    if (tags) ticket.tags = tags;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    logger.error('UpdateTicket Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== ADD REPLY ====================
export const addReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const ticket = await SupportTicket.findById(ticketId).maxTimeMS(5000);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Add reply
    ticket.messages.push({
      sender: 'support',
      senderId: req.user._id,
      content,
      createdAt: new Date()
    });

    // Set first response time if this is first support reply
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    // Update status to in_progress if was open
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      ticket
    });
  } catch (error) {
    logger.error('AddReply Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET TICKET STATS ====================
export const getTicketStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    // New tickets in period
    const newTickets = await SupportTicket.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Resolved in period
    const resolvedTickets = await SupportTicket.countDocuments({
      resolvedAt: { $gte: startDate }
    });

    // Average response time
    const responseTimeData = await SupportTicket.aggregate([
      { $match: { firstResponseAt: { $exists: true }, createdAt: { $gte: startDate } } },
      {
        $project: {
          responseTime: { $subtract: ['$firstResponseAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTime = responseTimeData[0]?.avgResponseTime
      ? Math.round(responseTimeData[0].avgResponseTime / (1000 * 60)) // in minutes
      : 0;

    // Category breakdown
    const categoryBreakdown = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        newTickets,
        resolvedTickets,
        avgResponseTimeMinutes: avgResponseTime,
        categoryBreakdown: categoryBreakdown.reduce((acc, c) => {
          acc[c._id] = c.count;
          return acc;
        }, {}),
        period
      }
    });
  } catch (error) {
    logger.error('GetTicketStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAllTickets,
  getTicketDetails,
  createTicket,
  updateTicket,
  addReply,
  getTicketStats
};


