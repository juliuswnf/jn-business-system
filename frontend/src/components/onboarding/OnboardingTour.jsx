import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Interactive Onboarding Tour Component
 * Guides new users through the dashboard setup process
 */

const tourSteps = [
  {
    id: 'welcome',
    target: null, // Full screen overlay
    title: 'Willkommen bei JN Business System',
    content: 'Wir zeigen dir in 60 Sekunden, wie du dein Buchungssystem einrichtest. Los geht\'s!',
    position: 'center',
    showSkip: true,
  },
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    title: 'Dein Dashboard',
    content: 'Hier siehst du alle wichtigen Kennzahlen auf einen Blick: Buchungen, Umsatz und anstehende Termine.',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'services',
    target: '[data-tour="services"]',
    title: 'Services anlegen',
    content: 'Erstelle deine Dienstleistungen mit Preisen und Dauer. Das ist der wichtigste erste Schritt!',
    position: 'right',
    highlight: true,
    action: { label: 'Services öffnen', path: '/dashboard/services' },
  },
  {
    id: 'bookings',
    target: '[data-tour="bookings"]',
    title: 'Buchungen verwalten',
    content: 'Alle eingehenden Buchungen landen hier. Du kannst bestätigen, verschieben oder absagen.',
    position: 'right',
    highlight: true,
  },
  {
    id: 'widget',
    target: '[data-tour="widget"]',
    title: 'Buchungswidget einbinden',
    content: 'Kopiere den Code und füge ihn auf deiner Website ein. Deine Kunden können dann direkt buchen!',
    position: 'right',
    highlight: true,
    action: { label: 'Widget öffnen', path: '/dashboard/widget' },
  },
  {
    id: 'settings',
    target: '[data-tour="settings"]',
    title: 'Einstellungen',
    content: 'Öffnungszeiten, E-Mail-Templates und mehr kannst du hier anpassen.',
    position: 'right',
    highlight: true,
  },
  {
    id: 'complete',
    target: null,
    title: 'Du bist startklar!',
    content: 'Das war\'s! Starte jetzt mit dem Anlegen deiner Services. Bei Fragen sind wir per Chat für dich da.',
    position: 'center',
    showComplete: true,
  },
];

export default function OnboardingTour({ onComplete, onSkip }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  
  // Check if tour was already completed/skipped
  const [isVisible, setIsVisible] = useState(() => {
    const completed = localStorage.getItem('jn_tour_completed');
    return !completed; // Only show if NOT completed
  });

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Find and highlight target element
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('jn_tour_completed', 'skipped');
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('jn_tour_completed', 'true');
    onComplete?.();
  };

  const handleAction = () => {
    if (step.action?.path) {
      navigate(step.action.path);
      handleNext();
    }
  };

  if (!isVisible) return null;

  // Calculate tooltip position - ensure it stays within viewport
  const getTooltipStyle = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 280; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top, left, transform;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + padding;
        transform = 'translateY(-50%)';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - tooltipWidth - padding;
        transform = 'translateY(-50%)';
        break;
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }

    // Boundary checks - ensure tooltip stays within viewport
    // Check bottom boundary
    if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
      transform = 'none';
    }
    // Check top boundary
    if (top < padding) {
      top = padding;
      transform = transform.replace('translateY(-50%)', '');
    }
    // Check right boundary
    if (left + tooltipWidth / 2 > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
      transform = transform.replace('translateX(-50%)', '');
    }
    // Check left boundary
    if (left - tooltipWidth / 2 < padding) {
      left = padding;
      transform = transform.replace('translateX(-50%)', '');
    }

    return { top, left, transform: transform || 'none' };
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 transition-opacity" />

      {/* Highlight cutout */}
      {targetRect && step.highlight && (
        <>
          {/* Highlight box */}
          <div
            className="absolute border-2 border-indigo-500 rounded-lg transition-all duration-300 pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(99, 102, 241, 0.5)',
            }}
          />
          {/* Pulse animation */}
          <div
            className="absolute border-2 border-indigo-400 rounded-lg animate-ping pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              animationDuration: '2s',
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-[360px] max-w-[90vw] transition-all duration-300"
        style={getTooltipStyle()}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">
            Schritt {currentStep + 1} von {tourSteps.length}
          </span>
          {step.showSkip && (
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Überspringen
            </button>
          )}
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
        <p className="text-gray-300 leading-relaxed mb-6">{step.content}</p>

        {/* Action button (optional) */}
        {step.action && (
          <button
            onClick={handleAction}
            className="w-full mb-4 py-2.5 bg-indigo-500/20 border border-indigo-500/50 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
          >
            {step.action.label} →
          </button>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              onClick={handlePrev}
              className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Zurück
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            {isLastStep ? (step.showComplete ? 'Loslegen!' : 'Fertig') : 'Weiter'}
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Hook to check if tour should be shown
 */
export function useTourStatus() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('jn_tour_completed');
    const user = JSON.parse(localStorage.getItem('jnUser') || '{}');
    
    // Show tour for salon owners who haven't completed it
    if (user.role === 'salon_owner' && !tourCompleted) {
      setShouldShowTour(true);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem('jn_tour_completed');
    setShouldShowTour(true);
  };

  return { shouldShowTour, setShouldShowTour, resetTour };
}
