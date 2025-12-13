import cors from 'cors';
import Widget from '../models/Widget.js';
import logger from '../utils/logger.js';

/**
 * ? HIGH FIX #12: Dynamic CORS Middleware for Widget Routes
 *
 * Validates origin against salon-specific allowedDomains whitelist
 * Prevents unauthorized embedding of booking widget
 */

const widgetCorsMiddleware = async (req, res, next) => {
  const origin = req.headers.origin;

  try {
    // Extract slug from URL params
    const slug = req.params.slug || req.query.slug;

    if (!slug) {
      // No slug provided - allow all origins (public routes)
      return cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })(req, res, next);
    }

    // Load widget config to get allowedDomains
    const { Salon } = await import('./Salon.js').then(m => ({ Salon: m.default }));
    const salon = await Salon.findOne({ slug }).select('_id');

    if (!salon) {
      return cors({
        origin: false,
        credentials: true
      })(req, res, next);
    }

    const widget = await Widget.findOne({ salonId: salon._id }).select('allowedDomains');

    if (!widget || !widget.allowedDomains || widget.allowedDomains.length === 0) {
      // No whitelist configured - allow all origins (permissive mode for setup)
      logger.warn(`?? No CORS whitelist configured for salon ${slug} - allowing all origins`);
      return cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })(req, res, next);
    }

    // ? Validate origin against whitelist
    const isAllowed = widget.allowedDomains.some(domain => {
      if (!origin) return false;

      // Exact match
      if (origin === domain || origin === `https://${domain}` || origin === `http://${domain}`) {
        return true;
      }

      // Subdomain match (e.g., *.example.com)
      const domainPattern = domain.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^https?://${domainPattern}$`, 'i');
      return regex.test(origin);
    });

    if (!isAllowed) {
      logger.warn(`?? CORS blocked: ${origin} not in whitelist for salon ${slug}`);
      logger.warn(`Allowed domains: ${widget.allowedDomains.join(', ')}`);
    }

    // Apply CORS with whitelist validation
    return cors({
      origin: isAllowed ? origin : false,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })(req, res, next);

  } catch (error) {
    logger.error('? CORS middleware error:', error);
    // Fail-safe: deny on error
    return cors({
      origin: false,
      credentials: true
    })(req, res, next);
  }
};

// ? Development mode bypass (local testing)
const widgetCorsDevelopment = cors({
  origin: (origin, callback) => {
    // Allow localhost in development
    if (!origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export default process.env.NODE_ENV === 'production'
  ? widgetCorsMiddleware
  : widgetCorsDevelopment;
