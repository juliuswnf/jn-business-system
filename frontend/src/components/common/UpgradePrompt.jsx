import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

const PLAN_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise'
};

export default function UpgradePrompt({
  isOpen,
  onClose,
  requiredTier = 'professional',
  currentTier = 'starter',
  featureLabel = 'Diese Funktion'
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-gray-100 p-2">
              <Sparkles className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade auf {PLAN_LABELS[requiredTier] || 'höheren Plan'} erforderlich
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aktueller Plan: {PLAN_LABELS[currentTier] || 'Starter'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Modal schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            {featureLabel} ist in deinem aktuellen Plan nicht enthalten. Upgrade auf{' '}
            <strong>{PLAN_LABELS[requiredTier] || 'einen höheren Plan'}</strong>, um diese Funktion zu nutzen.
          </p>

          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              onClick={onClose}
            >
              Upgrade ansehen
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}