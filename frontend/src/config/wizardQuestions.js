/**
 * Pricing Wizard Questions Configuration
 *
 * Centralized question definitions for A/B testing and maintenance
 */

export const wizardQuestions = [
  {
    id: 1,
    key: 'customerCount',
    title: 'Wie viele Kunden hast du aktuell?',
    subtitle: 'Hilft uns, die richtige Größe für dein Business zu finden',
    type: 'single',
    icon: 'ðŸ‘¥',
    required: true,
    options: [
      {
        value: '0-50',
        label: '0-50 Kunden',
        subtitle: 'Gerade gestartet',
        description: 'Perfekt für neue Businesses'
      },
      {
        value: '51-200',
        label: '51-200 Kunden',
        subtitle: 'Etabliertes Business',
        description: 'Stabile Kundenbasis aufgebaut'
      },
      {
        value: '201-500',
        label: '201-500 Kunden',
        subtitle: 'Gut laufend',
        description: 'Wachsendes, erfolgreiches Business'
      },
      {
        value: '500+',
        label: '500+ Kunden',
        subtitle: 'Großes Business',
        description: 'Enterprise-Level Operation'
      }
    ]
  },
  {
    id: 2,
    key: 'bookingsPerWeek',
    title: 'Wie viele Termine hast du pro Woche?',
    subtitle: 'Zeigt uns, wie viel Automatisierung du brauchst',
    type: 'single',
    icon: 'ðŸ“…',
    required: true,
    options: [
      {
        value: '0-20',
        label: '0-20 Termine/Woche',
        subtitle: 'Entspanntes Tempo',
        description: 'Etwa 3-4 Termine pro Tag'
      },
      {
        value: '21-50',
        label: '21-50 Termine/Woche',
        subtitle: 'Moderate Auslastung',
        description: 'Etwa 5-10 Termine pro Tag'
      },
      {
        value: '51-100',
        label: '51-100 Termine/Woche',
        subtitle: 'Hohe Auslastung',
        description: 'Etwa 10-20 Termine pro Tag'
      },
      {
        value: '100+',
        label: '100+ Termine/Woche',
        subtitle: 'Sehr hohes Volumen',
        description: '20+ Termine täglich - Multi-Team'
      }
    ]
  },
  {
    id: 3,
    key: 'locations',
    title: 'Wie viele Standorte hast du?',
    subtitle: 'Multi-Location Features ab Professional',
    type: 'single',
    icon: 'ðŸ“',
    required: true,
    options: [
      {
        value: 1,
        label: '1 Standort',
        subtitle: 'Ein Ort, volle Konzentration',
        description: 'Single-Location Business'
      },
      {
        value: 2,
        label: '2-3 Standorte',
        subtitle: 'Expandierend',
        description: 'Multi-Location Management nötig'
      },
      {
        value: 4,
        label: '4+ Standorte',
        subtitle: 'Multi-Location Business',
        description: 'Enterprise-Level Verwaltung'
      }
    ]
  },
  {
    id: 4,
    key: 'features',
    title: 'Welche Features brauchst du?',
    subtitle: 'Wähle alles, was für dich wichtig ist (mehrere möglich)',
    type: 'multiple',
    icon: 'âœ¨',
    required: true,
    minSelections: 1,
    options: [
      {
        value: 'sms_reminders',
        label: 'SMS-Erinnerungen',
        subtitle: 'Reduziere No-Shows um 70%',
        icon: 'ðŸ“±',
        tier: 'professional',
        description: 'Automatische SMS 24h und 2h vor Termin'
      },
      {
        value: 'marketing',
        label: 'Marketing-Kampagnen',
        subtitle: 'Email & SMS Automation',
        icon: 'ðŸ“§',
        tier: 'professional',
        description: 'Gezielte Kampagnen für mehr Umsatz'
      },
      {
        value: 'multi_session',
        label: 'Multi-Session-Projekte',
        subtitle: 'Für Tattoo, Medical',
        icon: 'ðŸŽ¨',
        tier: 'professional',
        description: 'Projekte über mehrere Termine hinweg'
      },
      {
        value: 'memberships',
        label: 'Packages & Memberships',
        subtitle: 'Recurring Revenue',
        icon: 'ðŸ’Ž',
        tier: 'professional',
        description: 'Monatliche Mitgliedschaften verwalten'
      },
      {
        value: 'waitlist',
        label: 'Waitlist-Management',
        subtitle: 'Fülle freie Slots automatisch',
        icon: 'â°',
        tier: 'professional',
        description: 'Wartelisten-Automation bei Absagen'
      },
      {
        value: 'analytics',
        label: 'Analytics & Reports',
        subtitle: 'Datenbasierte Entscheidungen',
        icon: 'ðŸ“Š',
        tier: 'professional',
        description: 'Detaillierte Business-Insights'
      },
      {
        value: 'white_label',
        label: 'White-Label Branding',
        subtitle: 'Deine eigene Brand',
        icon: 'ðŸ·ï¸',
        tier: 'enterprise',
        description: 'Komplett gebrandete Lösung'
      }
    ]
  },
  {
    id: 5,
    key: 'employees',
    title: 'Wie viele Mitarbeiter hast du?',
    subtitle: 'Team-Features und User-Limits variieren',
    type: 'single',
    icon: 'ðŸ‘”',
    required: true,
    options: [
      {
        value: 'solo',
        label: 'Nur ich',
        subtitle: 'Solo-Unternehmer',
        description: 'Alles selbst im Griff'
      },
      {
        value: '2-5',
        label: '2-5 Mitarbeiter',
        subtitle: 'Kleines Team',
        description: 'Team-Koordination wichtig'
      },
      {
        value: '6-10',
        label: '6-10 Mitarbeiter',
        subtitle: 'Mittleres Team',
        description: 'Erweiterte Rechteverwaltung nötig'
      },
      {
        value: '10+',
        label: '10+ Mitarbeiter',
        subtitle: 'Großes Team',
        description: 'Enterprise-Team-Management'
      }
    ]
  },
  {
    id: 6,
    key: 'budget',
    title: 'Was ist dein monatliches Budget für Software?',
    subtitle: 'Ehrlich sein hilft uns, das beste Preis-Leistungs-Verhältnis zu finden',
    type: 'single',
    icon: 'ðŸ’°',
    required: true,
    options: [
      {
        value: 'under-100',
        label: 'Unter â‚¬100/Monat',
        subtitle: 'Budget-bewusst',
        description: 'Kosteneffizienz steht im Vordergrund'
      },
      {
        value: '100-200',
        label: 'â‚¬100-200/Monat',
        subtitle: 'Standard-Budget',
        description: 'Gutes Preis-Leistungs-Verhältnis wichtig'
      },
      {
        value: '200-500',
        label: '€200-500/Monat',
        subtitle: 'Großzügiges Budget',
        description: 'Bereit für Premium-Features'
      },
      {
        value: '500+',
        label: '€500+/Monat',
        subtitle: 'Premium-Budget',
        description: 'Beste Lösung ohne Kompromisse'
      }
    ]
  }
];

/**
 * Get question by key
 */
export function getQuestionByKey(key) {
  return wizardQuestions.find(q => q.key === key);
}

/**
 * Get question by ID
 */
export function getQuestionById(id) {
  return wizardQuestions.find(q => q.id === id);
}

/**
 * Validate answers against questions
 */
export function validateAnswers(answers) {
  const errors = [];

  wizardQuestions.forEach(question => {
    if (question.required && !answers[question.key]) {
      errors.push(`${question.title} ist erforderlich`);
    }

    if (question.type === 'multiple' && question.minSelections) {
      const selected = answers[question.key] || [];
      if (selected.length < question.minSelections) {
        errors.push(`${question.title}: Mindestens ${question.minSelections} Auswahl erforderlich`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all feature options (for filtering/searching)
 */
export function getAllFeatures() {
  const featuresQuestion = wizardQuestions.find(q => q.key === 'features');
  return featuresQuestion?.options || [];
}

/**
 * Get industry-specific question set (for future A/B testing)
 */
export function getIndustryQuestions(industry) {
  // For now, return same questions
  // In future, could customize based on industry
  return wizardQuestions;
}

export default wizardQuestions;
