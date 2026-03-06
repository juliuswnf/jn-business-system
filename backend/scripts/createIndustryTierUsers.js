/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Salon from '../models/Salon.js';

dotenv.config();

const INDUSTRIES = [
  { key: 'barber', label: 'Barbershop', businessType: 'barbershop' },
  { key: 'beauty', label: 'Beauty', businessType: 'beauty-salon' },
  { key: 'tattoo', label: 'Tattoo', businessType: 'tattoo-piercing' },
  { key: 'medical', label: 'Medical', businessType: 'medical-aesthetics' },
  { key: 'nails', label: 'Nails', businessType: 'nail-salon' },
  { key: 'massage', label: 'Massage', businessType: 'massage-therapy' },
  { key: 'physio', label: 'Physiotherapie', businessType: 'physiotherapy' }
];

const TIERS = [
  { key: 'starter', label: 'Starter' },
  { key: 'professional', label: 'Professional' },
  { key: 'enterprise', label: 'Enterprise' }
];

const DEFAULT_PASSWORD = 'Demo@12345';

const ensureConnected = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI/MONGO_URI ist nicht gesetzt');
  }
  await mongoose.connect(mongoUri);
};

const makeEmail = (industryKey, tierKey) => `${industryKey}.${tierKey}@demo.jn-business-system.de`;

const makeSlug = (industryKey, tierKey) => `demo-${industryKey}-${tierKey}`;

const CUSTOMER_EMAIL = 'customer@demo.jn-business-system.de';

const upsertCustomerAccount = async () => {
  let user = await User.findOne({ email: CUSTOMER_EMAIL }).select('+password');

  if (user) {
    user.name = 'Demo Kunde';
    user.role = 'customer';
    user.isActive = true;
    user.emailVerified = true;
    user.password = DEFAULT_PASSWORD;
    user.salonId = null;
    await user.save();
  } else {
    user = await User.create({
      email: CUSTOMER_EMAIL,
      password: DEFAULT_PASSWORD,
      name: 'Demo Kunde',
      role: 'customer',
      isActive: true,
      emailVerified: true,
      salonId: null
    });
  }

  return {
    email: user.email,
    password: DEFAULT_PASSWORD,
    role: 'customer'
  };
};

const upsertIndustryEmployee = async (industry) => {
  const email = `${industry.key}.employee@demo.jn-business-system.de`;
  const starterSlug = makeSlug(industry.key, 'starter');
  const starterSalon = await Salon.findOne({ slug: starterSlug }).setOptions({ includeDeleted: true });

  if (!starterSalon) {
    throw new Error(`Starter-Salon nicht gefunden für Branche ${industry.label} (${starterSlug})`);
  }

  let user = await User.findOne({ email }).select('+password');

  if (user) {
    user.name = `Demo Mitarbeiter ${industry.label}`;
    user.role = 'employee';
    user.isActive = true;
    user.emailVerified = true;
    user.password = DEFAULT_PASSWORD;
    user.salonId = starterSalon._id;
    await user.save();
  } else {
    user = await User.create({
      email,
      password: DEFAULT_PASSWORD,
      name: `Demo Mitarbeiter ${industry.label}`,
      role: 'employee',
      isActive: true,
      emailVerified: true,
      salonId: starterSalon._id
    });
  }

  return {
    industry: industry.label,
    email: user.email,
    password: DEFAULT_PASSWORD,
    role: 'employee'
  };
};

const recreateAccount = async ({ industry, tier }) => {
  const email = makeEmail(industry.key, tier.key);
  const name = `Demo ${industry.label} ${tier.label}`;
  const salonName = `${industry.label} ${tier.label} Studio`;
  const slug = makeSlug(industry.key, tier.key);

  let user = await User.findOne({ email }).select('+password');
  if (user) {
    user.name = name;
    user.role = 'salon_owner';
    user.isActive = true;
    user.emailVerified = true;
    user.password = DEFAULT_PASSWORD;
    await user.save();
  } else {
    user = await User.create({
      email,
      password: DEFAULT_PASSWORD,
      name,
      role: 'salon_owner',
      isActive: true,
      emailVerified: true
    });
  }

  let salon = null;

  if (user.salonId) {
    salon = await Salon.findById(user.salonId).setOptions({ includeDeleted: true });
  }

  if (!salon) {
    salon = await Salon.findOne({ slug }).setOptions({ includeDeleted: true });
  }

  if (salon) {
    salon.name = salonName;
    salon.slug = slug;
    salon.owner = user._id;
    salon.email = email;
    salon.phone = '+49 30 00000000';
    salon.businessType = industry.businessType;
    salon.address = {
      street: 'Demo Straße 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland'
    };
    salon.isActive = true;
    salon.subscription = {
      ...salon.subscription,
      status: 'active',
      tier: tier.key,
      billingCycle: 'monthly',
      planId: tier.key,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    if (salon.deletedAt) {
      salon.deletedAt = null;
    }

    await salon.save();
  } else {
    salon = await Salon.create({
      name: salonName,
      slug,
      owner: user._id,
      email,
      phone: '+49 30 00000000',
      businessType: industry.businessType,
      address: {
        street: 'Demo Straße 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Deutschland'
      },
      isActive: true,
      subscription: {
        status: 'active',
        tier: tier.key,
        billingCycle: 'monthly',
        planId: tier.key,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  user.salonId = salon._id;
  await user.save();

  return {
    industry: industry.label,
    tier: tier.label,
    email,
    password: DEFAULT_PASSWORD,
    salon: salon.name
  };
};

const run = async () => {
  try {
    await ensureConnected();
    console.log('✅ DB verbunden');

    const ceoCount = await User.countDocuments({ role: 'ceo' });
    if (ceoCount === 0) {
      throw new Error('Kein CEO-Account gefunden. Abbruch aus Sicherheitsgründen.');
    }

    const ownerAccounts = [];
    const employeeAccounts = [];

    for (const industry of INDUSTRIES) {
      for (const tier of TIERS) {
        const account = await recreateAccount({ industry, tier });
        ownerAccounts.push(account);
      }
    }

    const customerAccount = await upsertCustomerAccount();

    for (const industry of INDUSTRIES) {
      const employee = await upsertIndustryEmployee(industry);
      employeeAccounts.push(employee);
    }

    console.log(`✅ ${ownerAccounts.length} Branch-×-Modell-Owner-Logins erstellt`);
    console.log(`✅ ${employeeAccounts.length} Mitarbeiter-Logins erstellt (1 pro Branche)`);
    console.log('✅ 1 Kunden-Login erstellt');
    console.log('');
    console.log('=== OWNER LOGIN LISTE ===');
    ownerAccounts.forEach((entry) => {
      console.log(`[${entry.industry} | ${entry.tier}] ${entry.email} | ${entry.password}`);
    });

    console.log('');
    console.log('=== MITARBEITER LOGIN LISTE ===');
    employeeAccounts.forEach((entry) => {
      console.log(`[${entry.industry}] ${entry.email} | ${entry.password}`);
    });

    console.log('');
    console.log('=== KUNDEN LOGIN ===');
    console.log(`[Kunde] ${customerAccount.email} | ${customerAccount.password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
};

run();
