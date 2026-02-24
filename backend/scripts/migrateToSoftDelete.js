import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

dotenv.config();

// Import all models that need soft delete
import Booking from '../models/Booking.js';
import TattooProject from '../models/TattooProject.js';
import WorkflowProject from '../models/WorkflowProject.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import MarketingCampaign from '../models/MarketingCampaign.js';
import Package from '../models/Package.js';
import Service from '../models/Service.js';
import Employee from '../models/Employee.js';
import Resource from '../models/Resource.js';
import Waitlist from '../models/Waitlist.js';
import ConsentForm from '../models/ConsentForm.js';
import ClinicalNote from '../models/ClinicalNote.js';
import Payment from '../models/Payment.js';
import Widget from '../models/Widget.js';

const models = [
  { name: 'Booking', model: Booking },
  { name: 'TattooProject', model: TattooProject },
  { name: 'WorkflowProject', model: WorkflowProject },
  { name: 'Customer', model: Customer },
  { name: 'Salon', model: Salon },
  { name: 'User', model: User },
  { name: 'MarketingCampaign', model: MarketingCampaign },
  { name: 'Package', model: Package },
  { name: 'Service', model: Service },
  { name: 'Employee', model: Employee },
  { name: 'Resource', model: Resource },
  { name: 'Waitlist', model: Waitlist },
  { name: 'ConsentForm', model: ConsentForm },
  { name: 'ClinicalNote', model: ClinicalNote },
  { name: 'Payment', model: Payment },
  { name: 'Widget', model: Widget }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const runMigrations = async () => {
  logger.log('\n🔄 Starting Soft-Delete Migration...\n');

  for (const { name, model } of models) {
    try {
      // Check if documents already have deletedAt field
      const hasDeletedAt = await model.findOne({ deletedAt: { $exists: true } });

      if (hasDeletedAt) {
        logger.log(`⏭️  ${name} - Already migrated (skipping)`);
        continue;
      }

      // Add soft delete fields to all documents
      const result = await model.updateMany(
        {},
        {
          $set: {
            deletedAt: null,
            deletedBy: null,
            deletionReason: null
          }
        }
      );

      logger.log(
        `✅ ${name} - Migrated ${result.modifiedCount}/${result.matchedCount} documents`
      );
    } catch (error) {
      logger.warn(`⚠️  ${name} - Migration failed: ${error.message}`);
    }
  }

  logger.log('\n✅ Soft-Delete Migration completed!\n');
};

const main = async () => {
  await connectDB();
  await runMigrations();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  logger.error('❌ Fatal error:', error.message);
  process.exit(1);
});
