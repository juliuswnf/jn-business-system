import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import ConsentForm from '../../models/ConsentForm.js';

jest.setTimeout(60000);

describe('Mongoose multi-tenant plugin (real DB)', () => {
  let mongod;
  let salonA;
  let salonB;

  const createConsent = async (salonId, overrides = {}) => {
    return ConsentForm.create({
      salonId,
      customerId: new mongoose.Types.ObjectId(),
      consentType: 'treatment',
      title: 'Standard Consent',
      description: 'Tenant boundary integration test document',
      signature: 'signed-by-customer',
      ipAddress: '127.0.0.1',
      version: '1.0',
      ...overrides
    });
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), {
      serverSelectionTimeoutMS: 10000
    });
  });

  beforeEach(async () => {
    salonA = new mongoose.Types.ObjectId();
    salonB = new mongoose.Types.ObjectId();
    await ConsentForm.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  it('injects tenant filter on find when salonId is provided in query options', async () => {
    await createConsent(salonA, { title: 'A1' });
    await createConsent(salonB, { title: 'B1' });

    const scopedResults = await ConsentForm.find({}, null, { salonId: salonA }).lean();

    expect(scopedResults).toHaveLength(1);
    expect(scopedResults[0].salonId.toString()).toBe(salonA.toString());
  });

  it('injects tenant filter on updateMany when salonId is provided in query options', async () => {
    const consentA = await createConsent(salonA, { title: 'Before A' });
    const consentB = await createConsent(salonB, { title: 'Before B' });

    await ConsentForm.updateMany(
      { consentType: 'treatment' },
      { $set: { title: 'Updated by scoped update' } },
      { salonId: salonA }
    );

    const updatedA = await ConsentForm.findById(consentA._id).lean();
    const updatedB = await ConsentForm.findById(consentB._id).lean();

    expect(updatedA.title).toBe('Updated by scoped update');
    expect(updatedB.title).toBe('Before B');
  });

  it('injects tenant filter on deleteMany when salonId is provided in query options', async () => {
    await createConsent(salonA, { title: 'Delete me A' });
    await createConsent(salonB, { title: 'Keep me B' });

    await ConsentForm.deleteMany({ consentType: 'treatment' }, { salonId: salonA });

    const remainingForA = await ConsentForm.countDocuments({ salonId: salonA });
    const remainingForB = await ConsentForm.countDocuments({ salonId: salonB });

    expect(remainingForA).toBe(0);
    expect(remainingForB).toBe(1);
  });

  it('rejects aggregation without tenant match in strict mode', async () => {
    await createConsent(salonA, { title: 'Strict A' });
    const previousStrictMode = process.env.MULTI_TENANT_STRICT;
    process.env.MULTI_TENANT_STRICT = 'true';

    try {
      await expect(
        ConsentForm.aggregate([
          { $match: { consentType: 'treatment' } },
          { $count: 'total' }
        ])
      ).rejects.toThrow('Aggregation MUST include salonId');
    } finally {
      if (previousStrictMode === undefined) {
        delete process.env.MULTI_TENANT_STRICT;
      } else {
        process.env.MULTI_TENANT_STRICT = previousStrictMode;
      }
    }
  });

  it('allows aggregation with tenant match in strict mode', async () => {
    await createConsent(salonA, { title: 'A-1' });
    await createConsent(salonA, { title: 'A-2' });
    await createConsent(salonB, { title: 'B-1' });

    const previousStrictMode = process.env.MULTI_TENANT_STRICT;
    process.env.MULTI_TENANT_STRICT = 'true';

    try {
      const result = await ConsentForm.aggregate([
        { $match: { salonId: salonA } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
    } finally {
      if (previousStrictMode === undefined) {
        delete process.env.MULTI_TENANT_STRICT;
      } else {
        process.env.MULTI_TENANT_STRICT = previousStrictMode;
      }
    }
  });

  it('supports explicit tenant-scoped static helper findByTenant', async () => {
    await createConsent(salonA, { title: 'A static' });
    await createConsent(salonB, { title: 'B static' });

    const tenantDocs = await ConsentForm.findByTenant(salonA, { consentType: 'treatment' }).lean();

    expect(tenantDocs).toHaveLength(1);
    expect(tenantDocs[0].salonId.toString()).toBe(salonA.toString());
  });
});
