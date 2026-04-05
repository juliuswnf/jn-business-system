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
            ? 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
        } ${className}`}
      >
        <span>{children}</span>
        {!hasAccess && <Lock className="h-4 w-4 text-gray-500" />}
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