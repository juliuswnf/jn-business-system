/**
 * SMS Templates fÃ¼r JN Business System
 * 
 * Branchen-spezifische SMS-Templates fÃ¼r verschiedene Workflows
 */

export const SMS_TEMPLATES = {
  // ==================== STANDARD BOOKING ====================
  booking_confirmation: {
    name: 'BuchungsbestÃ¤tigung',
    text: `Hey {{customerName}}! ðŸ‘‹

Dein Termin ist bestÃ¤tigt:
ðŸ“… {{date}} um {{time}}
â±ï¸ Dauer: {{duration}} Min
ðŸ“ {{salonName}}

Bei Fragen: {{salonPhone}}

Bis bald! ðŸ’ª`
  },

  booking_reminder_24h: {
    name: 'Erinnerung 24h vorher',
    text: `Hey {{customerName}}! ðŸ””

Morgen ist dein Termin:
ðŸ“… {{date}} um {{time}}
â±ï¸ {{duration}} Min
ðŸ“ {{salonName}}

Nicht vergessen! ðŸ˜Š`
  },

  booking_reminder_2h: {
    name: 'Erinnerung 2h vorher',
    text: `Hey {{customerName}}! â°

In 2 Stunden ist dein Termin:
ðŸ“… {{time}}
ðŸ“ {{salonName}}

Wir freuen uns auf dich! ðŸ’ª`
  },

  // ==================== TATTOO STUDIO ====================
  tattoo_session_reminder: {
    name: 'Tattoo Session Erinnerung',
    text: `Hey {{customerName}}! ðŸŽ¨

Morgen ist deine Tattoo-Session {{sessionNumber}}/{{totalSessions}}!

ðŸ“… {{date}} um {{time}}
â±ï¸ Dauer: {{duration}}h
ðŸ“ {{salonName}}

Bring bitte mit:
{{checklist}}

Wichtig:
âŒ Kein Alkohol 24h vorher
âŒ Keine BlutverdÃ¼nner

Bis morgen! ðŸ’ª
{{salonName}}`
  },

  tattoo_aftercare_reminder: {
    name: 'Tattoo Nachsorge',
    text: `Hey {{customerName}}! ðŸŽ¨

Wichtige Nachsorge fÃ¼r dein Tattoo:

âœ… 3x tÃ¤glich waschen (pH-neutral)
âœ… DÃ¼nn eincremen (Panthenol)
âŒ Keine Sonneneinstrahlung
âŒ Keine Sauna/Schwimmen (2 Wochen)

Bei Fragen: {{salonPhone}}

{{salonName}}`
  },

  tattoo_followup_appointment: {
    name: 'Tattoo Follow-up Termin',
    text: `Hey {{customerName}}! ðŸŽ¨

Dein Tattoo sollte jetzt gut verheilt sein!

NÃ¤chster Termin fÃ¼r Session {{nextSession}}/{{totalSessions}}:
ðŸ“… In {{weeks}} Wochen empfohlen

Jetzt buchen: {{bookingLink}}

{{salonName}}`
  },

  // ==================== MEDICAL AESTHETICS ====================
  treatment_follow_up: {
    name: 'Behandlungs-Follow-up',
    text: `Hey {{customerName}}! ðŸ’‰

Deine {{treatmentType}}-Behandlung wirkt bald aus.

Empfohlener Nachtermin:
â° In {{weeks}} Wochen

Jetzt buchen: {{bookingLink}}

Fragen? {{salonPhone}}

{{salonName}}`
  },

  treatment_aftercare: {
    name: 'Behandlungs-Nachsorge',
    text: `Hey {{customerName}}! ðŸ’‰

Wichtige Nachsorge nach {{treatmentType}}:

âœ… KÃ¼hlen bei Schwellung (24h)
âœ… Nicht massieren (48h)
âŒ Keine Sauna/Sport (24h)
âŒ Kein Alkohol (24h)

Bei Komplikationen sofort melden: {{salonPhone}}

{{salonName}}`
  },

  treatment_confirmation: {
    name: 'Behandlungs-BestÃ¤tigung',
    text: `Hey {{customerName}}! ðŸ’‰

Deine {{treatmentType}}-Behandlung ist bestÃ¤tigt:

ðŸ“… {{date}} um {{time}}
â±ï¸ ca. {{duration}} Min
ðŸ“ {{salonName}}

Bitte mitbringen:
âœ… AusgefÃ¼llte Anamnesebogen
âœ… Personalausweis

Bei Fragen: {{salonPhone}}

Bis bald! ðŸ’ª`
  },

  // ==================== SPA & WELLNESS ====================
  package_reminder: {
    name: 'Package Erinnerung',
    text: `Hey {{customerName}}! ðŸŽ

Du hast noch {{creditsRemaining}} Credits Ã¼brig in deinem "{{packageName}}"!

âš ï¸ VerfÃ¤llt am {{expiryDate}}

Jetzt buchen: {{bookingLink}}

{{salonName}}`
  },

  package_expiring_soon: {
    name: 'Package lÃ¤uft ab',
    text: `Hey {{customerName}}! â°

Dein "{{packageName}}" lÃ¤uft in {{daysLeft}} Tagen ab!

Noch {{creditsRemaining}} Credits verfÃ¼gbar.

Schnell buchen: {{bookingLink}}

{{salonName}}`
  },

  package_purchase_confirmation: {
    name: 'Package Kauf bestÃ¤tigt',
    text: `Hey {{customerName}}! ðŸŽ

Danke fÃ¼r deinen Kauf!

"{{packageName}}"
âœ… {{creditsTotal}} Credits
ðŸ“… GÃ¼ltig bis {{expiryDate}}

Jetzt buchen: {{bookingLink}}

{{salonName}}`
  },

  // ==================== MEMBERSHIP ====================
  membership_welcome: {
    name: 'Membership Willkommen',
    text: `Hey {{customerName}}! ðŸŽ‰

Willkommen bei "{{membershipName}}"!

Deine Benefits:
{{benefits}}

NÃ¤chste Abrechnung: {{nextBillingDate}}

Jetzt buchen: {{bookingLink}}

{{salonName}}`
  },

  membership_billing_reminder: {
    name: 'Membership Abrechnung',
    text: `Hey {{customerName}}! ðŸ’³

Deine "{{membershipName}}"-Abrechnung steht an:

ðŸ“… {{nextBillingDate}}
ðŸ’° {{priceMonthly}}â‚¬

Zahlungsmethode: {{paymentMethod}}

{{salonName}}`
  },

  membership_credits_reset: {
    name: 'Membership Credits erneuert',
    text: `Hey {{customerName}}! ðŸ”„

Deine monatlichen Credits wurden erneuert!

âœ… {{creditsMonthly}} Credits verfÃ¼gbar
ðŸ“… GÃ¼ltig bis {{nextReset}}

Jetzt buchen: {{bookingLink}}

{{salonName}}`
  },

  membership_paused: {
    name: 'Membership pausiert',
    text: `Hey {{customerName}}! â¸ï¸

Deine "{{membershipName}}" wurde pausiert.

Keine Abrechnung wÃ¤hrend der Pause.

Fortsetzen: {{resumeLink}}

{{salonName}}`
  },

  // ==================== WAITLIST ====================
  waitlist_spot_available: {
    name: 'Warteliste - Termin verfÃ¼gbar',
    text: `Hey {{customerName}}! ðŸŽ‰

Ein Termin ist frei geworden!

ðŸ“… {{date}} um {{time}}
â±ï¸ {{duration}} Min
ðŸ“ {{salonName}}

Schnell buchen: {{bookingLink}}

Angebot gilt 2h!

{{salonName}}`
  },

  // ==================== NO-SHOW PREVENTION ====================
  booking_confirmation_required: {
    name: 'BestÃ¤tigung erforderlich',
    text: `Hey {{customerName}}! â°

Bitte bestÃ¤tige deinen Termin:
ðŸ“… {{date}} um {{time}}

BestÃ¤tigen: {{confirmLink}}
Absagen: {{cancelLink}}

Ohne BestÃ¤tigung wird der Termin storniert.

{{salonName}}`
  },

  no_show_warning: {
    name: 'No-Show Warnung',
    text: `Hey {{customerName}}! âš ï¸

Du hast deinen letzten Termin verpasst.

Bei 3 No-Shows mÃ¼ssen wir leider:
- Vorauszahlung verlangen
- Terminbuchung einschrÃ¤nken

VerstÃ¤ndnis? ðŸ™

{{salonName}}`
  }
};

/**
 * Get template by key
 */
export function getTemplate(key) {
  return SMS_TEMPLATES[key] || null;
}

/**
 * Get all templates
 */
export function getAllTemplates() {
  return Object.keys(SMS_TEMPLATES).map(key => ({
    key,
    name: SMS_TEMPLATES[key].name,
    preview: SMS_TEMPLATES[key].text.substring(0, 100) + '...'
  }));
}

/**
 * Render template with variables
 * 
 * @param {string} templateKey - Template key (e.g., 'tattoo_session_reminder')
 * @param {object} variables - Variables to replace (e.g., { customerName: 'Max' })
 * @returns {string} Rendered message
 */
export function renderTemplate(templateKey, variables = {}) {
  const template = getTemplate(templateKey);
  
  if (!template) {
    throw new Error(`Template "${templateKey}" not found`);
  }

  let message = template.text;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, value || '');
  });

  return message.trim();
}

/**
 * Get industry-specific templates
 */
export function getTemplatesByIndustry(industry) {
  const industryTemplates = {
    tattoo: [
      'tattoo_session_reminder',
      'tattoo_aftercare_reminder',
      'tattoo_followup_appointment'
    ],
    medical_aesthetics: [
      'treatment_follow_up',
      'treatment_aftercare',
      'treatment_confirmation'
    ],
    spa_wellness: [
      'package_reminder',
      'package_expiring_soon',
      'package_purchase_confirmation',
      'membership_welcome',
      'membership_billing_reminder',
      'membership_credits_reset'
    ]
  };

  const keys = industryTemplates[industry] || [];
  
  return keys.map(key => ({
    key,
    ...SMS_TEMPLATES[key]
  }));
}

export default SMS_TEMPLATES;
