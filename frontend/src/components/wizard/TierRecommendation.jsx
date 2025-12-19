import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import confetti from 'canvas-confetti';

/**
 * TierRecommendation Component
 *
 * Displays tier recommendation with reasoning and alternatives
 */
const TierRecommendation = ({ recommendation, onSelectTier, loading }) => {
  const [selectedTier, setSelectedTier] = useState(recommendation.recommendedTier);

  React.useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    onSelectTier(tier);
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'starter': return '🥉';
      case 'professional': return '🥈';
      case 'enterprise': return '🥇';
      default: return '💎';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'starter': return 'border-gray-300 bg-gray-50';
      case 'professional': return 'border-blue-500 bg-blue-50';
      case 'enterprise': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-7xl mb-4"
        >
          🎉
        </motion.div>

        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Deine perfekte Empfehlung!
        </h2>

        <p className="text-gray-600 text-lg">
          Basierend auf deinen Angaben haben wir das optimale Paket für dich gefunden
        </p>
      </div>

      {/* Main Recommendation Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`
          relative p-8 rounded-2xl border-4 shadow-2xl mb-8
          ${getTierColor(recommendation.recommendedTier)}
        `}
      >
        {/* Confidence Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {recommendation.confidence}% Match
          </span>
        </div>

        {/* Tier Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">
            {getTierIcon(recommendation.recommendedTier)}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2 uppercase">
            {recommendation.tierDetails.name}
          </h3>
          <p className="text-xl text-gray-700">
            {recommendation.tierDetails.tagline}
          </p>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-gray-900 mb-1">
            {formatPrice(recommendation.tierPrice)}
            <span className="text-2xl text-gray-600">/Monat</span>
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 text-center">
            Warum {recommendation.tierDetails.name}?
          </h4>
          <div className="space-y-2">
            {recommendation.reasoning.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start bg-white bg-opacity-50 rounded-lg p-3"
              >
                <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-800">{reason}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ROI Highlight */}
        {recommendation.estimatedMonthlySavings > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Geschätzte Ersparnis pro Monat</p>
                <p className="text-2xl font-bold text-green-700">
                  ~{formatPrice(recommendation.estimatedMonthlySavings)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">ROI</p>
                <p className="text-2xl font-bold text-blue-700">
                  {recommendation.estimatedROI}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Durch Zeitersparnis, No-Show-Prevention und Marketing-Automation
            </p>
          </div>
        )}

        {/* Main CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectTier(recommendation.recommendedTier)}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird geladen...' : `${recommendation.tierDetails.name.toUpperCase()} WÄHLEN`}
        </motion.button>
      </motion.div>

      {/* Alternative Options */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Andere Optionen
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(recommendation.allTiers).map(([tier, details], index) => {
            const isRecommended = tier === recommendation.recommendedTier;
            const alternative = recommendation.alternatives[tier];

            if (isRecommended) {
              return (
                <motion.div
                  key={tier}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative p-6 rounded-xl border-2 border-green-500 bg-green-50"
                >
                  <div className="absolute top-2 right-2">
                    <span className="text-xs font-semibold bg-green-600 text-white px-2 py-1 rounded">
                      EMPFOHLEN
                    </span>
                  </div>
                  <div className="text-4xl mb-2">{getTierIcon(tier)}</div>
                  <h5 className="text-lg font-bold text-gray-900 mb-1">{details.name}</h5>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatPrice(details.price)}
                    <span className="text-sm text-gray-600">/Mo</span>
                  </p>
                  <div className="flex items-center mb-2">
                    <div className="flex-1 bg-green-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-sm font-semibold text-green-700">100%</span>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={tier}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="relative p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-colors"
              >
                <div className="text-4xl mb-2">{getTierIcon(tier)}</div>
                <h5 className="text-lg font-bold text-gray-900 mb-1">{details.name}</h5>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {formatPrice(details.price)}
                  <span className="text-sm text-gray-600">/Mo</span>
                </p>

                {alternative && (
                  <>
                    <div className="flex items-center mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${alternative.match}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {alternative.match}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {alternative.reason}
                    </p>
                  </>
                )}

                <button
                  onClick={() => handleSelectTier(tier)}
                  disabled={loading}
                  className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Wählen
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center">
        <a
          href="/pricing"
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          Alle Features im Detail vergleichen →
        </a>
      </div>
    </motion.div>
  );
};

TierRecommendation.propTypes = {
  recommendation: PropTypes.shape({
    recommendedTier: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    confidence: PropTypes.number.isRequired,
    reasoning: PropTypes.arrayOf(PropTypes.string).isRequired,
    alternatives: PropTypes.object.isRequired,
    tierPrice: PropTypes.number.isRequired,
    estimatedMonthlySavings: PropTypes.number,
    estimatedROI: PropTypes.string,
    tierDetails: PropTypes.object.isRequired,
    allTiers: PropTypes.object.isRequired
  }).isRequired,
  onSelectTier: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default TierRecommendation;
