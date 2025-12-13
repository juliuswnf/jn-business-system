/**
 * Industry Terminology Helper
 * Returns industry-specific terminology for UI/UX
 */

export const BUSINESS_TYPES = {
  HAIR_SALON: 'hair-salon',
  BEAUTY_SALON: 'beauty-salon',
  SPA_WELLNESS: 'spa-wellness',
  TATTOO_PIERCING: 'tattoo-piercing',
  MEDICAL_AESTHETICS: 'medical-aesthetics',
  PERSONAL_TRAINING: 'personal-training',
  PHYSIOTHERAPY: 'physiotherapy',
  BARBERSHOP: 'barbershop',
  NAIL_SALON: 'nail-salon',
  MASSAGE_THERAPY: 'massage-therapy',
  YOGA_STUDIO: 'yoga-studio',
  PILATES_STUDIO: 'pilates-studio',
  OTHER: 'other'
};

export const TERMINOLOGY = {
  'hair-salon': {
    service: 'Service',
    serviceP: 'Services',
    staff: 'Stylist',
    staffP: 'Stylists',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Salon'
  },

  'beauty-salon': {
    service: 'Treatment',
    serviceP: 'Treatments',
    staff: 'Beautician',
    staffP: 'Beauticians',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Salon'
  },

  'spa-wellness': {
    service: 'Treatment',
    serviceP: 'Treatments',
    staff: 'Therapist',
    staffP: 'Therapists',
    appointment: 'Session',
    appointmentP: 'Sessions',
    customer: 'Guest',
    customerP: 'Guests',
    businessName: 'Spa'
  },

  'tattoo-piercing': {
    service: 'Design',
    serviceP: 'Designs',
    staff: 'Artist',
    staffP: 'Artists',
    appointment: 'Session',
    appointmentP: 'Sessions',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Studio'
  },

  'medical-aesthetics': {
    service: 'Treatment',
    serviceP: 'Treatments',
    staff: 'Practitioner',
    staffP: 'Practitioners',
    appointment: 'Consultation',
    appointmentP: 'Consultations',
    customer: 'Patient',
    customerP: 'Patients',
    businessName: 'Clinic'
  },

  'personal-training': {
    service: 'Session',
    serviceP: 'Sessions',
    staff: 'Trainer',
    staffP: 'Trainers',
    appointment: 'Training Session',
    appointmentP: 'Training Sessions',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Studio'
  },

  'physiotherapy': {
    service: 'Treatment',
    serviceP: 'Treatments',
    staff: 'Physiotherapist',
    staffP: 'Physiotherapists',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Patient',
    customerP: 'Patients',
    businessName: 'Clinic'
  },

  'barbershop': {
    service: 'Service',
    serviceP: 'Services',
    staff: 'Barber',
    staffP: 'Barbers',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Barbershop'
  },

  'nail-salon': {
    service: 'Service',
    serviceP: 'Services',
    staff: 'Nail Technician',
    staffP: 'Nail Technicians',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Salon'
  },

  'massage-therapy': {
    service: 'Treatment',
    serviceP: 'Treatments',
    staff: 'Massage Therapist',
    staffP: 'Massage Therapists',
    appointment: 'Session',
    appointmentP: 'Sessions',
    customer: 'Client',
    customerP: 'Clients',
    businessName: 'Studio'
  },

  'yoga-studio': {
    service: 'Class',
    serviceP: 'Classes',
    staff: 'Instructor',
    staffP: 'Instructors',
    appointment: 'Class',
    appointmentP: 'Classes',
    customer: 'Member',
    customerP: 'Members',
    businessName: 'Studio'
  },

  'pilates-studio': {
    service: 'Class',
    serviceP: 'Classes',
    staff: 'Instructor',
    staffP: 'Instructors',
    appointment: 'Session',
    appointmentP: 'Sessions',
    customer: 'Member',
    customerP: 'Members',
    businessName: 'Studio'
  },

  'other': {
    service: 'Service',
    serviceP: 'Services',
    staff: 'Staff',
    staffP: 'Staff',
    appointment: 'Appointment',
    appointmentP: 'Appointments',
    customer: 'Customer',
    customerP: 'Customers',
    businessName: 'Business'
  }
};

/**
 * Get terminology for a business type
 */
export function getTerminology(businessType) {
  return TERMINOLOGY[businessType] || TERMINOLOGY['other'];
}

/**
 * Get industry-specific features enabled
 */
export function getEnabledFeatures(businessType) {
  const features = {
    'hair-salon': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: false,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'beauty-salon': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'spa-wellness': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'tattoo-piercing': {
      multiServiceBooking: false,
      recurringAppointments: false,
      packageDeals: false,
      portfolioManagement: true,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: false,
      customDesigns: true,
      videoSessions: false,
      consentForms: true
    },

    'medical-aesthetics': {
      multiServiceBooking: true,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: true,
      clinicalNotes: true,
      progressTracking: true,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: true,
      consentForms: true
    },

    'personal-training': {
      multiServiceBooking: false,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: true,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: true,
      consentForms: false
    },

    'physiotherapy': {
      multiServiceBooking: true,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: true,
      progressTracking: true,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: true,
      consentForms: true
    },

    'barbershop': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: false,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'nail-salon': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'massage-therapy': {
      multiServiceBooking: true,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: true,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    },

    'yoga-studio': {
      multiServiceBooking: false,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: true,
      consentForms: false
    },

    'pilates-studio': {
      multiServiceBooking: false,
      recurringAppointments: true,
      packageDeals: true,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: true,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: true,
      consentForms: false
    },

    'other': {
      multiServiceBooking: true,
      recurringAppointments: false,
      packageDeals: false,
      portfolioManagement: false,
      clinicalNotes: false,
      progressTracking: false,
      resourceManagement: false,
      customDesigns: false,
      videoSessions: false,
      consentForms: false
    }
  };

  return features[businessType] || features['other'];
}

/**
 * Check if business type requires HIPAA compliance
 */
export function requiresHIPAA(businessType) {
  return ['medical-aesthetics', 'physiotherapy'].includes(businessType);
}

/**
 * Get compliance requirements for business type
 */
export function getComplianceRequirements(businessType) {
  const requirements = {
    'medical-aesthetics': {
      hipaa: true,
      gdprEnhanced: true,
      consentForms: true,
      encryptedStorage: true,
      auditLogs: true,
      baa: true,
      dataPortability: true
    },

    'physiotherapy': {
      hipaa: true,
      gdprEnhanced: true,
      consentForms: true,
      encryptedStorage: true,
      auditLogs: true,
      baa: true,
      dataPortability: true
    },

    'tattoo-piercing': {
      hipaa: false,
      gdprEnhanced: false,
      consentForms: true,
      encryptedStorage: false,
      auditLogs: false,
      baa: false,
      dataPortability: true
    }
  };

  return requirements[businessType] || {
    hipaa: false,
    gdprEnhanced: false,
    consentForms: false,
    encryptedStorage: false,
    auditLogs: false,
    baa: false,
    dataPortability: true
  };
}

export default {
  BUSINESS_TYPES,
  TERMINOLOGY,
  getTerminology,
  getEnabledFeatures,
  requiresHIPAA,
  getComplianceRequirements
};
