import cors from 'cors';
import logger from '../utils/logger.js';

/**
 * CORS Middleware Suite
 * Version: 1.0.0
 * Provides: Dynamic CORS configuration with environment-aware handling
 */

// ==================== ALLOWED ORIGINS ====================

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
  process.env.PRODUCTION_FRONTEND_URL
].filter(Boolean);

logger.log('✅ Allowed CORS Origins:', allowedOrigins);

// ==================== CORS OPTIONS ====================

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Last-Event-ID',
    'X-Session-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Page-Number',
    'X-Page-Size',
    'Content-Type',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// ==================== MAIN CORS MIDDLEWARE ====================

const corsMiddleware = cors(corsOptions);

// ==================== PREFLIGHT HANDLER ====================

const corsPreFlight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
      res.header('Access-Control-Allow-Headers', [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept'
      ].join(', '));
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(200);
    }

    return res.status(403).json({
      success: false,
      message: 'CORS preflight failed'
    });
  }

  next();
};

// ==================== DYNAMIC CORS ====================

const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language'
  ].join(', '));

  res.header('Access-Control-Expose-Headers', [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ].join(', '));

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

// ==================== CORS ERROR HANDLER ====================

const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    logger.warn(`❌ CORS Error: Origin ${req.headers.origin} not allowed`);

    return res.status(403).json({
      success: false,
      message: 'CORS Policy: Diese Origin ist nicht erlaubt',
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
  }

  next(err);
};

// ==================== ENVIRONMENT-AWARE SELECTOR ====================

const selectCorsMiddleware = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return corsMiddleware;
  }

  return corsMiddleware;
};

// ==================== CORS WITH LOGGING ====================

const corsWithLogging = (req, res, next) => {
  const origin = req.headers.origin;
  const allowed = !origin || allowedOrigins.includes(origin);

  logger.log(
    `[CORS] ${req.method} ${req.path} from ${origin || 'no-origin'} - ${allowed ? '✅ ALLOWED' : '❌ BLOCKED'}`
  );

  if (allowed) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

// ==================== GET CORS STATUS ====================

const getCorsStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS aktiv',
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins,
    currentOrigin: req.headers.origin,
    isCorsAllowed: !req.headers.origin || allowedOrigins.includes(req.headers.origin)
  });
};

// ==================== ADD CORS ORIGIN ====================

const addCorsOrigin = (req, res) => {
  if (req.user && req.user.role === 'ceo') {
    const { origin } = req.body;

    if (!origin) {
      return res.status(400).json({
        success: false,
        message: 'Origin erforderlich'
      });
    }

    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
      logger.log('✅ New CORS origin added:', origin);
    }

    res.status(200).json({
      success: true,
      message: 'Origin hinzugefügt',
      allowedOrigins
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Nur CEO kann Origins hinzufügen'
    });
  }
};

// ==================== REMOVE CORS ORIGIN ====================

const removeCorsOrigin = (req, res) => {
  if (req.user && req.user.role === 'ceo') {
    const { origin } = req.body;
    const index = allowedOrigins.indexOf(origin);

    if (index > -1) {
      allowedOrigins.splice(index, 1);
      logger.log('✅ CORS origin removed:', origin);
    }

    res.status(200).json({
      success: true,
      message: 'Origin entfernt',
      allowedOrigins
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Nur CEO kann Origins entfernen'
    });
  }
};

// ==================== LIST CORS ORIGINS ====================

const listCorsOrigins = (req, res) => {
  res.status(200).json({
    success: true,
    allowedOrigins,
    count: allowedOrigins.length,
    environment: process.env.NODE_ENV
  });
};

// ==================== CORS MIDDLEWARE CHAIN ====================

const corsMiddlewareChain = [corsPreFlight, corsMiddleware, corsErrorHandler];

// ==================== EXPORT ====================

export default {
  corsMiddleware,
  corsPreFlight,
  dynamicCors,
  corsErrorHandler,
  selectCorsMiddleware,
  corsWithLogging,
  getCorsStatus,
  addCorsOrigin,
  removeCorsOrigin,
  listCorsOrigins,
  corsMiddlewareChain
};
