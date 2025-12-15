/**
 * Industry Terminology Frontend Helper
 * Provides UI-friendly labels and feature flags
 */

export const BUSINESS_TYPES = [
  { 
    value: 'hair-salon', 
    label: 'Hair Salon',
    icon: '💇‍♀️',
    description: 'Hair cutting, coloring, and styling services'
  },
  { 
    value: 'beauty-salon', 
    label: 'Beauty Salon',
    icon: '💄',
    description: 'Makeup, facials, and beauty treatments'
  },
  { 
    value: 'spa-wellness', 
    label: 'Spa & Wellness',
    icon: '🧘‍♀️',
    description: 'Spa treatments, massages, and wellness services'
  },
  { 
    value: 'tattoo-piercing', 
    label: 'Tattoo & Piercing Studio',
    icon: '🎨',
    description: 'Custom tattoos, piercings, and body art'
  },
  { 
    value: 'medical-aesthetics', 
    label: 'Medical Aesthetics',
    icon: '💉',
    description: 'Botox, fillers, laser treatments (medical grade)'
  },
  { 
    value: 'personal-training', 
    label: 'Personal Training',
    icon: '🏋️‍♂️',
    description: 'One-on-one fitness training and coaching'
  },
  { 
    value: 'physiotherapy', 
    label: 'Physiotherapy',
    icon: '🩺',
    description: 'Physical therapy and rehabilitation services'
  },
  { 
    value: 'barbershop', 
    label: 'Barbershop',
    icon: '✂️',
    description: 'Traditional barbering and grooming'
  },
  { 
    value: 'nail-salon', 
    label: 'Nail Salon',
    icon: '💅',
    description: 'Manicures, pedicures, and nail art'
  },
  { 
    value: 'massage-therapy', 
    label: 'Massage Therapy',
    icon: '🙌',
    description: 'Therapeutic and relaxation massage'
  },
  { 
    value: 'yoga-studio', 
    label: 'Yoga Studio',
    icon: '🧘',
    description: 'Yoga classes and wellness workshops'
  },
  { 
    value: 'pilates-studio', 
    label: 'Pilates Studio',
    icon: '🤸‍♀️',
    description: 'Pilates classes and reformer training'
  },
  { 
    value: 'other', 
    label: 'Other',
    icon: '🏢',
    description: 'Other appointment-based business'
  }
];

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
 * @param {string} businessType - The business type key
 * @returns {object} Terminology object
 */
export function getTerminology(businessType) {
  return TERMINOLOGY[businessType] || TERMINOLOGY['other'];
}

/**
 * Get enabled features for a business type
 * @param {string} businessType - The business type key
 * @returns {object} Feature flags
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
 * @param {string} businessType - The business type key
 * @returns {boolean}
 */
export function requiresHIPAA(businessType) {
  return ['medical-aesthetics', 'physiotherapy'].includes(businessType);
}

/**
 * Get business type info by value
 * @param {string} value - The business type value
 * @returns {object|null} Business type object or null
 */
export function getBusinessTypeInfo(value) {
  return BUSINESS_TYPES.find(bt => bt.value === value) || null;
}

export default {
  BUSINESS_TYPES,
  TERMINOLOGY,
  getTerminology,
  getEnabledFeatures,
  requiresHIPAA,
  getBusinessTypeInfo
};
