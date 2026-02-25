import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../mocks/request.js';

const mockIndustryFindOne = jest.fn();
const mockIndustryCountDocuments = jest.fn();
const mockIndustryEnableWorkflow = jest.fn();

const mockSalonFindById = jest.fn();

jest.unstable_mockModule('../../models/IndustryWorkflow.js', () => ({
  default: {
    findOne: mockIndustryFindOne,
    countDocuments: mockIndustryCountDocuments,
    enableWorkflow: mockIndustryEnableWorkflow
  }
}));

jest.unstable_mockModule('../../models/Salon.js', () => ({
  default: {
    findById: mockSalonFindById
  }
}));

jest.unstable_mockModule('../../models/WorkflowProject.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/WorkflowSession.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Consent.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Package.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Membership.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Booking.js', () => ({ default: {} }));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
  }
}));

const { enableWorkflow } = await import('../../controllers/workflowController.js');

const mockSalonQuery = (salonDoc) => {
  const lean = jest.fn().mockResolvedValue(salonDoc);
  const select = jest.fn().mockReturnValue({ lean });
  mockSalonFindById.mockReturnValue({ select });
};

const mockIndustryQuery = (workflowDoc) => {
  const lean = jest.fn().mockResolvedValue(workflowDoc);
  mockIndustryFindOne.mockReturnValue({ lean });
};

describe('workflow entitlement in enableWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('denies starter tier', async () => {
    mockSalonQuery({ subscription: { tier: 'starter', status: 'active' } });

    const req = createMockRequest({
      user: { salonId: 's1' },
      body: { industry: 'tattoo' }
    });
    const res = createMockResponse();

    await enableWorkflow(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.code).toBe('WORKFLOW_FEATURE_NOT_AVAILABLE');
  });

  it('denies professional tier when one workflow already active', async () => {
    mockSalonQuery({ subscription: { tier: 'professional', status: 'active' } });
    mockIndustryQuery(null);
    mockIndustryCountDocuments.mockResolvedValue(1);

    const req = createMockRequest({
      user: { salonId: 's2' },
      body: { industry: 'medical' }
    });
    const res = createMockResponse();

    await enableWorkflow(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.code).toBe('WORKFLOW_LIMIT_REACHED');
  });

  it('allows enterprise tier to enable workflow', async () => {
    mockSalonQuery({ subscription: { tier: 'enterprise', status: 'active' } });
    mockIndustryQuery(null);
    mockIndustryEnableWorkflow.mockResolvedValue({
      displayName: 'Tattoo Workflow',
      enabled: true
    });

    const req = createMockRequest({
      user: { salonId: 's3' },
      body: { industry: 'tattoo', features: ['consultation'] }
    });
    const res = createMockResponse();

    await enableWorkflow(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(mockIndustryEnableWorkflow).toHaveBeenCalledWith('s3', 'tattoo', ['consultation']);
  });
});
