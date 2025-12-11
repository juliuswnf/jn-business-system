/**
 * Create Demo Salon Script
 * Creates a realistic demo salon for live demonstrations
 *
 * Usage: node backend/scripts/createDemoSalon.cjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jn-automation';

// Define schemas (can't import ES6 modules in CJS)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'salon_owner', 'employee', 'admin', 'ceo'], required: true },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  phone: String,
  isActive: { type: Boolean, default: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});

const salonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    zip: String,
    country: String
  },
  city: String,
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'pro' },
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'trialing'], default: 'active' },
    currentPeriodEnd: Date
  },
  settings: {
    bookingBuffer: { type: Number, default: 15 },
    advanceBookingDays: { type: Number, default: 30 }
  },
  createdAt: { type: Date, default: Date.now }
});

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

const User = mongoose.model('User', userSchema);
const Salon = mongoose.model('Salon', salonSchema);
const Service = mongoose.model('Service', serviceSchema);

async function createDemoSalon() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if demo salon already exists
    const existingSalon = await Salon.findOne({ slug: 'demo-salon-muenchen' });
    if (existingSalon) {
      console.log('⚠️  Demo Salon already exists!');
      console.log('📍 Salon:', existingSalon.name);
      console.log('🔗 Booking URL: /s/demo-salon-muenchen\n');
      process.exit(0);
    }

    // 1. Create Owner
    console.log('👤 Creating Demo Salon Owner...');
    const hashedPassword = await bcrypt.hash('Demo123!', 10);
    const owner = await User.create({
      email: 'demo@salon-muenchen.de',
      password: hashedPassword,
      name: 'Max Mustermann',
      role: 'salon_owner',
      phone: '+49 89 12345678',
      isActive: true
    });
    console.log('✅ Owner created:', owner.email);

    // 2. Create Salon
    console.log('\n🏢 Creating Demo Salon...');
    const salon = await Salon.create({
      name: 'Demo Salon München',
      slug: 'demo-salon-muenchen',
      ownerId: owner._id,
      phone: '+49 89 12345678',
      email: 'info@demo-salon-muenchen.de',
      address: {
        street: 'Marienplatz 1',
        city: 'München',
        zip: '80331',
        country: 'Deutschland'
      },
      city: 'München',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '19:00', closed: false },
        friday: { open: '09:00', close: '19:00', closed: false },
        saturday: { open: '09:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 Jahr
      },
      settings: {
        bookingBuffer: 15,
        advanceBookingDays: 30
      }
    });
    console.log('✅ Salon created:', salon.name);

    // Update owner with salonId
    owner.salonId = salon._id;
    await owner.save();

    // 3. Create Employees
    console.log('\n👥 Creating Employees...');
    const employees = [
      {
        email: 'anna@demo-salon-muenchen.de',
        name: 'Anna Schmidt',
        phone: '+49 89 12345679'
      },
      {
        email: 'thomas@demo-salon-muenchen.de',
        name: 'Thomas Müller',
        phone: '+49 89 12345680'
      }
    ];

    for (const emp of employees) {
      await User.create({
        ...emp,
        password: hashedPassword,
        role: 'employee',
        salonId: salon._id,
        isActive: true
      });
      console.log('✅ Employee created:', emp.name);
    }

    // 4. Create Services
    console.log('\n💈 Creating Services...');
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
      }
    ];

    for (const svc of services) {
      await Service.create({
        ...svc,
        salonId: salon._id,
        isActive: true
      });
      console.log(`✅ Service created: ${svc.name} - €${svc.price} (${svc.duration}min)`);
    }

    console.log('\n🎉 Demo Salon erfolgreich erstellt!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 LOGIN DATEN:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Owner Login:');
    console.log('  Email:    demo@salon-muenchen.de');
    console.log('  Passwort: (check script for default)');
    console.log('');
    console.log('Employee Login (Anna):');
    console.log('  Email:    anna@demo-salon-muenchen.de');
    console.log('  Passwort: (check script for default)');
    console.log('');
    console.log('Employee Login (Thomas):');
    console.log('  Email:    thomas@demo-salon-muenchen.de');
    console.log('  Passwort: (check script for default)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 Public Booking URL:');
    console.log('   http://localhost:5173/s/demo-salon-muenchen');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📍 Salon: Demo Salon München');
    console.log('📞 Telefon: +49 89 12345678');
    console.log('🏢 Adresse: Marienplatz 1, 80331 München');
    console.log('💼 Subscription: Pro Plan (Aktiv für 1 Jahr)');
    console.log('👥 Mitarbeiter: 3 (Owner + 2 Employees)');
    console.log('💈 Services: 8');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run script
createDemoSalon();
