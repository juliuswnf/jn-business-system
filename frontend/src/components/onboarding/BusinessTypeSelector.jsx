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
          Welche Branche betreiben Sie?
        </h1>
        <p className="text-xl text-gray-500">
          Wählen Sie Ihre Branche, um Ihr Erlebnis anzupassen
        </p>
      </div>

      {/* Business Type Container - Like Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-semibold text-gray-900">Ihre Branche wählen</span>
          </div>
        </div>

        <div className="p-6">
          {/* Business Type Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUSINESS_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`
                    bg-white border rounded-xl p-4 transition cursor-pointer text-left
                    ${isSelected 
                      ? 'border-gray-300 hover:border-gray-300' 
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? 'bg-gray-900/10 border border-gray-300'
                        : 'bg-gray-50 border border-gray-200'
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-gray-900' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {type.features.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feature Preview (if type selected) */}
          {selectedType && (
            <div className="mt-6 bg-white border border-gray-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Features für {BUSINESS_TYPES.find(t => t.id === selectedType)?.name}
                </h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {BUSINESS_TYPES.find(t => t.id === selectedType)?.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
