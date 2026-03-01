import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * WizardStep Component
 *
 * Displays a single wizard question with different input types
 */
const WizardStep = ({
  questionNumber,
  questionText,
  subtitle,
  icon,
  options,
  selectedValue,
  onSelect,
  type = 'single',
  minSelections = 1
}) => {
  const handleSingleSelect = (value) => {
    onSelect(value);
  };

  const handleMultipleSelect = (value) => {
    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];

    if (currentValues.includes(value)) {
      // Remove if already selected
      onSelect(currentValues.filter(v => v !== value));
    } else {
      // Add to selection
      onSelect([...currentValues, value]);
    }
  };

  const isSelected = (value) => {
    if (type === 'multiple') {
      return Array.isArray(selectedValue) && selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Question Header */}
      <div className="text-center mb-8">
        {icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="text-6xl mb-4"
          >
            {icon}
          </motion.div>
        )}

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {questionText}
        </h2>

        {subtitle && (
          <p className="text-gray-600 text-lg">
            {subtitle}
          </p>
        )}

        {type === 'multiple' && minSelections > 0 && (
          <p className="text-sm text-blue-600 mt-2">
            Mindestens {minSelections} Auswahl erforderlich
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => type === 'multiple'
              ? handleMultipleSelect(option.value)
              : handleSingleSelect(option.value)
            }
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all
              ${isSelected(option.value)
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-start">
              {/* Checkbox/Radio Icon */}
              <div className="flex-shrink-0 mr-4">
                {type === 'multiple' ? (
                  <div className={`
                    w-6 h-6 rounded border-2 flex items-center justify-center
                    ${isSelected(option.value)
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected(option.value) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${isSelected(option.value)
                      ? 'border-blue-600'
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected(option.value) && (
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                    )}
                  </div>
                )}
              </div>

              {/* Option Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {option.icon && <span className="text-xl">{option.icon}</span>}
                  <span className="font-semibold text-gray-900">{option.label}</span>
                </div>

                {option.subtitle && (
                  <p className="text-sm text-gray-600 mb-1">{option.subtitle}</p>
                )}

                {option.description && (
                  <p className="text-xs text-zinc-400">{option.description}</p>
                )}

                {option.tier && (
                  <span className={`
                    inline-block mt-2 px-2 py-1 text-xs rounded-full
                    ${option.tier === 'enterprise'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                    }
                  `}>
                    {option.tier === 'enterprise' ? 'Enterprise' : 'Professional'}
                  </span>
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected(option.value) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 ml-2"
                >
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selection Counter for Multiple Choice */}
      {type === 'multiple' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {Array.isArray(selectedValue) ? selectedValue.length : 0} von {options.length} ausgewählt
          </p>
        </div>
      )}
    </motion.div>
  );
};

WizardStep.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  questionText: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    tier: PropTypes.string
  })).isRequired,
  selectedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  onSelect: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['single', 'multiple']),
  minSelections: PropTypes.number
};

export default WizardStep;
