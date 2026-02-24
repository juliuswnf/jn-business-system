import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  Sparkles,
  Heart,
  Droplet,
  Zap,
  Palette,
  Briefcase,
  PawPrint,
  Check
} from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'salon',
    name: 'Friseursalon',
    icon: Scissors,
    description: 'Haarschnitte/Styling',
    color: 'pink-500'
  },
  {
    id: 'tattoo',
    name: 'Tattoo-Studio',
    icon: Sparkles,
    description: 'Tattoo-Services',
    color: 'purple-500'
  },
  {
    id: 'medical',
    name: 'Medical Spa',
    icon: Heart,
    description: 'Botox/Fillers',
    color: 'red-500'
  },
  {
    id: 'wellness',
    name: 'Wellness-Spa',
    icon: Droplet,
    description: 'Massagen',
    color: 'cyan-500'
  },
  {
    id: 'barbershop',
    name: 'Barbershop',
    icon: Zap,
    description: 'Herrenhaare',
    color: 'amber-500'
  },
  {
    id: 'beauty',
    name: 'Beauty Studio',
    icon: Palette,
    description: 'Kosmetik',
    color: 'fuchsia-500'
  },
  {
    id: 'nails',
    name: 'Nagelstudio',
    icon: Briefcase,
    description: 'Nagelpflege',
    color: 'lime-500'
  },
  {
    id: 'petgrooming',
    name: 'Pet Grooming',
    icon: PawPrint,
    description: 'Tierpflege',
    color: 'orange-400'
  }
];

const colorMap = {
  'pink-500': 'bg-pink-500',
  'purple-500': 'bg-purple-500',
  'red-500': 'bg-red-500',
  'cyan-500': 'bg-cyan-500',
  'amber-500': 'bg-amber-500',
  'fuchsia-500': 'bg-fuchsia-500',
  'lime-500': 'bg-lime-500',
  'orange-400': 'bg-orange-400'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

export default function BusinessTypeSelector({ onSelect, selectedType, selected }) {
  const [hoveredType, setHoveredType] = useState(null);
  // Accept both 'selected' and 'selectedType' for compatibility
  const activeSelection = selected || selectedType;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welche Branche betreiben Sie?
          </h1>
          <p className="text-lg text-gray-400">
            Wählen Sie Ihren Business-Typ, um Ihr Erlebnis anzupassen
          </p>
        </motion.div>

        {/* Business Type Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {BUSINESS_TYPES.map((type, index) => {
            const Icon = type.icon;
            const isSelected = activeSelection === type.id;
            const bgColor = colorMap[type.color];

            return (
              <motion.button
                key={type.id}
                variants={itemVariants}
                onClick={() => onSelect(type.id)}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
                className="relative group"
              >
                {/* Background gradient on hover */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedBackground"
                    className={`absolute inset-0 rounded-xl ${bgColor} opacity-10 blur-xl`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Card */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative h-full rounded-xl p-6 backdrop-blur-sm transition-all duration-300
                    ${isSelected
                      ? `border-2 border-${type.color} bg-slate-800/50`
                      : 'border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'
                    }
                  `}
                >
                  {/* Icon Container */}
                  <motion.div
                    className={`
                      w-16 h-16 rounded-lg flex items-center justify-center mb-4 mx-auto
                      transition-all duration-300
                      ${isSelected
                        ? `${bgColor} text-white shadow-lg shadow-${type.color}/50`
                        : `bg-slate-700/50 text-gray-300 group-hover:bg-slate-600/50`
                      }
                    `}
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon size={28} />
                  </motion.div>

                  {/* Content */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {type.description}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, ease: 'backOut' }}
                      className={`
                        absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                        ${bgColor} text-white shadow-lg
                      `}
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Selection Summary */}
        {activeSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400">
              Sie haben folgendes ausgewählt:{' '}
              <span className="font-semibold text-white">
                {BUSINESS_TYPES.find(t => t.id === activeSelection)?.name}
              </span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
