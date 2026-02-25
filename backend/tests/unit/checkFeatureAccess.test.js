import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse, createMockNext } from '../mocks/request.js';

const mockFindById = jest.fn();

jest.unstable_mockModule('../../models/Salon.js', () => ({
  default: {
    findById: mockFindById
  }
}));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
  }
}));

const { checkFeatureAccess, requireActiveSubscription } =
  await import('../../middleware/checkFeatureAccess.js');

const mockSalonQuery = (salonDoc) => {
  const lean = jest.fn().mockResolvedValue(salonDoc);
  const select = jest.fn().mockReturnValue({ lean });
  mockFindById.mockReturnValue({ select });
};

describe('checkFeatureAccess middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows trial subscriptions for available features', async () => {
    mockSalonQuery({
      businessName: 'Trial Salon',
      subscription: { tier: 'professional', status: 'trial' }
    });

    const req = createMockRequest({
      user: { id: 'u1', salonId: 's1', role: 'salon_owner' },
      body: {},
      params: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await checkFeatureAccess('marketingAutomation')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.subscription).toEqual({ tier: 'professional', status: 'trial' });
  });

  it('denies feature access when starter tier lacks apiAccess', async () => {
    mockSalonQuery({
      businessName: 'Starter Salon',
      subscription: { tier: 'starter', status: 'active' }
    });

    const req = createMockRequest({
      user: { id: 'u2', salonId: 's2', role: 'salon_owner' },
      body: {},
      params: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await checkFeatureAccess('apiAccess')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.code).toBe('FEATURE_NOT_AVAILABLE');
    expect(res.jsonData.feature).toBe('apiAccess');
    expect(res.jsonData.currentTier).toBe('starter');
  });

  it('allows enterprise tier for apiAccess', async () => {
    mockSalonQuery({
      businessName: 'Enterprise Salon',
      subscription: { tier: 'enterprise', status: 'active' }
    });

    const req = createMockRequest({
      user: { id: 'u3', salonId: 's3', role: 'salon_owner' },
      body: {},
      params: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await checkFeatureAccess('apiAccess')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.subscription).toEqual({ tier: 'enterprise', status: 'active' });
  });

  it('blocks inactive subscriptions', async () => {
    mockSalonQuery({
      businessName: 'Inactive Salon',
      subscription: { tier: 'enterprise', status: 'past_due' }
    });

    const req = createMockRequest({
      user: { id: 'u4', salonId: 's4', role: 'salon_owner' },
      body: {},
      params: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await checkFeatureAccess('webhooks')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.code).toBe('SUBSCRIPTION_INACTIVE');
    expect(res.jsonData.subscriptionStatus).toBe('past_due');
  });

  it('allows CEO requests without salon context', async () => {
    const req = createMockRequest({
      user: { id: 'ceo1', role: 'ceo' },
      body: {},
      params: {}
    });
    const res = createMockResponse();
    const next = createMockNext();

    await checkFeatureAccess('hipaaCompliance')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(req.subscription).toEqual({ tier: 'enterprise', status: 'active' });
  });
});

describe('requireActiveSubscription middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows trial status subscriptions', async () => {
    mockSalonQuery({ subscription: { tier: 'starter', status: 'trial' } });

    const req = createMockRequest({
      user: { id: 'u5', salonId: 's5', role: 'salon_owner' }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when status is not active/trialing/trial', async () => {
    mockSalonQuery({ subscription: { tier: 'starter', status: 'canceled' } });

    const req = createMockRequest({
      user: { id: 'u6', salonId: 's6', role: 'salon_owner' }
    });
    const res = createMockResponse();
    const next = createMockNext();

    await requireActiveSubscription(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.code).toBe('SUBSCRIPTION_REQUIRED');
  });
});
