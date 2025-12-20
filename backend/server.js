import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import structuredLogger, { addRequestContext } from './utils/structuredLogger.js';
import { generalLimiter, getRateLimitStatus, resetRateLimiter } from './middleware/rateLimiterMiddleware.js';
import { requestTimingMiddleware, getMetrics } from './services/monitoringService.js';
import errorHandlerMiddleware from './middleware/errorHandlerMiddleware.js';
import { initializeCronJobs } from './services/cronService.js';
import emailQueueWorker from './workers/emailQueueWorker.js';
import lifecycleEmailWorker from './workers/lifecycleEmailWorker.js';
import { getHealthStatus } from './services/healthCheckService.js';
import alertingService from './services/alertingService.js';
import { sanitizeInput } from './middleware/sanitizationMiddleware.js';
import { initSentry, sentryErrorHandler } from './config/sentry.js';

// NO-SHOW-KILLER Workers
import { startConfirmationSender } from './workers/confirmationSenderWorker.js';
import { startAutoCancelWorker } from './workers/autoCancelWorker.js';
import { startWaitlistMatcher } from './workers/waitlistMatcherWorker.js';
import { startReminderWorker } from './workers/reminderWorker.js';

// Marketing Automation Workers
import { startMarketingCampaignWorker } from './workers/marketingCampaignWorker.js';
import { startMarketingAnalyticsWorker } from './workers/marketingAnalyticsWorker.js';

// Suppress iconv-lite encoding warning (UTF-8 is correctly used)
process.env.ICONV_PURE = '1';

// Load environment variables
dotenv.config();

// Import Routes - MVP Only
import authRoutes from './routes/authRoutes.js';
import salonRoutes from './routes/salonRoutes.js';
import publicBookingRoutes from './routes/publicBookingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import subscriptionManagementRoutes from './routes/subscriptionManagement.js';
import ceoRoutes from './routes/ceoRoutes.js';
import widgetRoutes from './routes/widgetRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import systemRoutes from './routes/systemRoutes.js'; // ? MEDIUM FIX #13 & #14
import gdprRoutes from './routes/gdprRoutes.js'; // GDPR Compliance

// Multi-Industry Routes - Phase 2
import artistPortfolioRoutes from './routes/artistPortfolioRoutes.js';

// Pricing Wizard Routes
import pricingWizardRoutes from './routes/pricingWizardRoutes.js';
import clinicalNoteRoutes from './routes/clinicalNoteRoutes.js';
import consentFormRoutes from './routes/consentFormRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

// Pricing & Feature Gate Routes - Phase 5
import pricingRoutes from './routes/pricing.js';

// Customer Support Routes
import supportRoutes from './routes/supportRoutes.js';

// CRM Routes
import crmRoutes from './routes/crmRoutes.js';

// Branding Routes
import brandingRoutes from './routes/brandingRoutes.js';

// Multi-Location Routes
import multiLocationRoutes from './routes/multiLocationRoutes.js';

// NO-SHOW-KILLER Routes
import smsConsentRoutes from './routes/smsConsentRoutes.js';
import confirmationRoutes from './routes/confirmationRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import slotSuggestionRoutes from './routes/slotSuggestionRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js'; // MessageBird webhooks

// Marketing Automation Routes
import marketingRoutes from './routes/marketingRoutes.js';

// Tattoo Studio Routes
import tattooRoutes from './routes/tattoo.js';

// Import Middleware
import authMiddleware from './middleware/authMiddleware.js';
import webhookMiddleware from './middleware/webhookMiddleware.js';

// Import Controllers
import stripeWebhookController from './controllers/stripeWebhookController.js';

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * JN Business System Backend
 * Version: 2.0.0 MVP
 * Date: 2025-12-01
 * Features: Embeddable Widget, Salon Booking, Email Queue, Stripe Subscriptions, JWT Auth
 */

// Create HTTP Server for Socket.IO
const server = http.createServer(app);

// Socket.IO Configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Attach io to app for use in routes/controllers
app.set('io', io);

// Email Worker Intervals (for graceful shutdown)
let emailWorkerIntervals = null;
let lifecycleWorkerIntervalId = null;

// ==================== GLOBAL MIDDLEWARE ====================

app.use(generalLimiter);

// ==================== HEALTH CHECK ROUTES ====================

app.get('/api/rate-limit/status', getRateLimitStatus);
app.post('/api/rate-limit/reset', resetRateLimiter);

// ==================== MIDDLEWARE EXECUTION ORDER ====================
// 1️⃣ SENTRY (if production)
initSentry(app);

// 2️⃣ SECURITY FIRST
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://plausible.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false // Required for external widgets
}));
app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(xss()); // FREE OPTIMIZATION: XSS protection
app.use(sanitizeInput); // ? XSS sanitization for all inputs
app.use(hpp());
// Compression should be applied after security middleware
app.use(compression());

// 3️⃣ STRIPE & MESSAGEBIRD WEBHOOKS (MUST BE BEFORE JSON PARSING!)
app.post('/api/webhooks/stripe', webhookMiddleware, stripeWebhookController.handleStripeWebhook);
app.use('/api/webhooks', webhookRoutes); // MessageBird webhooks

// 4️⃣ CORS & BODY PARSING
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// 4?? LOGGING & MONITORING
// ? AUDIT FIX: Add request context middleware for structured logging
app.use(addRequestContext);

if (ENVIRONMENT === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request timing for metrics
app.use(requestTimingMiddleware);

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    const health = await getHealthStatus();
    health.emailWorker = emailWorkerIntervals ? 'running' : 'stopped';

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint (protected - CEO only in production)
app.get('/api/metrics', async (req, res) => {
  // In production, this should be protected
  if (ENVIRONMENT === 'production') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  res.json({
    success: true,
    metrics: getMetrics()
  });
});

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
  res.json({
    message: 'JN Business System API v2.0.0 MVP',
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      ceo: '/api/ceo',
      salon: '/api/salon',
      bookings: '/api/bookings',
      publicBooking: '/api/bookings/public/s/:slug',
      widget: '/api/widget',
      payments: '/api/payments',
      subscriptions: '/api/subscriptions',
      webhooks: '/api/webhooks/stripe',
      // Multi-Industry Endpoints
      portfolio: '/api/portfolio',
      clinicalNotes: '/api/clinical-notes',
      consentForms: '/api/consent-forms',
      packages: '/api/packages',
      progress: '/api/progress',
      resources: '/api/resources'
    }
  });
});

// ==================== API ROUTES - MVP ONLY ====================

// Public Routes (No Auth Required)
app.use('/api/auth', authRoutes);
app.use('/api/bookings/public', publicBookingRoutes);
app.use('/api/widget', widgetRoutes); // Embeddable Widget API
app.use('/api/subscriptions', subscriptionRoutes); // Stripe Subscription Management
app.use('/api/subscriptions/manage', subscriptionManagementRoutes); // Subscription Management (Protected)
app.use('/api/system', systemRoutes); // ? MEDIUM FIX #13 & #14: Health & Backups (/health, /health/detailed, /backups/*)
app.use('/api/pricing', pricingRoutes); // Pricing & Feature Access (Mixed: public + protected)

// Protected Routes (Auth Required)
app.use('/api/salon', authMiddleware.protect, salonRoutes);
app.use('/api/bookings', authMiddleware.protect, bookingRoutes);
app.use('/api/payments', authMiddleware.protect, paymentRoutes);
app.use('/api/services', authMiddleware.protect, serviceRoutes);
app.use('/api/employees', authMiddleware.protect, employeeRoutes);
app.use('/api/ceo', ceoRoutes); // Auth middleware is already in ceoRoutes
app.use('/api/gdpr', gdprRoutes); // GDPR Compliance (Protected)

// Multi-Industry Routes - Phase 2
app.use('/api/portfolio', artistPortfolioRoutes); // Mixed: upload protected, galleries public
app.use('/api/clinical-notes', authMiddleware.protect, clinicalNoteRoutes); // ALL PROTECTED - HIPAA
app.use('/api/consent-forms', consentFormRoutes); // Mixed: signing public, management protected
app.use('/api/packages', packageRoutes); // Mixed: purchase flow public/protected
app.use('/api/progress', authMiddleware.protect, progressRoutes); // ALL PROTECTED - Client privacy
app.use('/api/resources', resourceRoutes); // Mixed: availability public, management protected
app.use('/api/support', authMiddleware.protect, supportRoutes); // Customer Support Tickets
app.use('/api/crm', authMiddleware.protect, crmRoutes); // CRM - Customer Management
app.use('/api/branding', authMiddleware.protect, brandingRoutes); // Custom Branding
app.use('/api/locations', authMiddleware.protect, multiLocationRoutes); // Multi-Location (Enterprise)

// NO-SHOW-KILLER Routes - Phase 2
app.use('/api/sms-consent', smsConsentRoutes); // SMS GDPR Consent (Public + Protected)
app.use('/api/confirmations', confirmationRoutes); // Booking Confirmations (Mixed: public confirm link)
app.use('/api/waitlist', waitlistRoutes); // Waitlist Management (Public join + Protected admin)
app.use('/api/marketing', marketingRoutes); // Marketing Automation (Protected)
app.use('/api/slot-suggestions', slotSuggestionRoutes); // Slot Suggestions (Public accept/reject)

// Tattoo Studio Routes
app.use('/api/tattoo', tattooRoutes); // Tattoo Studio Features (Projects, Sessions, Consents, Portfolio)

// Workflow System Routes (Industry-Specific Features)
import workflowRoutes from './routes/workflows.js';
app.use('/api/workflows', workflowRoutes); // Workflow Management (Multi-Industry)

// Pricing Wizard Routes
app.use('/api/pricing-wizard', pricingWizardRoutes); // Intelligent Tier Recommendation (Public + Analytics)

// ==================== 404 HANDLER (BEFORE ERROR HANDLER) ====================
app.use('*', (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLER MIDDLEWARE (MUST be LAST) ====================
// Sentry error handler (if production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(sentryErrorHandler());
}

// Global error handler
app.use(errorHandlerMiddleware.globalErrorHandler);

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
  logger.info(`? Client connected: ${socket.id}`);

  socket.on('bookingCreated', (data) => {
    logger.info('?? Booking created:', data);
    io.emit('bookingUpdate', { type: 'created', data });
  });

  socket.on('bookingUpdated', (data) => {
    logger.info('?? Booking updated:', data);
    io.emit('bookingUpdate', { type: 'updated', data });
  });

  socket.on('bookingDeleted', (data) => {
    logger.info('?? Booking deleted:', data);
    io.emit('bookingUpdate', { type: 'deleted', data });
  });

  socket.on('paymentStarted', (data) => {
    logger.info('?? Payment started:', data);
    io.emit('paymentUpdate', { type: 'started', data });
  });

  socket.on('paymentCompleted', (data) => {
    logger.info('?? Payment completed:', data);
    io.emit('paymentUpdate', { type: 'completed', data });
  });

  socket.on('paymentFailed', (data) => {
    logger.info('?? Payment failed:', data);
    io.emit('paymentUpdate', { type: 'failed', data });
  });

  socket.on('disconnect', () => {
    logger.info(`? Client disconnected: ${socket.id}`);
  });
});

// ==================== MONGODB CONNECTION ====================
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // ? AUDIT FIX: Validate MongoDB URI has authentication
    if (!mongoURI.includes('@') && !mongoURI.includes('localhost')) {
      logger.error('? SECURITY: MongoDB URI does not contain authentication credentials!');
      logger.error('? Add username:password to connection string: mongodb://user:pass@host/db');
      throw new Error('MongoDB authentication required for production');
    }

    // Log sanitized URI for debugging (hide password)
    const sanitizedUri = mongoURI.replace(/:([^:@]+)@/, ':****@');
    logger.info(`?? Attempting MongoDB connection to: ${sanitizedUri}`);

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4  // Force IPv4 (Railway sometimes has IPv6 issues)
    });

    logger.info('? MongoDB Connected Successfully');
    logger.info(`?? Database: ${mongoose.connection.db.databaseName}`);

    // Seed Marketing Templates
    try {
      const MarketingTemplate = (await import('./models/MarketingTemplate.js')).default;
      await MarketingTemplate.seedTemplates();
      logger.info('[MARKETING] Templates seeded successfully');
    } catch (error) {
      logger.error('[MARKETING] Template seeding failed:', error.message);
    }

    return true;
  } catch (error) {
    logger.error('? MongoDB Connection Error:', error.message);
    logger.error(`? Error details: name=${error.name}, code=${error.code || 'N/A'}`);
    if (error.reason) {
      logger.error(`? Error reason: ${JSON.stringify(error.reason)}`);
    }
    logger.error('? Failed to connect to MongoDB - retrying in 5 seconds...');
    setTimeout(connectDatabase, 5000);
    return false;
  }
};

// ==================== CRON JOBS ====================
const initializeCrons = async () => {
  try {
    await initializeCronJobs();
    logger.info('? Cron jobs initialized');
  } catch (error) {
    logger.error('?? Cron job initialization error:', error.message);
  }
};

// ==================== EMAIL QUEUE WORKER ====================
const startEmailWorker = () => {
  try {
    emailWorkerIntervals = emailQueueWorker.startWorker();
    logger.info('? Email queue worker started');
  } catch (error) {
    logger.error('?? Email worker initialization error:', error.message || error);
    logger.error('Error stack:', error.stack);
    throw error; // Re-throw to prevent silent failures
  }
};

// ==================== LIFECYCLE EMAIL WORKER ====================
const startLifecycleWorker = () => {
  try {
    lifecycleWorkerIntervalId = lifecycleEmailWorker.startLifecycleEmailWorker();
    logger.info('? Lifecycle email worker started');
  } catch (error) {
    logger.error('?? Lifecycle email worker initialization error:', error.message || error);
    logger.error('Error stack:', error.stack);
    throw error; // Re-throw to prevent silent failures
  }
};

// ==================== ALERTING SERVICE ====================
const startAlertingService = () => {
  try {
    // Start health checks every 60 seconds
    alertingService.startHealthChecks(getMetrics, 60000);
    logger.info('? Alerting service started');
  } catch (error) {
    logger.error('?? Alerting service initialization error:', error.message || error);
    logger.error('Error stack:', error.stack);
    throw error; // Re-throw to prevent silent failures
  }
};

// ==================== NO-SHOW-KILLER WORKERS ====================
const startNoShowKillerWorkers = () => {
  try {
    logger.info('? Starting NO-SHOW-KILLER workers...');

    // Start all 4 workers
    startConfirmationSender(); // Every 5 min
    startAutoCancelWorker(); // Every 15 min
    startWaitlistMatcher(); // Every 15 min
    startReminderWorker(); // Every 30 min

    logger.info('? NO-SHOW-KILLER workers started successfully');
  } catch (error) {
    logger.error('?? NO-SHOW-KILLER worker initialization error:', error.message || error);
    logger.error('Error stack:', error.stack);
    throw error;
  }
};

// ==================== MARKETING AUTOMATION WORKERS ====================
const startMarketingWorkers = () => {
  try {
    logger.info('[WORKER] Starting Marketing Automation workers...');

    // Start marketing workers
    startMarketingCampaignWorker(); // Every 15 min
    startMarketingAnalyticsWorker(); // Every 60 min

    logger.info('[WORKER] Marketing Automation workers started successfully');
  } catch (error) {
    logger.error('[ERROR] Marketing worker initialization error:', error.message || error);
    logger.error('Error stack:', error.stack);
    throw error;
  }
};

// ==================== SERVER STARTUP ====================
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();

    if (!dbConnected) {
      logger.error('? Failed to connect to MongoDB');
      process.exit(1);
    }

    await initializeCrons();
    startEmailWorker();
    startLifecycleWorker();
    startAlertingService();
    startNoShowKillerWorkers(); // 🔥 NO-SHOW-KILLER System
    startMarketingWorkers(); // 📧 Marketing Automation

    server.listen(PORT, () => {
      logger.info('\n----------------------------------------');
      logger.info('  JN BUSINESS SYSTEM MVP v2.0.0 STARTED');
      logger.info('----------------------------------------\n');
      logger.info(`Environment: ${ENVIRONMENT}`);
      logger.info(`Server: http://localhost:${PORT}`);
      logger.info(`Database: ${process.env.MONGODB_URI?.split('@')[1] || 'Local MongoDB'}`);
      logger.info('API Version: 2.0.0 MVP');
      logger.info('Auth: JWT + Role-based Access Control');
      logger.info('Stripe: Subscriptions + Webhooks');
      logger.info('Email Worker: Active (checks every 60s)');
      logger.info('Lifecycle Emails: Active (checks every hour)');
      logger.info(`Started at: ${new Date().toISOString()}\n`);
      logger.info('Socket.IO Events:');
      logger.info('   - bookingCreated, bookingUpdated, bookingDeleted');
      logger.info('   - paymentStarted, paymentCompleted, paymentFailed\n');
      logger.info('MVP Features:');
      logger.info('   - Embeddable booking widget (/api/widget)');
      logger.info('   - Slug-based public booking (/s/:slug)');
      logger.info('   - Stripe subscriptions (14-day trial)');
      logger.info('   - Confirmation emails (instant)');
      logger.info('   - Reminder emails (scheduled)');
      logger.info('   - Review request emails (after appointment)');
      logger.info('   - CEO subscription management\n');
    });
  } catch (error) {
    logger.error('? Server startup error:', error.message);
    process.exit(1);
  }
};

// ==================== GLOBAL ERROR HANDLERS ====================
process.on('unhandledRejection', (reason, promise) => {
  logger.error('? Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('? Uncaught Exception:', error);
  process.exit(1);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
  logger.info('\n?? SIGTERM signal received: Closing HTTP server');
  if (emailWorkerIntervals) {
    emailQueueWorker.stopWorker(emailWorkerIntervals);
  }
  if (lifecycleWorkerIntervalId) {
    lifecycleEmailWorker.stopLifecycleEmailWorker();
  }
  server.close(async () => {
    logger.info('? HTTP server closed');
    await mongoose.connection.close();
    logger.info('? MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('\n?? SIGINT signal received: Closing HTTP server');
  if (emailWorkerIntervals) {
    emailQueueWorker.stopWorker(emailWorkerIntervals);
  }
  if (lifecycleWorkerIntervalId) {
    lifecycleEmailWorker.stopLifecycleEmailWorker();
  }
  server.close(async () => {
    logger.info('? HTTP server closed');
    await mongoose.connection.close();
    logger.info('? MongoDB connection closed');
    process.exit(0);
  });
});

// ==================== START SERVER ====================
startServer();

// ==================== EXPORT ====================
export default app;
export { server, io };
