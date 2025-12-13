import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Payment from '../models/Payment.js';
import Employee from '../models/Employee.js';
import Appointment from '../models/Appointment.js';
import BusinessSettings from '../models/BusinessSettings.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.log('\n✅ Database connected\n');
  } catch (error) {
    logger.error('\n❌ Database connection error:', error.message, '\n');
    process.exit(1);
  }
};

const getBackupDir = () => {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

const backupCollection = async (model, collectionName) => {
  try {
    logger.log(`  📦 Backing up ${collectionName}...`);
    const data = await model.find({});
    return {
      collectionName,
      count: data.length,
      data
    };
  } catch (error) {
    logger.error(`  ❌ Error backing up ${collectionName}:`, error.message);
    throw error;
  }
};

export const backupFullDatabase = async (compress = false) => {
  try {
    logger.log('\n================================');
    logger.log('  💾 FULL DATABASE BACKUP');
    logger.log('================================\n');
    logger.log('🔄 Backing up all collections...\n');

    const backupData = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI?.split('@')[0] + '@***',
      collections: {}
    };

    const collections = [
      { model: User, name: 'users' },
      { model: Customer, name: 'customers' },
      { model: Service, name: 'services' },
      { model: Booking, name: 'bookings' },
      { model: Review, name: 'reviews' },
      { model: Payment, name: 'payments' },
      { model: Employee, name: 'employees' },
      { model: Appointment, name: 'appointments' },
      { model: BusinessSettings, name: 'businessSettings' }
    ];

    let totalDocuments = 0;

    for (const collection of collections) {
      const backup = await backupCollection(collection.model, collection.name);
      backupData.collections[collection.name] = backup;
      totalDocuments += backup.count;
    }

    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let fileName = `backup-${timestamp}.json`;
    let filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    if (compress) {
      logger.log('\n📦 Compressing backup...\n');
      const compressedFileName = `${fileName}.gz`;
      const compressedFilePath = path.join(backupDir, compressedFileName);

      await pipeline(
        fs.createReadStream(filePath),
        zlib.createGzip(),
        fs.createWriteStream(compressedFilePath)
      );

      fs.unlinkSync(filePath);
      filePath = compressedFilePath;
      fileName = compressedFileName;
    }

    const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);

    logger.log('✅ Backup completed!\n');
    logger.log('📊 Backup Summary:');
    logger.log(`   File: ${fileName}`);
    logger.log(`   Path: ${filePath}`);
    logger.log(`   Size: ${fileSize} MB`);
    logger.log(`   Total Documents: ${totalDocuments}`);
    logger.log(`   Timestamp: ${backupData.timestamp}\n`);

    return { filePath, fileName, fileSize, totalDocuments, timestamp: backupData.timestamp };
  } catch (error) {
    logger.error('❌ Error backing up database:', error.message, '\n');
    throw error;
  }
};

export const backupSelectedCollections = async (collectionNames) => {
  try {
    logger.log('\n================================');
    logger.log('  💾 SELECTIVE BACKUP');
    logger.log('================================\n');

    const backupData = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    const availableCollections = {
      users: User,
      customers: Customer,
      services: Service,
      bookings: Booking,
      reviews: Review,
      payments: Payment,
      employees: Employee,
      appointments: Appointment,
      businessSettings: BusinessSettings
    };

    let totalDocuments = 0;

    for (const collectionName of collectionNames) {
      const model = availableCollections[collectionName];

      if (!model) {
        logger.warn(`⚠️  Unknown collection: ${collectionName}`);
        continue;
      }

      const backup = await backupCollection(model, collectionName);
      backupData.collections[collectionName] = backup;
      totalDocuments += backup.count;
    }

    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}-selective.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(2);

    logger.log('\n✅ Selective backup completed!\n');
    logger.log('📊 Backup Summary:');
    logger.log(`   File: ${fileName}`);
    logger.log(`   Collections: ${collectionNames.join(', ')}`);
    logger.log(`   Size: ${fileSize} KB`);
    logger.log(`   Total Documents: ${totalDocuments}\n`);

    return { filePath, fileName, fileSize };
  } catch (error) {
    logger.error('❌ Error backing up collections:', error.message, '\n');
    throw error;
  }
};
export const restoreFromBackup = async (backupFile) => {
  try {
    logger.log('\n================================');
    logger.log('  🔄 RESTORE FROM BACKUP');
    logger.log('================================\n');

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, backupFile);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    logger.log('📖 Reading backup file...\n');

    let backupData;

    if (backupFile.endsWith('.gz')) {
      const gunzip = zlib.createGunzip();
      const fileStream = fs.createReadStream(backupPath).pipe(gunzip);
      const chunks = [];

      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }

      backupData = JSON.parse(Buffer.concat(chunks).toString());
    } else {
      const fileContent = fs.readFileSync(backupPath, 'utf-8');
      backupData = JSON.parse(fileContent);
    }

    logger.log('🔄 Restoring collections...\n');

    const collectionModels = {
      users: User,
      customers: Customer,
      services: Service,
      bookings: Booking,
      reviews: Review,
      payments: Payment,
      employees: Employee,
      appointments: Appointment,
      businessSettings: BusinessSettings
    };

    let totalRestored = 0;

    for (const [collectionName, backup] of Object.entries(backupData.collections)) {
      const model = collectionModels[collectionName];

      if (!model) {
        logger.warn(`⚠️  Unknown collection: ${collectionName}`);
        continue;
      }

      await model.deleteMany({});

      if (backup.data && backup.data.length > 0) {
        await model.insertMany(backup.data);
        logger.log(`  ✅ Restored ${backup.data.length} documents to ${collectionName}`);
        totalRestored += backup.data.length;
      }
    }

    logger.log('\n✅ Restore completed!\n');
    logger.log('📊 Restore Summary:');
    logger.log(`   Backup: ${backupFile}`);
    logger.log(`   Total Documents Restored: ${totalRestored}`);
    logger.log(`   Backup Timestamp: ${backupData.timestamp}\n`);

    return totalRestored;
  } catch (error) {
    logger.error('❌ Error restoring backup:', error.message, '\n');
    throw error;
  }
};

export const listBackups = () => {
  try {
    const backupDir = getBackupDir();
    const files = fs.readdirSync(backupDir);

    if (files.length === 0) {
      logger.log('\n📁 No backups found\n');
      return [];
    }

    logger.log('\n📁 Available Backups:\n');

    files.forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);

      logger.log(`   ${index + 1}. ${file}`);
      logger.log(`      Size: ${size} MB`);
      logger.log(`      Modified: ${stats.mtime.toLocaleString()}\n`);
    });

    return files;
  } catch (error) {
    logger.error('❌ Error listing backups:', error.message, '\n');
    return [];
  }
};

export const deleteBackup = (backupFile) => {
  try {
    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, backupFile);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    fs.unlinkSync(backupPath);
    logger.log(`✅ Backup deleted: ${backupFile}\n`);
  } catch (error) {
    logger.error('❌ Error deleting backup:', error.message, '\n');
    throw error;
  }
};

const interactiveMode = async () => {
  try {
    logger.log('================================');
    logger.log('  💾 DATABASE BACKUP TOOL');
    logger.log('================================\n');

    logger.log('Options:');
    logger.log('1. Full backup');
    logger.log('2. Full backup (compressed)');
    logger.log('3. Selective backup');
    logger.log('4. Restore from backup');
    logger.log('5. List backups');
    logger.log('6. Delete backup\n');

    const option = await question('Choose option (1-6): ');

    if (option === '1') {
      await backupFullDatabase(false);
    } else if (option === '2') {
      await backupFullDatabase(true);
    } else if (option === '3') {
      logger.log('\nAvailable collections: users, customers, services, bookings, reviews, payments, employees, appointments, businessSettings');
      const collections = await question('Enter collection names (comma-separated): ');
      const collectionNames = collections.split(',').map(c => c.trim());
      await backupSelectedCollections(collectionNames);
    } else if (option === '4') {
      const backups = listBackups();
      if (backups.length > 0) {
        const backupNum = await question('Enter backup number to restore: ');
        const backupFile = backups[parseInt(backupNum) - 1];
        if (backupFile) {
          const confirm = await question('⚠️  This will overwrite existing data. Continue? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await restoreFromBackup(backupFile);
          }
        }
      }
    } else if (option === '5') {
      listBackups();
    } else if (option === '6') {
      const backups = listBackups();
      if (backups.length > 0) {
        const backupNum = await question('Enter backup number to delete: ');
        const backupFile = backups[parseInt(backupNum) - 1];
        if (backupFile) {
          const confirm = await question(`Delete ${backupFile}? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            deleteBackup(backupFile);
          }
        }
      }
    } else {
      logger.log('\n❌ Invalid option\n');
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message, '\n');
    rl.close();
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await interactiveMode();
  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message, '\n');
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// ==================== EXPORT ====================

export default {
  backupFullDatabase,
  backupSelectedCollections,
  restoreFromBackup,
  listBackups,
  deleteBackup
};
