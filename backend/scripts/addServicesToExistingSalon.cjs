/**
 * Add Services to Existing Salon
 * Fügt Services zu einem existierenden Salon hinzu
 *
 * Usage: node backend/scripts/addServicesToExistingSalon.cjs
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Create a .env file in the root directory with:');
  console.log('MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

// Service Schema
const serviceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  category: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);

async function addServices() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ID deines Test Salons
    const salonId = '6936054fc3f0f48ae67db4b7';

    // Check if services already exist
    const existingServices = await Service.find({ salonId });
    if (existingServices.length > 0) {
      console.log(`⚠️  Salon hat bereits ${existingServices.length} Services!`);
      console.log('Lösche alte Services...\n');
      await Service.deleteMany({ salonId });
    }

    // Create Services
    console.log('💈 Creating Services...');
    const services = [
      {
        name: 'Herrenschnitt',
        description: 'Klassischer Herrenhaarschnitt inkl. Waschen und Föhnen',
        price: 25,
        duration: 30,
        category: 'Herren'
      },
      {
        name: 'Damenschnitt kurz',
        description: 'Haarschnitt für kurzes Haar inkl. Waschen und Föhnen',
        price: 35,
        duration: 45,
        category: 'Damen'
      },
      {
        name: 'Damenschnitt lang',
        description: 'Haarschnitt für langes Haar inkl. Waschen und Föhnen',
        price: 45,
        duration: 60,
        category: 'Damen'
      },
      {
        name: 'Bartschnitt',
        description: 'Professioneller Bartschnitt und Konturierung',
        price: 15,
        duration: 20,
        category: 'Herren'
      },
      {
        name: 'Färben kurz',
        description: 'Haarfarbe für kurzes Haar inkl. Schnitt',
        price: 55,
        duration: 90,
        category: 'Damen'
      },
      {
        name: 'Färben lang',
        description: 'Haarfarbe für langes Haar inkl. Schnitt',
        price: 75,
        duration: 120,
        category: 'Damen'
      },
      {
        name: 'Strähnchen',
        description: 'Highlights/Lowlights nach Wahl',
        price: 65,
        duration: 90,
        category: 'Damen'
      },
      {
        name: 'Kinderschnitt',
        description: 'Haarschnitt für Kinder bis 12 Jahre',
        price: 18,
        duration: 25,
        category: 'Kinder'
      },
      {
        name: 'Waschen & Föhnen',
        description: 'Haare waschen und föhnen ohne Schnitt',
        price: 20,
        duration: 30,
        category: 'Damen'
      },
      {
        name: 'Hochsteckfrisur',
        description: 'Elegante Hochsteckfrisur für besondere Anlässe',
        price: 50,
        duration: 60,
        category: 'Damen'
      }
    ];

    const createdServices = [];
    for (const svc of services) {
      const service = await Service.create({
        ...svc,
        salonId,
        isActive: true
      });
      createdServices.push(service);
      console.log(`✅ ${svc.name} - €${svc.price} (${svc.duration}min)`);
    }

    console.log('\n🎉 Services erfolgreich hinzugefügt!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ ${createdServices.length} Services erstellt für "Test Salon"`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 Booking URL:');
    console.log('   https://jn-automation.vercel.app/s/mein-test-salon');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run script
addServices();
