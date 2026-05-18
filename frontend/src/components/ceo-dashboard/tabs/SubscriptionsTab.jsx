import { lazy, Suspense, useState } from 'react';
import { formatDate } from '../utils/formatters';

const SubscriptionList = lazy(() => import('../subscriptions/SubscriptionList'));

export default function SubscriptionsTab({ subscriptions }) {
  const [filter, setFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);

  const filteredSubs = subscriptions.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'active') return entry.status === 'active';
    if (filter === 'trial') return entry.status === 'trial';
    if (filter === 'cancelled') return entry.status === 'cancelled' || entry.status === 'canceled' || entry.status === 'expired';
    return true;
  });

  const totalMRR = subscriptions
    .filter((entry) => entry.status === 'active')
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);

  const activeCount = subscriptions.filter((entry) => entry.status === 'active').length;
  const trialCount = subscriptions.filter((entry) => entry.status === 'trial').length;
  const avgRevenue = activeCount > 0 ? Math.round(totalMRR / activeCount) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Abonnements</h2>
            <p className="text-gray-400 text-sm">Alle laufenden Subscriptions verwalten</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'active', label: 'Aktiv', color: 'text-green-600' },
              { key: 'trial', label: 'Testphase', color: 'text-orange-400' },
              { key: 'cancelled', label: 'Gekuendigt', color: 'text-red-600' }
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

        {filteredSubs.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Abonnements</h3>
            <p className="text-gray-400 mt-2">
              {subscriptions.length === 0 ? 'Es gibt noch keine aktiven Abonnements.' : 'Keine Ergebnisse fuer diesen Filter.'}
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                Abonnementliste wird geladen...
              </div>
            }
          >
            <SubscriptionList
              subscriptions={filteredSubs}
              selectedSubscriptionId={selectedSub?.id}
              onSelect={(entry) => setSelectedSub(selectedSub?.id === entry.id ? null : entry)}
              formatDate={formatDate}
            />
          </Suspense>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Umsatz</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">EUR {totalMRR}</p>
            <p className="text-green-600/70 text-sm">Monatlicher Umsatz (MRR)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/30 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-400">Zahlend</p>
            </div>
            <div className="bg-white/30 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">EUR {avgRevenue}</p>
              <p className="text-xs text-gray-400">Durchschnitt/Kunde</p>
            </div>
          </div>
        </div>

        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Status</h3>
          <div className="space-y-3">
            <StatusLine label="Aktiv" value={activeCount} dotClass="bg-green-500" />
            <StatusLine label="Testphase" value={trialCount} dotClass="bg-orange-500" />
            <StatusLine label="Total" value={subscriptions.length} dotClass="bg-gray-500" />
          </div>
        </div>

        {selectedSub && (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <DetailRow label="Kunde" value={selectedSub.customer} />
              <DetailRow label="Plan" value={selectedSub.plan} valueClass={selectedSub.plan === 'Pro' ? 'text-purple-400' : 'text-gray-500'} />
              <DetailRow label="Betrag" value={`EUR ${selectedSub.amount}/Mo`} valueClass="text-green-600" />
              <DetailRow label="Start" value={formatDate(selectedSub.startDate)} />
              <DetailRow label="Naechste Abrechnung" value={formatDate(selectedSub.nextBilling)} noBorder />
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Prognose</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">ARR (Jaehrlich)</span>
              <span className="text-gray-900 font-bold">EUR {totalMRR * 12}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Bei +10 Kunden/Mo</span>
              <span className="text-purple-400 font-bold">EUR {(totalMRR + (avgRevenue * 10)) * 12}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLine({ label, value, dotClass }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
        <span className="text-gray-500 text-sm">{label}</span>
      </div>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

function DetailRow({ label, value, valueClass = 'text-gray-900', noBorder = false }) {
  return (
    <div className={`flex justify-between py-2 ${noBorder ? '' : 'border-b border-gray-200'}`}>
      <span className="text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
