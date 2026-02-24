import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Sparkles,
  Heart,
  Droplet,
  Zap,
  Palette,
  Briefcase,
  PawPrint,
  MoreHorizontal,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'hair-salon',
    name: 'Friseursalon',
    icon: Scissors,
    color: 'pink-500'
  },
  {
    id: 'tattoo-piercing',
    name: 'Tattoo-Studio',
    icon: Sparkles,
    color: 'purple-500'
  },
  {
    id: 'medical-aesthetics',
    name: 'Medical Spa',
    icon: Heart,
    color: 'red-500'
  },
  {
    id: 'spa-wellness',
    name: 'Wellness-Spa',
    icon: Droplet,
    color: 'cyan-500'
  },
  {
    id: 'barbershop',
    name: 'Barbershop',
    icon: Zap,
    color: 'amber-500'
  },
  {
    id: 'beauty-salon',
    name: 'Beauty Studio',
    icon: Palette,
    color: 'fuchsia-500'
  },
  {
    id: 'nail-salon',
    name: 'Nagelstudio',
    icon: Briefcase,
    color: 'lime-500'
  },
  {
    id: 'other',
    name: 'Andere Branche',
    icon: MoreHorizontal,
    color: 'gray-500',
    requiresInput: true
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
  'gray-500': 'bg-gray-500'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export default function BusinessTypeModal({ onSelect, onBack }) {
  const [selectedType, setSelectedType] = useState(null);
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [hoveredType, setHoveredType] = useState(null);

  const handleSelect = (type) => {
    setSelectedType(type.id);
    // If not "other", directly proceed
    if (type.id !== 'other') {
      onSelect({ businessType: type.id });
    }
  };

  const handleContinue = () => {
    if (selectedType === 'other') {
      if (customBusinessType.trim()) {
        onSelect({ businessType: 'other', customBusinessType: customBusinessType.trim() });
      }
    } else if (selectedType) {
      onSelect({ businessType: selectedType });
    }
  };

  const selectedTypeData = BUSINESS_TYPES.find(t => t.id === selectedType);
  const canContinue = selectedType && (selectedType !== 'other' || customBusinessType.trim());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 border-b border-slate-800 p-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Wähle deine Branche
            </h1>
            <p className="text-gray-400">
              Damit können wir das System optimal für dich einstellen
            </p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Business Types Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          >
            {BUSINESS_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const bgColor = colorMap[type.color];

              return (
                <motion.button
                  key={type.id}
                  variants={itemVariants}
                  onClick={() => handleSelect(type)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType(null)}
                  className="relative group"
                >
                  {/* Background gradient on hover/select */}
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
                      relative h-full rounded-xl p-5 backdrop-blur-sm transition-all duration-300
                      ${
                        isSelected
                          ? `border-2 border-${type.color} bg-slate-800/60`
                          : 'border border-slate-700 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-600'
                      }
                    `}
                  >
                    {/* Icon Container */}
                    <motion.div
                      className={`
                        w-14 h-14 rounded-lg flex items-center justify-center mb-3 mx-auto
                        transition-all duration-300
                        ${
                          isSelected
                            ? `${bgColor} text-white shadow-lg shadow-${type.color}/50`
                            : `bg-slate-700/50 text-gray-300 group-hover:bg-slate-600/50`
                        }
                      `}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon size={24} />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-base font-semibold text-white">
                        {type.name}
                      </h3>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.4, ease: 'backOut' }}
                        className={`
                          absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
                          ${bgColor} text-white shadow-lg
                        `}
                      >
                        <Check size={14} strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Custom Business Type Input */}
          <AnimatePresence>
            {selectedType === 'other' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8 p-6 bg-slate-800/30 border border-slate-700 rounded-xl"
              >
                <label className="block text-sm font-semibold text-white mb-3">
                  Wie heißt deine Branche?
                </label>
                <input
                  type="text"
                  value={customBusinessType}
                  onChange={(e) => setCustomBusinessType(e.target.value)}
                  placeholder="z.B. Fitnessstudio, Fotografie, Consulting..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection Summary */}
          <AnimatePresence>
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-8 p-4 bg-slate-800/40 border border-slate-700 rounded-lg text-center"
              >
                <p className="text-gray-400 text-sm">
                  Ausgewählt:{' '}
                  <span className="font-semibold text-white">
                    {selectedType === 'other' && customBusinessType
                      ? customBusinessType
                      : selectedTypeData?.name}
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Buttons */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-950 to-slate-950/95 border-t border-slate-800 p-8 flex justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="px-6 py-3 rounded-lg border border-slate-600 text-white font-medium hover:bg-slate-800/50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Zurück</span>
          </motion.button>

          <motion.button
            whileHover={canContinue ? { scale: 1.02 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
            onClick={handleContinue}
            disabled={!canContinue}
            className={`
              px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all
              ${
                canContinue
                  ? 'bg-white text-slate-900 hover:bg-gray-100 cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span>Weiter</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
