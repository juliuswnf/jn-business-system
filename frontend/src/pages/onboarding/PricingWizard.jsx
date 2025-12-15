import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import WizardStep from '../../components/wizard/WizardStep';
import TierRecommendation from '../../components/wizard/TierRecommendation';
import wizardQuestions from '../../config/wizardQuestions';

/**
 * PricingWizard Page
 * 
 * Guided wizard to recommend optimal pricing tier
 */
const PricingWizard = () => {
  const navigate = useNavigate();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    customerCount: null,
    bookingsPerWeek: null,
    locations: null,
    features: [],
    employees: null,
    budget: null
  });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [sessionId] = useState(() => `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Track start time
    setStartTime(Date.now());
  }, []);

  const totalSteps = wizardQuestions.length;
  const progress = (currentStep / totalSteps) * 100;

  // Get current question
  const currentQuestion = wizardQuestions.find(q => q.id === currentStep);

  // Handle answer selection
  const handleAnswerSelect = (value) => {
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }));
  };

  // Navigate to next step
  const handleNext = async () => {
    if (!currentQuestion) return;

    // Validate current answer
    const currentAnswer = answers[currentQuestion.key];
    
    if (currentQuestion.required) {
      if (currentQuestion.type === 'multiple') {
        if (!currentAnswer || currentAnswer.length === 0) {
          toast.error('Bitte wÃ¤hle mindestens eine Option');
          return;
        }
      } else {
        if (!currentAnswer && currentAnswer !== 0) {
          toast.error('Bitte wÃ¤hle eine Option');
          return;
        }
      }
    }

    // If last step, get recommendation
    if (currentStep === totalSteps) {
      await getRecommendation();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Get tier recommendation from API
  const getRecommendation = async () => {
    setLoading(true);

    try {
      const timeToComplete = startTime ? Math.round((Date.now() - startTime) / 1000) : null;

      const response = await fetch('/api/pricing-wizard/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          sessionId,
          timeToComplete
        })
      });

      const data = await response.json();

      if (data.success) {
        setRecommendation(data.data);
        setCurrentStep(totalSteps + 1); // Move to recommendation view
      } else {
        throw new Error(data.message || 'Failed to get recommendation');
      }
    } catch (error) {
      console.error('Error getting recommendation:', error);
      toast.error('Fehler beim Laden der Empfehlung. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tier selection
  const handleSelectTier = async (tier) => {
    setLoading(true);

    try {
      // Save selection to backend
      await fetch('/api/pricing-wizard/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          selectedTier: tier,
          converted: true
        })
      });

      // Navigate to pricing page with selected tier
      navigate(`/pricing?tier=${tier}&from=wizard`);
    } catch (error) {
      console.error('Error saving selection:', error);
      // Still navigate even if save fails
      navigate(`/pricing?tier=${tier}&from=wizard`);
    } finally {
      setLoading(false);
    }
  };

  // Handle skip wizard
  const handleSkip = () => {
    if (window.confirm('MÃ¶chtest du den Wizard wirklich Ã¼berspringen?')) {
      navigate('/pricing');
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    if (!currentQuestion) return false;
    
    const currentAnswer = answers[currentQuestion.key];
    
    if (currentQuestion.type === 'multiple') {
      return currentAnswer && currentAnswer.length > 0;
    }
    
    return currentAnswer !== null && currentAnswer !== undefined;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">JN Business System</span>
            </div>

            {/* Skip Button */}
            {currentStep <= totalSteps && (
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Ãœberspringen â†’
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {currentStep <= totalSteps && (
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Frage {currentStep} von {totalSteps}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {currentStep <= totalSteps ? (
            // Wizard Steps
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WizardStep
                questionNumber={currentStep}
                questionText={currentQuestion.title}
                subtitle={currentQuestion.subtitle}
                icon={currentQuestion.icon}
                options={currentQuestion.options}
                selectedValue={answers[currentQuestion.key]}
                onSelect={handleAnswerSelect}
                type={currentQuestion.type}
                minSelections={currentQuestion.minSelections}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between max-w-3xl mx-auto mt-8">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  ZurÃ¼ck
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      LÃ¤dt...
                    </>
                  ) : currentStep === totalSteps ? (
                    <>
                      Empfehlung erhalten
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Weiter
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : recommendation ? (
            // Recommendation View
            <motion.div
              key="recommendation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <TierRecommendation
                recommendation={recommendation}
                onSelectTier={handleSelectTier}
                loading={loading}
              />

              {/* Back to Start */}
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setRecommendation(null);
                    setAnswers({
                      customerCount: null,
                      bookingsPerWeek: null,
                      locations: null,
                      features: [],
                      employees: null,
                      budget: null
                    });
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  â† Nochmal von vorne starten
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Â© 2024 JN Business System. Alle Rechte vorbehalten.</p>
            <div className="flex items-center space-x-4">
              <a href="/pricing" className="hover:text-blue-600">
                Alle Preise
              </a>
              <a href="/features" className="hover:text-blue-600">
                Features
              </a>
              <a href="/support" className="hover:text-blue-600">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingWizard;
