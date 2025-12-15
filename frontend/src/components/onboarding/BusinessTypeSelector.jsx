import { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Flower2, 
  Syringe, 
  Dumbbell, 
  Heart, 
  CircleDot,
  PaintBrush,
  Hand,
  Waves,
  Activity,
  Layers,
  Building
} from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'hair-salon',
    name: 'Hair Salon',
    icon: Scissors,
    color: 'from-purple-500 to-pink-500',
    features: ['Online Booking', 'Staff Management', 'Payment Processing', 'Customer Reviews'],
    terminology: { service: 'Service', staff: 'Stylist', appointment: 'Appointment' }
  },
  {
    id: 'beauty-salon',
    name: 'Beauty Salon',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    features: ['Multi-Service Bookings', 'Product Sales', 'Loyalty Programs', 'Gift Cards'],
    terminology: { service: 'Treatment', staff: 'Beautician', appointment: 'Appointment' }
  },
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    icon: Flower2,
    color: 'from-green-500 to-teal-500',
    features: ['Room Management', 'Package Deals', 'Membership Plans', 'Retail Integration'],
    terminology: { service: 'Treatment', staff: 'Therapist', appointment: 'Session' }
  },
  {
    id: 'tattoo-piercing',
    name: 'Tattoo & Piercing',
    icon: PaintBrush,
    color: 'from-slate-600 to-slate-800',
    features: ['Portfolio Showcase', 'Custom Design Requests', 'Consent Forms', 'Aftercare Instructions'],
    terminology: { service: 'Tattoo/Piercing', staff: 'Artist', appointment: 'Session' }
  },
  {
    id: 'medical-aesthetics',
    name: 'Medical Aesthetics',
    icon: Syringe,
    color: 'from-blue-500 to-indigo-500',
    features: ['HIPAA Compliance', 'Clinical Notes', 'Medical History', 'Encrypted Records', 'Consent Management'],
    terminology: { service: 'Treatment', staff: 'Practitioner', appointment: 'Consultation' }
  },
  {
    id: 'personal-training',
    name: 'Personal Training',
    icon: Dumbbell,
    color: 'from-orange-500 to-red-500',
    features: ['Progress Tracking', 'Session Packages', 'Performance Metrics', 'Photo Documentation', 'Video Sessions'],
    terminology: { service: 'Session', staff: 'Trainer', appointment: 'Training' }
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    icon: Heart,
    color: 'from-red-500 to-pink-500',
    features: ['HIPAA Compliance', 'Treatment Plans', 'Progress Tracking', 'Clinical Notes', 'Insurance Integration'],
    terminology: { service: 'Treatment', staff: 'Physiotherapist', appointment: 'Session' }
  },
  {
    id: 'barbershop',
    name: 'Barbershop',
    icon: Scissors,
    color: 'from-gray-700 to-gray-900',
    features: ['Walk-in Queue', 'Membership Plans', 'Product Sales', 'Loyalty Rewards'],
    terminology: { service: 'Service', staff: 'Barber', appointment: 'Appointment' }
  },
  {
    id: 'nail-salon',
    name: 'Nail Salon',
    icon: Hand,
    color: 'from-fuchsia-500 to-pink-500',
    features: ['Multi-Service Combos', 'Design Gallery', 'Product Retail', 'Membership Discounts'],
    terminology: { service: 'Service', staff: 'Nail Technician', appointment: 'Appointment' }
  },
  {
    id: 'massage-therapy',
    name: 'Massage Therapy',
    icon: Waves,
    color: 'from-teal-500 to-cyan-500',
    features: ['Room Scheduling', 'Package Deals', 'Membership Plans', 'Aromatherapy Options'],
    terminology: { service: 'Massage', staff: 'Therapist', appointment: 'Session' }
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    icon: Activity,
    color: 'from-purple-500 to-indigo-500',
    features: ['Class Scheduling', 'Multi-Session Packages', 'Membership Management', 'Video Classes'],
    terminology: { service: 'Class', staff: 'Instructor', appointment: 'Class' }
  },
  {
    id: 'pilates-studio',
    name: 'Pilates Studio',
    icon: Layers,
    color: 'from-indigo-500 to-blue-500',
    features: ['Equipment Booking', 'Class Packages', 'Progress Tracking', 'Private Sessions'],
    terminology: { service: 'Class', staff: 'Instructor', appointment: 'Session' }
  },
  {
    id: 'other',
    name: 'Other Service Business',
    icon: Building,
    color: 'from-gray-500 to-gray-700',
    features: ['Flexible Configuration', 'Custom Terminology', 'All Core Features'],
    terminology: { service: 'Service', staff: 'Staff', appointment: 'Appointment' }
  }
];

export default function BusinessTypeSelector({ onSelect, selectedType }) {
  const [hoveredType, setHoveredType] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          What type of business do you run?
        </h1>
        <p className="text-xl text-gray-600">
          Choose your business type to customize your experience
        </p>
      </div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isHovered = hoveredType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                hover:scale-105 hover:shadow-2xl
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-xl' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Gradient Background */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${type.color} 
                opacity-0 hover:opacity-10 rounded-2xl transition-opacity duration-300
              `} />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${type.color} shadow-lg
                  ${isHovered ? 'scale-110' : 'scale-100'}
                  transition-transform duration-300
                `}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {type.name}
                </h3>

                {/* Features */}
                <ul className="space-y-2 text-sm text-gray-600 text-left">
                  {type.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CircleDot className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature Preview (if type selected) */}
      {selectedType && (
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ✨ Your Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUSINESS_TYPES.find(t => t.id === selectedType)?.features.map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
