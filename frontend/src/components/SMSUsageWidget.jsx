import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function SMSUsageWidget() {
  const [smsUsage, setSmsUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSMSUsage();
  }, []);

  const fetchSMSUsage = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pricing/sms-usage');

      if (response.data.success) {
        setSmsUsage(response.data.smsUsage);
      }
    } catch (err) {
      // If not Enterprise tier, hide widget (403 error expected)
      if (err.response?.status === 403) {
        setError('NOT_ENTERPRISE');
      } else {
        setError(err.response?.data?.message || 'Failed to load SMS usage');
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't show widget if not Enterprise tier
  if (error === 'NOT_ENTERPRISE') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-zinc-50 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-zinc-50 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-zinc-50 rounded w-1/2"></div>
      </div>
    );
  }

  if (error && error !== 'NOT_ENTERPRISE') {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (!smsUsage) {
    return null;
  }

  // Calculate percentage used
  const percentUsed = ((smsUsage.used / smsUsage.limit) * 100).toFixed(1);

  // Determine color based on usage
  let progressColor = 'bg-green-500';
  let textColor = 'text-green-400';
  let bgColor = 'bg-green-500/10';
  let borderColor = 'border-green-500/30';

  if (percentUsed >= 100) {
    progressColor = 'bg-red-500';
    textColor = 'text-red-400';
    bgColor = 'bg-red-500/10';
    borderColor = 'border-red-500/30';
  } else if (percentUsed >= 80) {
    progressColor = 'bg-yellow-500';
    textColor = 'text-yellow-400';
    bgColor = 'bg-yellow-500/10';
    borderColor = 'border-yellow-500/30';
  }

  // Format reset date
  const resetDate = new Date(smsUsage.resetDate);
  const resetDateFormatted = resetDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-lg p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-semibold text-zinc-900">SMS-Kontingent</h3>
          </div>
          <p className="text-sm text-zinc-500">
            Reset am {resetDateFormatted}
          </p>
        </div>

        {/* Enterprise Badge */}
        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
          ENTERPRISE
        </span>
      </div>

      {/* Usage Stats */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className={`text-3xl font-bold ${textColor}`}>
              {smsUsage.used}
            </span>
            <span className="text-zinc-500 text-lg ml-1">/ {smsUsage.limit}</span>
          </div>
          <span className={`text-sm font-medium ${textColor}`}>
            {percentUsed}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-50 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>

        {/* Remaining SMS */}
        <p className="text-sm text-zinc-500 mt-2">
          {smsUsage.remaining > 0 ? (
            <>
              <span className={textColor}>{smsUsage.remaining} SMS</span> verbleibend
            </>
          ) : (
            <span className="text-red-400">Limit erreicht</span>
          )}
        </p>
      </div>

      {/* Warnings & Actions */}
      {smsUsage.overLimit && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium mb-1">
                Limit überschritten
              </p>
              <p className="text-xs text-zinc-500">
                Überschreitungskosten: €{smsUsage.overageCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {percentUsed >= 80 && percentUsed < 100 && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-yellow-400 font-medium">
                Kontingent fast aufgebraucht
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {smsUsage.used > smsUsage.limit && (
          <Link
            to="/settings/sms"
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-zinc-900 text-sm font-medium rounded-lg transition text-center"
          >
            Extra SMS kaufen
          </Link>
        )}
        <Link
          to="/settings/sms"
          className={`px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg transition text-center ${
            smsUsage.used > smsUsage.limit ? '' : 'flex-1'
          }`}
        >
          SMS-Einstellungen
        </Link>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-zinc-200">
        <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
          <div>
            <span className="block text-zinc-400">Team-Größe</span>
            <span className="text-white font-medium">{smsUsage.staffCount} Mitarbeiter</span>
          </div>
          <div>
            <span className="block text-zinc-400">Nächster Reset</span>
            <span className="text-white font-medium">{resetDateFormatted}</span>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-zinc-50/50 rounded-lg">
        <p className="text-xs text-zinc-500">
          💡 <strong className="text-zinc-900">Tipp:</strong> SMS-Limit skaliert automatisch mit Team-Größe:
          {' '}500 Basis + 50 pro Mitarbeiter (ab 6 Mitarbeitern).
        </p>
      </div>
    </div>
  );
}
