/**
 * Create 3 test services for Starter, Professional and Enterprise studios.
 *
 * Usage:
 *   node backend/scripts/createPlanTestServices.cjs
 *
 * Behavior:
 * - Tries to find studios by name/slug hints first:
 *   - Barbershop Starter
 *   - Professional
 *   - Enterprisestudio / Enterprise
 * - Falls back to first salon per plan (starter/pro/professional/enterprise)
 * - Creates 3 idempotent test services per matched studio
 */

const mongoose = require('mongoose');
const path = require('path');

const rootEnvPath = path.join(__dirname, '../../.env');
const backendEnvPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: rootEnvPath });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: backendEnvPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const salonSchema = new mongoose.Schema({
  name: String,
  slug: String,
  subscription: {
    plan: String,
    planId: String,
    status: String
  }
}, { collection: 'salons' });

const serviceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  category: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'services' });

const Salon = mongoose.models.Salon || mongoose.model('Salon', salonSchema);
const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

const TEST_SERVICES = [
  {
    name: 'Testservice Basic Cut',
    description: 'Testservice für den Buchungsprozess (kurz).',
    price: 19,
    duration: 30,
    category: 'Test'
  },
  {
    name: 'Testservice Premium Cut',
    description: 'Testservice für den Buchungsprozess (mittel).',
    price: 29,
    duration: 45,
    category: 'Test'
  },
  {
    name: 'Testservice Deluxe Session',
    description: 'Testservice für den Buchungsprozess (lang).',
    price: 49,
    duration: 60,
    category: 'Test'
  }
];

const getPlanLabel = (salon) => {
  const text = `${salon.subscription?.plan || ''} ${salon.subscription?.planId || ''}`.toLowerCase();
  if (text.includes('enterprise')) return 'Enterprise';
  if (text.includes('pro') || text.includes('professional')) return 'Professional';
  if (text.includes('starter')) return 'Starter';
  return 'General';
};

const scoreSalon = (salon, hints) => {
  const name = (salon.name || '').toLowerCase();
  const slug = (salon.slug || '').toLowerCase();
  const plan = `${salon.subscription?.plan || ''} ${salon.subscription?.planId || ''}`.toLowerCase();

  let score = 0;
  for (const hint of hints.nameHints) {
    if (name.includes(hint) || slug.includes(hint)) score += 10;
  }
  for (const hint of hints.planHints) {
    if (plan.includes(hint)) score += 5;
  }
  return score;
};

const pickTargetSalon = (salons, hints) => {
  let best = null;
  let bestScore = -1;

  for (const salon of salons) {
    const score = scoreSalon(salon, hints);
    if (score > bestScore) {
      best = salon;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) return best;

  for (const salon of salons) {
    const plan = `${salon.subscription?.plan || ''} ${salon.subscription?.planId || ''}`.toLowerCase();
    if (hints.planHints.some((hint) => plan.includes(hint))) {
      return salon;
    }
  }

  return null;
};

async function upsertTestServicesForSalon(salon) {
  console.log(`\n🏪 Studio: ${salon.name} (${salon.slug})`);

  let created = 0;
  let existing = 0;

  for (const template of TEST_SERVICES) {
    const serviceName = `${template.name} (${getPlanLabel(salon)})`;

    const found = await Service.findOne({
      salonId: salon._id,
      name: serviceName
    }).lean();

    if (found) {
      existing += 1;
      console.log(`   ↺ Exists: ${serviceName}`);
      continue;
    }

    await Service.create({
      salonId: salon._id,
      name: serviceName,
      description: template.description,
      price: template.price,
      duration: template.duration,
      category: template.category,
      isActive: true
    });

    created += 1;
    console.log(`   ✅ Created: ${serviceName}`);
  }

  return { created, existing };
}

async function run() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const salons = await Salon.find({}, 'name slug subscription').lean();

    if (!salons.length) {
      console.log('⚠️ No salons found.');
      return;
    }

    const targets = [
      {
        key: 'starter',
        hints: {
          nameHints: ['barbershop starter', 'starter'],
          planHints: ['starter']
        }
      },
      {
        key: 'professional',
        hints: {
          nameHints: ['professional', 'pro studio', 'pro'],
          planHints: ['professional', 'pro']
        }
      },
      {
        key: 'enterprise',
        hints: {
          nameHints: ['enterprisestudio', 'enterprise studio', 'enterprise'],
          planHints: ['enterprise']
        }
      }
    ];

    let totalCreated = 0;
    let totalExisting = 0;

    for (const target of targets) {
      const salon = pickTargetSalon(salons, target.hints);
      if (!salon) {
        console.log(`\n⚠️ No matching salon found for ${target.key}.`);
        continue;
      }

      const result = await upsertTestServicesForSalon(salon);
      totalCreated += result.created;
      totalExisting += result.existing;
    }

    console.log('\n════════════════════════════════════════════');
    console.log(`✅ Done. Created: ${totalCreated}, Existing: ${totalExisting}`);
    console.log('════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected');
  }
}

run();
