import React, { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import UpgradePrompt from './UpgradePrompt';

const TIER_ORDER = ['starter', 'professional', 'enterprise'];

const normalizeTier = (tierValue) => {
  if (!tierValue || typeof tierValue !== 'string') {
    return 'starter';
  }

  const value = tierValue.toLowerCase().trim();
  if (value === 'pro') {
    return 'professional';
  }

  if (value.includes('enterprise')) {
    return 'enterprise';
  }

  if (value.includes('professional') || value.includes('pro')) {
    return 'professional';
  }

  return 'starter';
};

export default function FeatureGate({
  currentTier = 'starter',
  requiredTier = 'professional',
  featureLabel,
  onAllowed,
  className = '',
  children
}) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const normalizedCurrentTier = normalizeTier(currentTier);
  const normalizedRequiredTier = normalizeTier(requiredTier);

  const hasAccess = useMemo(() => {
    return TIER_ORDER.indexOf(normalizedCurrentTier) >= TIER_ORDER.indexOf(normalizedRequiredTier);
  }, [normalizedCurrentTier, normalizedRequiredTier]);

  const handleClick = () => {
    if (hasAccess) {
      onAllowed?.();
      return;
    }

    setShowUpgradePrompt(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
          hasAccess
            ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
        } ${className}`}
      >
        <span>{children}</span>
        {!hasAccess && <Lock className="h-4 w-4 text-zinc-500" />}
      </button>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        requiredTier={normalizedRequiredTier}
        currentTier={normalizedCurrentTier}
        featureLabel={featureLabel}
      />
    </>
  );
}