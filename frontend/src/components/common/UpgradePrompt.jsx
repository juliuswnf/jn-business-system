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
      <div className="absolute inset-0 bg-zinc-900/40" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-zinc-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-zinc-100 p-2">
              <Sparkles className="h-5 w-5 text-zinc-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Upgrade auf {PLAN_LABELS[requiredTier] || 'höheren Plan'} erforderlich
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Aktueller Plan: {PLAN_LABELS[currentTier] || 'Starter'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Modal schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-700">
            {featureLabel} ist in deinem aktuellen Plan nicht enthalten. Upgrade auf{' '}
            <strong>{PLAN_LABELS[requiredTier] || 'einen höheren Plan'}</strong>, um diese Funktion zu nutzen.
          </p>

          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              onClick={onClose}
            >
              Upgrade ansehen
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}