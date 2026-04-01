import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockConsentFind = jest.fn();
const mockConsentFindOne = jest.fn();
const mockConsentFindById = jest.fn();
const mockConsentCountDocuments = jest.fn();

const mockSalonFindById = jest.fn();

const mockBookingAggregate = jest.fn();
const mockBookingFind = jest.fn();
const mockBookingFindById = jest.fn();
const mockBookingFindByIdAndUpdate = jest.fn();
const mockBookingFindOneAndUpdate = jest.fn();
const mockBookingDistinct = jest.fn();

const mockPaymentFind = jest.fn();
const mockPaymentFindById = jest.fn();
const mockPaymentFindByIdAndUpdate = jest.fn();
const mockPaymentFindOneAndUpdate = jest.fn();
const mockPaymentCountDocuments = jest.fn();
const mockPaymentAggregate = jest.fn();
const mockPaymentCreate = jest.fn();

const makeAuthMiddleware = () => {
  const protect = (req, res, next) => {
    const rawUser = req.headers['x-test-user'];
    if (!rawUser) {
      return res.status(401).json({ success: false, message: 'Nicht authentifiziert - Token erforderlich' });
    }

    try {
      req.user = JSON.parse(rawUser);
      return next();
    } catch (_error) {
      return res.status(401).json({ success: false, message: 'Token ungültig' });
    }
  };

  const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Sie haben keine Berechtigung für diese Aktion' });
    }

    return next();
  };

  return { protect, authorize };
};

jest.unstable_mockModule('../../models/ConsentForm.js', () => ({
  default: {
    find: mockConsentFind,
    findOne: mockConsentFindOne,
    findById: mockConsentFindById,
    countDocuments: mockConsentCountDocuments
  }
}));

jest.unstable_mockModule('../../models/Salon.js', () => ({
  default: {
    findById: mockSalonFindById
  }
}));

jest.unstable_mockModule('../../models/Booking.js', () => ({
  default: {
    aggregate: mockBookingAggregate,
    find: mockBookingFind,
    findById: mockBookingFindById,
    findByIdAndUpdate: mockBookingFindByIdAndUpdate,
    findOneAndUpdate: mockBookingFindOneAndUpdate,
    distinct: mockBookingDistinct
  }
}));

jest.unstable_mockModule('../../models/Payment.js', () => ({
  default: {
    find: mockPaymentFind,
    findById: mockPaymentFindById,
    findByIdAndUpdate: mockPaymentFindByIdAndUpdate,
    findOneAndUpdate: mockPaymentFindOneAndUpdate,
    countDocuments: mockPaymentCountDocuments,
    aggregate: mockPaymentAggregate,
    create: mockPaymentCreate
  }
}));

jest.unstable_mockModule('../../middleware/authMiddleware.js', () => ({
  default: makeAuthMiddleware()
}));

jest.unstable_mockModule('../../middleware/securityMiddleware.js', () => ({
  default: {
    validateCSRFToken: (_req, _res, next) => next(),
    validateContentType: (_req, _res, next) => next()
  }
}));

jest.unstable_mockModule('../../middleware/rateLimiterMiddleware.js', () => ({
  paymentLimiter: (_req, _res, next) => next()
}));

jest.unstable_mockModule('../../middleware/validationMiddleware.js', () => ({
  validateBody: (_req, _res, next) => next()
}));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn()
  }
}));

jest.unstable_mockModule('../../utils/pdfGenerator.js', () => ({
  generateConsentPDF: jest.fn().mockResolvedValue('https://example.org/consent.pdf')
}));

const consentRoutes = (await import('../../routes/consentFormRoutes.js')).default;
const crmRoutes = (await import('../../routes/crmRoutes.js')).default;
const paymentRoutes = (await import('../../routes/paymentRoutes.js')).default;

const createChainedQuery = ({
  result,
  terminal = 'lean',
  includeMaxTime = false,
  twoLeanCalls = false
}) => {
  const chain = {};
  let leanCallCount = 0;

  chain.populate = jest.fn(() => chain);
  chain.sort = jest.fn(() => chain);
  chain.skip = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.session = jest.fn(() => chain);

  if (includeMaxTime) {
    chain.maxTimeMS = jest.fn(() => chain);
  }

  if (terminal === 'maxTimeMS') {
    chain.maxTimeMS = jest.fn().mockResolvedValue(result);
  }

  if (terminal === 'lean') {
    chain.lean = jest.fn(() => {
      leanCallCount += 1;

      if (twoLeanCalls) {
        return leanCallCount >= 2 ? Promise.resolve(result) : chain;
      }

      return Promise.resolve(result);
    });
  }

  if (terminal === 'maxTimeAfterLean') {
    chain.lean = jest.fn(() => chain);
    chain.maxTimeMS = jest.fn().mockResolvedValue(result);
  }

  if (terminal === 'sortThenMaxTime') {
    chain.sort = jest.fn(() => chain);
    chain.maxTimeMS = jest.fn().mockResolvedValue(result);
  }

  return chain;
};

const createAggregateChain = (result) => ({
  maxTimeMS: jest.fn().mockResolvedValue(result)
});

const createAppWithConsentRoutes = () => {
  const app = express();
  app.use(express.json());
  app.use('/consent', consentRoutes);
  return app;
};

const createAppWithCrmRoutes = () => {
  const app = express();
  app.use(express.json());
  app.use('/crm', makeAuthMiddleware().protect, crmRoutes);
  return app;
};

const createAppWithPaymentRoutes = () => {
  const app = express();
  app.use(express.json());
  app.use('/payments', paymentRoutes);
  return app;
};

const salonOwnerSalonA = JSON.stringify({ id: 'owner-a', role: 'salon_owner', salonId: 'salonA' });
const ceoUser = JSON.stringify({ id: 'ceo-1', role: 'ceo' });

describe('Tenant boundary integration: Consent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks unauthenticated access to protected consent endpoints', async () => {
    const app = createAppWithConsentRoutes();

    const response = await request(app).get('/consent/customer/customer-1');

    expect(response.status).toBe(401);
  });

  it('forces customer consent queries to the authenticated tenant', async () => {
    const app = createAppWithConsentRoutes();
    mockConsentFind.mockReturnValue(
      createChainedQuery({ result: [], terminal: 'maxTimeAfterLean' })
    );

    const response = await request(app)
      .get('/consent/customer/customer-1?salonId=salonB')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(200);
    expect(mockConsentFind).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-1',
        salonId: 'salonA'
      })
    );
    expect(mockConsentFind.mock.calls[0][0].salonId).not.toBe('salonB');
  });

  it('returns 403 for cross-tenant consent detail access', async () => {
    const app = createAppWithConsentRoutes();
    mockConsentFindById.mockReturnValue(
      createChainedQuery({
        result: { _id: 'consent-1', salonId: 'salonB' },
        terminal: 'maxTimeAfterLean'
      })
    );

    const response = await request(app)
      .get('/consent/consent-1')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(403);
  });

  it('keeps /check route reachable (not shadowed by /:id)', async () => {
    const app = createAppWithConsentRoutes();
    mockConsentFindOne.mockReturnValue(
      createChainedQuery({ result: null, terminal: 'sortThenMaxTime' })
    );

    const response = await request(app)
      .get('/consent/check/customer-1/treatment')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(200);
    expect(response.body.hasValidConsent).toBe(false);
    expect(mockConsentFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer-1', salonId: 'salonA' })
    );
  });
});

describe('Tenant boundary integration: CRM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses authenticated tenant in CRM aggregation even when query tries another salonId', async () => {
    const app = createAppWithCrmRoutes();
    mockBookingAggregate
      .mockReturnValueOnce(createAggregateChain([]))
      .mockReturnValueOnce(createAggregateChain([{ total: 0 }]));

    const response = await request(app)
      .get('/crm/customers?salonId=salonB')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(200);
    const firstPipeline = mockBookingAggregate.mock.calls[0][0];
    expect(firstPipeline[0]).toEqual({ $match: { salonId: 'salonA' } });
  });

  it('returns 400 when authenticated user has no salon context', async () => {
    const app = createAppWithCrmRoutes();

    const response = await request(app)
      .get('/crm/customers')
      .set('x-test-user', JSON.stringify({ id: 'employee-1', role: 'employee' }));

    expect(response.status).toBe(400);
  });
});

describe('Tenant boundary integration: Payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forces payment history filters to authenticated tenant for non-CEO users', async () => {
    const app = createAppWithPaymentRoutes();
    mockPaymentCountDocuments.mockResolvedValue(0);
    mockPaymentFind.mockReturnValue(
      createChainedQuery({
        result: [],
        terminal: 'lean',
        includeMaxTime: true,
        twoLeanCalls: true
      })
    );

    const response = await request(app)
      .get('/payments/history?salonId=salonB')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(200);
    expect(mockPaymentCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ salonId: 'salonA' })
    );
  });

  it('allows CEO history query to specify target salon', async () => {
    const app = createAppWithPaymentRoutes();
    mockPaymentCountDocuments.mockResolvedValue(0);
    mockPaymentFind.mockReturnValue(
      createChainedQuery({
        result: [],
        terminal: 'lean',
        includeMaxTime: true,
        twoLeanCalls: true
      })
    );

    const response = await request(app)
      .get('/payments/history?salonId=salonB')
      .set('x-test-user', ceoUser);

    expect(response.status).toBe(200);
    expect(mockPaymentCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ salonId: 'salonB' })
    );
  });

  it('returns 403 for cross-tenant payment details access', async () => {
    const app = createAppWithPaymentRoutes();
    mockPaymentFindById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        maxTimeMS: jest.fn().mockResolvedValue({
          _id: 'payment-1',
          bookingId: { salonId: 'salonB' }
        })
      })
    });

    const response = await request(app)
      .get('/payments/payment-1')
      .set('x-test-user', salonOwnerSalonA);

    expect(response.status).toBe(403);
  });

    it('returns 403 for cross-tenant refund attempts', async () => {
      const app = createAppWithPaymentRoutes();
      mockPaymentFindById.mockReturnValue({
        maxTimeMS: jest.fn().mockResolvedValue({
          _id: 'payment-2',
          bookingId: 'booking-2',
          amount: 120,
          status: 'completed',
          refundedAmount: 0,
          stripePaymentIntentId: 'pi_123'
        })
      });
      mockBookingFindById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          maxTimeMS: jest.fn().mockResolvedValue({
            salonId: 'salonB'
          })
        })
      });

      const response = await request(app)
        .post('/payments/refund')
        .set('x-test-user', salonOwnerSalonA)
        .send({ paymentId: 'payment-2', amount: 10, reason: 'requested_by_customer' });

      expect(response.status).toBe(403);
    });
});
