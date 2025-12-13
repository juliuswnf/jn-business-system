import logger from '../utils/logger.js';

// ? SRE FIX #25: Cache NODE_ENV for performance
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * ? AUDIT FIX: Mongoose Multi-Tenant Plugin
 * Automatically injects salonId filter into ALL queries
 * Prevents accidental cross-tenant data leakage (GDPR breach prevention)
 */

/**
 * Multi-tenant plugin for Mongoose schemas
 * @param {Schema} schema - Mongoose schema
 * @param {Object} options - Plugin options
 */
export const multiTenantPlugin = (schema, options = {}) => {
  const { tenantField = 'salonId', required = true } = options;

  // Add salonId field if not exists
  if (!schema.path(tenantField)) {
    const fieldDef = {
      type: schema.constructor.Types.ObjectId,
      ref: 'Salon',
      required,
      index: true
    };
    schema.add({ [tenantField]: fieldDef });
  }

  // Pre-find hooks: Auto-inject salonId filter
  const preFindHooks = ['find', 'findOne', 'countDocuments', 'count'];

  preFindHooks.forEach(method => {
    schema.pre(method, function() {
      // Only apply if salonId provided in query options
      if (this.options && this.options.salonId) {
        const filter = this.getFilter();

        // Don't override if salonId already in filter
        if (!filter[tenantField]) {
          this.where({ [tenantField]: this.options.salonId });

          if (IS_DEVELOPMENT) {
            logger.debug(`[MultiTenant] Auto-injected ${tenantField}: ${this.options.salonId}`);
          }
        }
      }
    });
  });

  // Pre-update hooks: Prevent updating across tenants
  const preUpdateHooks = ['updateOne', 'updateMany', 'findOneAndUpdate'];

  preUpdateHooks.forEach(method => {
    schema.pre(method, function() {
      if (this.options && this.options.salonId) {
        const filter = this.getFilter();

        if (!filter[tenantField]) {
          this.where({ [tenantField]: this.options.salonId });

          if (IS_DEVELOPMENT) {
            logger.debug(`[MultiTenant] Auto-injected ${tenantField} in update: ${this.options.salonId}`);
          }
        }
      }
    });
  });

  // Pre-delete hooks: Prevent deleting across tenants
  const preDeleteHooks = ['deleteOne', 'deleteMany', 'findOneAndDelete'];

  preDeleteHooks.forEach(method => {
    schema.pre(method, function() {
      if (this.options && this.options.salonId) {
        const filter = this.getFilter();

        if (!filter[tenantField]) {
          this.where({ [tenantField]: this.options.salonId });

          if (IS_DEVELOPMENT) {
            logger.debug(`[MultiTenant] Auto-injected ${tenantField} in delete: ${this.options.salonId}`);
          }
        }
      }
    });
  });

  // Aggregate hook: Warn if $match doesn't include salonId
  schema.pre('aggregate', function() {
    const pipeline = this.pipeline();

    if (pipeline.length > 0) {
      const firstStage = pipeline[0];

      // Check if first stage is $match with salonId
      if (!firstStage.$match || !firstStage.$match[tenantField]) {
        logger.warn(`[MultiTenant] ?? Aggregation without ${tenantField} filter detected. Possible data leakage!`);
        logger.warn(`[MultiTenant] Pipeline: ${JSON.stringify(pipeline[0])}`);

        // In strict mode, throw error
        if (process.env.MULTI_TENANT_STRICT === 'true') {
          throw new Error(`Aggregation MUST include ${tenantField} in first $match stage`);
        }
      }
    }
  });

  // Instance method: Verify tenant ownership
  schema.methods.belongsToTenant = function(salonId) {
    return this[tenantField] && this[tenantField].toString() === salonId.toString();
  };

  // Static method: Scoped find with automatic tenant filter
  schema.statics.findByTenant = function(salonId, filter = {}, options = {}) {
    return this.find(
      { ...filter, [tenantField]: salonId },
      null,
      { ...options, salonId }
    );
  };

  // Static method: Scoped findOne with automatic tenant filter
  schema.statics.findOneByTenant = function(salonId, filter = {}, options = {}) {
    return this.findOne(
      { ...filter, [tenantField]: salonId },
      null,
      { ...options, salonId }
    );
  };

  // Static method: Count documents for tenant
  schema.statics.countByTenant = function(salonId, filter = {}) {
    return this.countDocuments({ ...filter, [tenantField]: salonId });
  };

  // Add index for multi-tenant queries
  schema.index({ [tenantField]: 1, createdAt: -1 });
};

/**
 * Request middleware to set salonId in query options
 * Usage: app.use(injectTenantContext);
 */
export const injectTenantContext = (req, res, next) => {
  // Extract salonId from authenticated user
  if (req.user && req.user.salonId) {
    req.tenantId = req.user.salonId;

    // Store in request for easy access in controllers
    req.tenantFilter = { salonId: req.user.salonId };

    if (IS_DEVELOPMENT) {
      logger.debug(`[MultiTenant] Tenant context set: ${req.user.salonId}`);
    }
  } else if (req.user && req.user.role === 'ceo') {
    // CEO can access all tenants - set flag
    req.isSuperUser = true;
  }

  next();
};

/**
 * Decorator for controller methods to enforce tenant context
 */
export const requireTenant = (controllerMethod) => {
  return async (req, res, next) => {
    if (!req.tenantId && !req.isSuperUser) {
      return res.status(403).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    return controllerMethod(req, res, next);
  };
};

export default {
  multiTenantPlugin,
  injectTenantContext,
  requireTenant
};
