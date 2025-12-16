import mongoose from 'mongoose';

const MarketingTemplateSchema = new mongoose.Schema(
  {
    // Template info
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    type: {
      type: String,
      required: true,
      enum: ['inactive_customers', 'birthday', 'last_minute', 'upsell', 'loyalty', 'referral'],
      unique: true
    },

    tier: {
      type: String,
      required: true,
      enum: ['starter', 'professional', 'enterprise']
    },

    // Display
    icon: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true,
      maxlength: 500
    },

    // Default configuration
    defaultRules: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    defaultMessage: {
      template: {
        type: String,
        required: true
      },
      discountType: {
        type: String,
        required: true
      },
      discountValue: {
        type: Number,
        required: true
      },
      validDays: {
        type: Number,
        required: true
      }
    },

    defaultSchedule: {
      type: {
        type: String,
        required: true
      },
      time: String,
      dayOfWeek: Number
    },

    // Marketing info
    estimatedROI: {
      type: Number,
      required: true,
      min: 0
    },

    estimatedConversionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    // Flags
    popular: {
      type: Boolean,
      default: false
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Static method: Seed default templates
MarketingTemplateSchema.statics.seedTemplates = async function() {
  const templates = [
    {
      name: 'Inaktive Kunden zurÃ¼ckgewinnen',
      type: 'inactive_customers',
      tier: 'starter',
      icon: 'ðŸ”„',
      description: 'Gewinnen Sie Kunden zurÃ¼ck, die 6+ Monate nicht mehr da waren. Perfekt fÃ¼r Starter-Tier!',
      defaultRules: {
        inactiveDays: 180,
        maxRecipients: 50
      },
      defaultMessage: {
        template: 'Hallo {{customerName}}! Wir vermissen Sie bei {{salonName}}! ðŸ˜Š Kommen Sie zurÃ¼ck und erhalten Sie {{discount}} Rabatt. Buchen: {{bookingLink}} (GÃ¼ltig {{validDays}} Tage)',
        discountType: 'percentage',
        discountValue: 20,
        validDays: 30
      },
      defaultSchedule: {
        type: 'weekly',
        time: '10:00',
        dayOfWeek: 1 // Monday
      },
      estimatedROI: 350,
      estimatedConversionRate: 15,
      popular: true
    },
    {
      name: 'Geburtstags-Ãœberraschung',
      type: 'birthday',
      tier: 'professional',
      icon: 'ðŸŽ‚',
      description: 'Automatische Geburtstagsgutscheine 7 Tage vor dem Geburtstag. ErhÃ¶ht Kundenbindung um 40%!',
      defaultRules: {
        birthdayDaysBefore: 7,
        maxRecipients: 100
      },
      defaultMessage: {
        template: 'ðŸŽ‰ Alles Gute zum Geburtstag, {{customerName}}! Feiern Sie mit uns - {{discount}} Geschenk wartet auf Sie bei {{salonName}}! Code: {{discountCode}} - Buchen: {{bookingLink}}',
        discountType: 'fixed_amount',
        discountValue: 25,
        validDays: 14
      },
      defaultSchedule: {
        type: 'daily',
        time: '09:00'
      },
      estimatedROI: 420,
      estimatedConversionRate: 35,
      popular: true
    },
    {
      name: 'Last-Minute Slots fÃ¼llen',
      type: 'last_minute',
      tier: 'professional',
      icon: 'âš¡',
      description: 'FÃ¼llen Sie freie Termine kurzfristig mit Stammkunden. Reduziert Leerlauf um 60%!',
      defaultRules: {
        targetSegment: 'regular',
        maxRecipients: 30
      },
      defaultMessage: {
        template: 'âš¡ LAST-MINUTE bei {{salonName}}! Freier Termin HEUTE/MORGEN mit {{discount}} Rabatt nur fÃ¼r Sie, {{customerName}}! Schnell buchen: {{bookingLink}} Code: {{discountCode}}',
        discountType: 'percentage',
        discountValue: 15,
        validDays: 2
      },
      defaultSchedule: {
        type: 'manual'
      },
      estimatedROI: 280,
      estimatedConversionRate: 25,
      popular: false
    },
    {
      name: 'Neue Services bewerben',
      type: 'upsell',
      tier: 'professional',
      icon: 'âœ¨',
      description: 'Informieren Sie Bestandskunden Ã¼ber neue Dienstleistungen mit EinfÃ¼hrungsrabatt.',
      defaultRules: {
        minBookings: 3,
        maxRecipients: 200
      },
      defaultMessage: {
        template: 'âœ¨ NEU bei {{salonName}}: [Service-Name]! Als treuer Kunde erhalten Sie {{discount}} EinfÃ¼hrungsrabatt, {{customerName}}. Jetzt testen: {{bookingLink}} Code: {{discountCode}}',
        discountType: 'percentage',
        discountValue: 30,
        validDays: 30
      },
      defaultSchedule: {
        type: 'manual'
      },
      estimatedROI: 310,
      estimatedConversionRate: 22,
      popular: false
    },
    {
      name: 'VIP Treue-Bonus',
      type: 'loyalty',
      tier: 'professional',
      icon: 'ðŸ‘‘',
      description: 'Belohnen Sie Ihre besten Kunden (10+ Buchungen) automatisch mit exklusiven Rabatten.',
      defaultRules: {
        minBookings: 10,
        minSpent: 500,
        maxRecipients: 50
      },
      defaultMessage: {
        template: 'ðŸ‘‘ VIP-DANKESCHÃ–N! Sie sind ein geschÃ¤tzter Stammgast bei {{salonName}}, {{customerName}}! Hier ist Ihr exklusiver {{discount}} Treue-Rabatt: {{discountCode}} - {{bookingLink}}',
        discountType: 'percentage',
        discountValue: 25,
        validDays: 60
      },
      defaultSchedule: {
        type: 'weekly',
        time: '10:00',
        dayOfWeek: 3 // Wednesday
      },
      estimatedROI: 450,
      estimatedConversionRate: 40,
      popular: true
    },
    {
      name: 'Freunde werben - Belohnung',
      type: 'referral',
      tier: 'professional',
      icon: '👥',
      description: 'Motivieren Sie treue Kunden, Freunde zu werben. Beide erhalten einen Rabatt!',
      defaultRules: {
        minBookings: 3,
        maxRecipients: 100
      },
      defaultMessage: {
        template: '👥 {{customerName}}, Sie sind ein geschätzter Kunde bei {{salonName}}! Empfehlen Sie uns weiter und Sie UND Ihr Freund erhalten {{discount}} Rabatt. Code: {{discountCode}} - {{bookingLink}}',
        discountType: 'percentage',
        discountValue: 15,
        validDays: 60
      },
      defaultSchedule: {
        type: 'monthly',
        time: '10:00',
        dayOfMonth: 1
      },
      estimatedROI: 380,
      estimatedConversionRate: 25,
      popular: true
    }
  ];

  // Upsert templates (update if exists, create if not)
  for (const template of templates) {
    await this.findOneAndUpdate(
      { type: template.type },
      template,
      { upsert: true, new: true }
    );
  }

  console.log('âœ… Marketing templates seeded successfully');
  return templates.length;
};

// Static method: Get templates for tier
MarketingTemplateSchema.statics.getForTier = function(tier) {
  const tierHierarchy = {
    starter: ['starter'],
    professional: ['starter', 'professional'],
    enterprise: ['starter', 'professional', 'enterprise']
  };

  return this.find({
    tier: { $in: tierHierarchy[tier] || ['starter'] },
    active: true
  }).sort({ popular: -1, name: 1 });
};

// Instance method: Create campaign from template
MarketingTemplateSchema.methods.createCampaign = function(salonId, customName) {
  return {
    salonId,
    name: customName || this.name,
    type: this.type,
    tier: this.tier,
    status: 'draft',
    rules: this.defaultRules,
    message: this.defaultMessage,
    schedule: this.defaultSchedule,
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalBooked: 0,
      totalRevenue: 0
    }
  };
};

export default mongoose.model('MarketingTemplate', MarketingTemplateSchema);
