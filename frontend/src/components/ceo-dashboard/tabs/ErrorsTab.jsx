import { lazy, Suspense, useState } from 'react';
import { formatTimestamp } from '../utils/formatters';

const ErrorList = lazy(() => import('../errors/ErrorList'));

export default function ErrorsTab({ errors, onResolve }) {
  const [filter, setFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);

  const filteredErrors = errors.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !entry.resolved;
    if (filter === 'critical') return entry.type === 'critical' && !entry.resolved;
    if (filter === 'errors') return entry.type === 'error' && !entry.resolved;
    if (filter === 'warnings') return entry.type === 'warning' && !entry.resolved;
    if (filter === 'resolved') return entry.resolved;
    return true;
  });

  const criticalCount = errors.filter((entry) => !entry.resolved && entry.type === 'critical').length;
  const errorCount = errors.filter((entry) => !entry.resolved && entry.type === 'error').length;
  const warningCount = errors.filter((entry) => !entry.resolved && entry.type === 'warning').length;
  const resolvedCount = errors.filter((entry) => entry.resolved).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Fehlermeldungen</h2>
            <p className="text-gray-700 text-sm">Ueberwachen Sie alle Fehler und Warnungen</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'unresolved', label: 'Offen' },
              { key: 'critical', label: 'Kritisch', color: 'text-red-600' },
              { key: 'errors', label: 'Fehler', color: 'text-orange-400' },
              { key: 'warnings', label: 'Warnungen', color: 'text-yellow-600' },
              { key: 'resolved', label: 'Geloest', color: 'text-green-600' }
            ].map((entry) => (
              <button
                key={entry.key}
                onClick={() => setFilter(entry.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === entry.key
                    ? 'bg-white text-black'
                    : `bg-gray-50/50 ${entry.color || 'text-gray-500'} hover:bg-gray-100`
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {filteredErrors.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Fehler</h3>
            <p className="text-gray-700 mt-2">
              {filter === 'all' ? 'Alle Systeme laufen einwandfrei' : 'Keine Ergebnisse fuer diesen Filter'}
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                Fehlerliste wird geladen...
              </div>
            }
          >
            <ErrorList
              errors={filteredErrors}
              selectedErrorId={selectedError?.id}
              onSelect={(entry) => setSelectedError(selectedError?.id === entry.id ? null : entry)}
              formatTimestamp={formatTimestamp}
            />
          </Suspense>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">Status Uebersicht</h3>
          <div className="space-y-3">
            <StatusRow label="Kritisch" value={criticalCount} color="red" iconType="critical" />
            <StatusRow label="Fehler" value={errorCount} color="orange" iconType="error" />
            <StatusRow label="Warnungen" value={warningCount} color="yellow" iconType="warning" />
            <StatusRow label="Geloest" value={resolvedCount} color="green" iconType="resolved" />
          </div>
        </div>

        {selectedError && (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-700">Nachricht</p>
                <p className="text-gray-900 text-sm mt-1">{selectedError.message}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Zeitpunkt</p>
                <p className="text-gray-900 text-sm mt-1">{formatTimestamp(selectedError.timestamp)}</p>
              </div>
              {selectedError.source && (
                <div>
                  <p className="text-xs text-gray-700">Quelle</p>
                  <p className="text-gray-900 text-sm mt-1 capitalize">{selectedError.source}</p>
                </div>
              )}
              {selectedError.stack && (
                <div>
                  <p className="text-xs text-gray-700">Stack Trace</p>
                  <pre className="mt-1 p-2 bg-white/50 rounded-lg text-xs text-gray-500 overflow-x-auto">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              {!selectedError.resolved && (
                <button
                  onClick={() => onResolve(selectedError.id)}
                  className="w-full mt-2 px-4 py-2 bg-green-500 text-gray-900 rounded-lg font-medium hover:bg-green-600 transition"
                >
                  Als geloest markieren
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Schnellaktionen</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                errors.filter((entry) => !entry.resolved).forEach((entry) => onResolve(entry.id));
              }}
              className="w-full px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium hover:bg-green-500/20 transition text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Alle als geloest markieren
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-100 transition text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Neu laden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color, iconType }) {
  const colorClass = {
    red: 'bg-red-500/10 border-red-500/20 text-red-600',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
    green: 'bg-green-500/10 border-green-500/20 text-green-600'
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${colorClass[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass[color]}`}>
          {iconType === 'resolved' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : iconType === 'critical' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}
