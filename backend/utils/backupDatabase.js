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
    console.log('\n✅ Database connected\n');
  } catch (error) {
    console.error('\n❌ Database connection error:', error.message, '\n');
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
    console.log(`  📦 Backing up ${collectionName}...`);
    const data = await model.find({});
    return {
      collectionName,
      count: data.length,
      data
    };
  } catch (error) {
    console.error(`  ❌ Error backing up ${collectionName}:`, error.message);
    throw error;
  }
};

export const backupFullDatabase = async (compress = false) => {
  try {
    console.log('\n================================');
    console.log('  💾 FULL DATABASE BACKUP');
    console.log('================================\n');
    console.log('🔄 Backing up all collections...\n');

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
      console.log('\n📦 Compressing backup...\n');
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

    console.log('✅ Backup completed!\n');
    console.log('📊 Backup Summary:');
    console.log(`   File: ${fileName}`);
    console.log(`   Path: ${filePath}`);
    console.log(`   Size: ${fileSize} MB`);
    console.log(`   Total Documents: ${totalDocuments}`);
    console.log(`   Timestamp: ${backupData.timestamp}\n`);

    return { filePath, fileName, fileSize, totalDocuments, timestamp: backupData.timestamp };
  } catch (error) {
    console.error('❌ Error backing up database:', error.message, '\n');
    throw error;
  }
};

export const backupSelectedCollections = async (collectionNames) => {
  try {
    console.log('\n================================');
    console.log('  💾 SELECTIVE BACKUP');
    console.log('================================\n');

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
        console.warn(`⚠️  Unknown collection: ${collectionName}`);
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

    console.log('\n✅ Selective backup completed!\n');
    console.log('📊 Backup Summary:');
    console.log(`   File: ${fileName}`);
    console.log(`   Collections: ${collectionNames.join(', ')}`);
    console.log(`   Size: ${fileSize} KB`);
    console.log(`   Total Documents: ${totalDocuments}\n`);

    return { filePath, fileName, fileSize };
  } catch (error) {
    console.error('❌ Error backing up collections:', error.message, '\n');
    throw error;
  }
};
export const restoreFromBackup = async (backupFile) => {
  try {
    console.log('\n================================');
    console.log('  🔄 RESTORE FROM BACKUP');
    console.log('================================\n');

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, backupFile);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log('📖 Reading backup file...\n');

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

    console.log('🔄 Restoring collections...\n');

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
        console.warn(`⚠️  Unknown collection: ${collectionName}`);
        continue;
      }

      await model.deleteMany({});

      if (backup.data && backup.data.length > 0) {
        await model.insertMany(backup.data);
        console.log(`  ✅ Restored ${backup.data.length} documents to ${collectionName}`);
        totalRestored += backup.data.length;
      }
    }

    console.log(`\n✅ Restore completed!\n`);
    console.log('📊 Restore Summary:');
    console.log(`   Backup: ${backupFile}`);
    console.log(`   Total Documents Restored: ${totalRestored}`);
    console.log(`   Backup Timestamp: ${backupData.timestamp}\n`);

    return totalRestored;
  } catch (error) {
    console.error('❌ Error restoring backup:', error.message, '\n');
    throw error;
  }
};

export const listBackups = () => {
  try {
    const backupDir = getBackupDir();
    const files = fs.readdirSync(backupDir);

    if (files.length === 0) {
      console.log('\n📁 No backups found\n');
      return [];
    }

    console.log('\n📁 Available Backups:\n');

    files.forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);

      console.log(`   ${index + 1}. ${file}`);
      console.log(`      Size: ${size} MB`);
      console.log(`      Modified: ${stats.mtime.toLocaleString()}\n`);
    });

    return files;
  } catch (error) {
    console.error('❌ Error listing backups:', error.message, '\n');
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
    console.log(`✅ Backup deleted: ${backupFile}\n`);
  } catch (error) {
    console.error('❌ Error deleting backup:', error.message, '\n');
    throw error;
  }
};

const interactiveMode = async () => {
  try {
    console.log('================================');
    console.log('  💾 DATABASE BACKUP TOOL');
    console.log('================================\n');

    console.log('Options:');
    console.log('1. Full backup');
    console.log('2. Full backup (compressed)');
    console.log('3. Selective backup');
    console.log('4. Restore from backup');
    console.log('5. List backups');
    console.log('6. Delete backup\n');

    const option = await question('Choose option (1-6): ');

    if (option === '1') {
      await backupFullDatabase(false);
    } else if (option === '2') {
      await backupFullDatabase(true);
    } else if (option === '3') {
      console.log('\nAvailable collections: users, customers, services, bookings, reviews, payments, employees, appointments, businessSettings');
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
      console.log('\n❌ Invalid option\n');
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message, '\n');
    rl.close();
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await interactiveMode();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message, '\n');
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
