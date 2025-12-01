import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Routes - MVP Only
import authRoutes from './routes/authRoutes.js';
import salonRoutes from './routes/salonRoutes.js';
import publicBookingRoutes from './routes/publicBookingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import ceoRoutes from './routes/ceoRoutes.js';
import widgetRoutes from './routes/widgetRoutes.js';

// Import Middleware
import authMiddleware from './middleware/authMiddleware.js';
import ceoMiddleware from './middleware/ceoMiddleware.js';
import errorHandlerMiddleware from './middleware/errorHandlerMiddleware.js';
import { generalLimiter, getRateLimitStatus, resetRateLimiter } from './middleware/rateLimiterMiddleware.js';
import webhookMiddleware from './middleware/webhookMiddleware.js';

// Import Controllers
import stripeWebhookController from './controllers/stripeWebhookController.js';

// Import Services
import { initializeCronJobs } from './services/cronService.js';
import emailQueueWorker from './workers/emailQueueWorker.js';

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
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Attach io to app for use in routes/controllers
app.set('io', io);

// Email Worker Intervals (for graceful shutdown)
let emailWorkerIntervals = null;

// ==================== GLOBAL MIDDLEWARE ====================

app.use(generalLimiter);

// ==================== HEALTH CHECK ROUTES ====================

app.get('/api/rate-limit/status', getRateLimitStatus);
app.post('/api/rate-limit/reset', resetRateLimiter);

// ==================== MIDDLEWARE EXECUTION ORDER ====================
// 1️⃣ SECURITY FIRST
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// 2️⃣ STRIPE WEBHOOKS (MUST BE BEFORE JSON PARSING!)
app.post('/api/webhooks/stripe', webhookMiddleware, stripeWebhookController.handleStripeWebhook);

// 3️⃣ CORS & BODY PARSING
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// 4️⃣ LOGGING
if (ENVIRONMENT === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    environment: ENVIRONMENT,
    emailWorker: emailWorkerIntervals ? 'running' : 'stopped'
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
      webhooks: '/api/webhooks/stripe'
    },
  });
});

// ==================== API ROUTES - MVP ONLY ====================

// Public Routes (No Auth Required)
app.use('/api/auth', authRoutes);
app.use('/api/bookings/public', publicBookingRoutes);
app.use('/api/widget', widgetRoutes); // NEW: Embeddable Widget API

// Protected Routes (Auth Required)
app.use('/api/salon', authMiddleware.protect, salonRoutes);
app.use('/api/bookings', authMiddleware.protect, bookingRoutes);
app.use('/api/payments', authMiddleware.protect, paymentRoutes);
app.use('/api/ceo', authMiddleware.protect, ceoMiddleware.verifyCEOAuth, ceoRoutes);

// ==================== 404 HANDLER (BEFORE ERROR HANDLER) ====================
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// ==================== ERROR HANDLER MIDDLEWARE (MUST be LAST) ====================
app.use(errorHandlerMiddleware.globalErrorHandler);

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('bookingCreated', (data) => {
    console.log('📬 Booking created:', data);
    io.emit('bookingUpdate', { type: 'created', data });
  });

  socket.on('bookingUpdated', (data) => {
    console.log('📬 Booking updated:', data);
    io.emit('bookingUpdate', { type: 'updated', data });
  });

  socket.on('bookingDeleted', (data) => {
    console.log('📬 Booking deleted:', data);
    io.emit('bookingUpdate', { type: 'deleted', data });
  });

  socket.on('paymentStarted', (data) => {
    console.log('💳 Payment started:', data);
    io.emit('paymentUpdate', { type: 'started', data });
  });

  socket.on('paymentCompleted', (data) => {
    console.log('💳 Payment completed:', data);
    io.emit('paymentUpdate', { type: 'completed', data });
  });

  socket.on('paymentFailed', (data) => {
    console.log('💳 Payment failed:', data);
    io.emit('paymentUpdate', { type: 'failed', data });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ==================== MONGODB CONNECTION ====================
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    setTimeout(connectDatabase, 5000);
    return false;
  }
};

// ==================== CRON JOBS ====================
const initializeCrons = async () => {
  try {
    await initializeCronJobs();
    console.log('✅ Cron jobs initialized');
  } catch (error) {
    console.error('⚠️ Cron job initialization error:', error.message);
  }
};

// ==================== EMAIL QUEUE WORKER ====================
const startEmailWorker = () => {
  try {
    emailWorkerIntervals = emailQueueWorker.startWorker();
    console.log('✅ Email queue worker started');
  } catch (error) {
    console.error('⚠️ Email worker initialization error:', error.message);
  }
};

// ==================== SERVER STARTUP ====================
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();

    if (!dbConnected) {
      console.error('❌ Failed to connect to MongoDB');
      process.exit(1);
    }

    await initializeCrons();
    startEmailWorker();

    server.listen(PORT, () => {
      console.log('\n════════════════════════════════════════');
      console.log('  JN BUSINESS SYSTEM MVP v2.0.0 STARTED');
      console.log('════════════════════════════════════════\n');
      console.log(`Environment: ${ENVIRONMENT}`);
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Database: ${process.env.MONGODB_URI?.split('@')[1] || 'Local MongoDB'}`);
      console.log(`API Version: 2.0.0 MVP`);
      console.log(`Auth: JWT + Role-based Access Control`);
      console.log(`Stripe: Subscriptions + Webhooks`);
      console.log(`Email Worker: Active (checks every 60s)`);
      console.log(`Started at: ${new Date().toISOString()}\n`);
      console.log('Socket.IO Events:');
      console.log('   - bookingCreated, bookingUpdated, bookingDeleted');
      console.log('   - paymentStarted, paymentCompleted, paymentFailed\n');
      console.log('MVP Features:');
      console.log('   - Embeddable booking widget (/api/widget)');
      console.log('   - Slug-based public booking (/s/:slug)');
      console.log('   - Stripe subscriptions (14-day trial)');
      console.log('   - Confirmation emails (instant)');
      console.log('   - Reminder emails (scheduled)');
      console.log('   - Review request emails (after appointment)');
      console.log('   - CEO subscription management\n');
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
};

// ==================== GLOBAL ERROR HANDLERS ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM signal received: Closing HTTP server');
  
  if (emailWorkerIntervals) {
    emailQueueWorker.stopWorker(emailWorkerIntervals);
  }
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n⚠️ SIGINT signal received: Closing HTTP server');
  
  if (emailWorkerIntervals) {
    emailQueueWorker.stopWorker(emailWorkerIntervals);
  }
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// ==================== START SERVER ====================
startServer();

// ==================== EXPORT ====================
export default app;
export { server, io };
