import SupportTicket from '../models/SupportTicket.js';
import Salon from '../models/Salon.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Customer Support Controller
 * Allows salon owners/employees to create and manage support tickets
 */

// Generate unique ticket number
const generateTicketNumber = () => {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Create a new support ticket
 * POST /api/support/tickets
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const userId = req.user.id;
    const salonId = req.user.salonId;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Betreff und Beschreibung sind erforderlich'
      });
    }

    // Get user and salon info
    const salon = salonId ? await Salon.findById(salonId).lean() : null;

    // Create ticket
    const ticket = await SupportTicket.create({
      ticketNumber: generateTicketNumber(),
      salonId: salonId || null,
      userId,
      customerName: `${req.user.firstName} ${req.user.lastName}`,
      customerEmail: req.user.email,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      messages: [{
        sender: 'customer',
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderEmail: req.user.email,
        content: description,
        timestamp: new Date()
      }]
    });

    // Send confirmation email to customer
    try {
      await emailService.sendEmail({
        to: req.user.email,
        subject: `Support-Ticket erstellt: ${ticket.ticketNumber}`,
        html: `
          <h2>Ihr Support-Ticket wurde erstellt</h2>
          <p>Vielen Dank fÃ¼r Ihre Anfrage. Wir werden uns schnellstmÃ¶glich bei Ihnen melden.</p>
          <hr>
          <p><strong>Ticket-Nummer:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Betreff:</strong> ${subject}</p>
          <p><strong>Kategorie:</strong> ${category || 'Sonstige'}</p>
          <hr>
          <p><strong>Ihre Nachricht:</strong></p>
          <p>${description}</p>
          <hr>
          <p>Sie kÃ¶nnen auf diese E-Mail antworten, um weitere Informationen hinzuzufÃ¼gen.</p>
          <p>Mit freundlichen GrÃ¼ÃŸen,<br>Ihr JN Business System Support-Team</p>
        `
      });
    } catch (emailError) {
      logger.warn('Failed to send ticket confirmation email:', emailError.message);
    }

    // Send notification to support team
    try {
      await emailService.sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@jn-business-system.de',
        subject: `Neues Support-Ticket: ${ticket.ticketNumber} - ${subject}`,
        html: `
          <h2>Neues Support-Ticket</h2>
          <p><strong>Ticket-Nummer:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Von:</strong> ${req.user.firstName} ${req.user.lastName} (${req.user.email})</p>
          <p><strong>Salon:</strong> ${salon?.businessName || 'Kein Salon'}</p>
          <p><strong>Kategorie:</strong> ${category || 'Sonstige'}</p>
          <p><strong>PrioritÃ¤t:</strong> ${priority || 'Mittel'}</p>
          <hr>
          <p><strong>Betreff:</strong> ${subject}</p>
          <p><strong>Beschreibung:</strong></p>
          <p>${description}</p>
        `
      });
    } catch (emailError) {
      logger.warn('Failed to send support notification email:', emailError.message);
    }

    logger.info(`Support ticket created: ${ticket.ticketNumber} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Support-Ticket erfolgreich erstellt',
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Erstellen des Support-Tickets'
    });
  }
};

/**
 * Get all tickets for current user
 * GET /api/support/tickets
 */
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .select('ticketNumber subject category priority status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Support-Tickets'
    });
  }
};

/**
 * Get single ticket details
 * GET /api/support/tickets/:ticketId
 */
export const getTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId
    }).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket nicht gefunden'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    logger.error('Error fetching ticket details:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Tickets'
    });
  }
};

/**
 * Add message to ticket
 * POST /api/support/tickets/:ticketId/messages
 */
export const addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Nachricht ist erforderlich'
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket nicht gefunden'
      });
    }

    // Add message
    ticket.messages.push({
      sender: 'customer',
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      senderEmail: req.user.email,
      content,
      timestamp: new Date()
    });

    // Reopen if closed
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    await ticket.save();

    // Notify support team
    try {
      await emailService.sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@jn-business-system.de',
        subject: `Neue Nachricht zu Ticket ${ticket.ticketNumber}`,
        html: `
          <h2>Neue Nachricht zu Support-Ticket</h2>
          <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Von:</strong> ${req.user.firstName} ${req.user.lastName}</p>
          <hr>
          <p>${content}</p>
        `
      });
    } catch (emailError) {
      logger.warn('Failed to send message notification:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Nachricht hinzugefÃ¼gt',
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        messages: ticket.messages
      }
    });
  } catch (error) {
    logger.error('Error adding message to ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim HinzufÃ¼gen der Nachricht'
    });
  }
};

/**
 * Close ticket (by customer)
 * PATCH /api/support/tickets/:ticketId/close
 */
export const closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: ticketId, userId },
      {
        status: 'closed',
        closedAt: new Date(),
        closedBy: userId
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket nicht gefunden'
      });
    }

    res.json({
      success: true,
      message: 'Ticket geschlossen',
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      }
    });
  } catch (error) {
    logger.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim SchlieÃŸen des Tickets'
    });
  }
};

export default {
  createTicket,
  getMyTickets,
  getTicketDetails,
  addMessage,
  closeTicket
};
