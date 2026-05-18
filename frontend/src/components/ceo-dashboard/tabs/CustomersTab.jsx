import { lazy, Suspense, useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { formatDate } from '../utils/formatters';

const CustomerList = lazy(() => import('../customers/CustomerList'));

export default function CustomersTab({ customers }) {
  const notification = useNotification();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = customers.filter((entry) => {
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = entry.status === 'active';
    else if (filter === 'trial') matchesFilter = entry.status === 'trial';
    else if (filter === 'starter') matchesFilter = entry.plan === 'starter';
    else if (filter === 'professional') matchesFilter = entry.plan === 'professional';
    else if (filter === 'enterprise') matchesFilter = entry.plan === 'enterprise';

    const matchesSearch = searchTerm === ''
      || entry.name?.toLowerCase().includes(searchTerm.toLowerCase())
      || entry.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeCount = customers.filter((entry) => entry.status === 'active').length;
  const trialCount = customers.filter((entry) => entry.status === 'trial').length;
  const starterCount = customers.filter((entry) => entry.plan === 'starter').length;
  const professionalCount = customers.filter((entry) => entry.plan === 'professional').length;
  const enterpriseCount = customers.filter((entry) => entry.plan === 'enterprise').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Kunden</h2>
            <p className="text-gray-700 text-sm">Alle Unternehmen die JN Business System nutzen</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'active', label: 'Aktiv', color: 'text-green-600' },
              { key: 'trial', label: 'Testphase', color: 'text-orange-400' },
              { key: 'starter', label: 'Starter', color: 'text-gray-500' },
              { key: 'professional', label: 'Professional', color: 'text-purple-400' },
              { key: 'enterprise', label: 'Enterprise', color: 'text-amber-500' }
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

        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Suche nach Name oder Email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Kunden gefunden</h3>
            <p className="text-gray-400 mt-2">
              {customers.length === 0 ? 'Es gibt noch keine registrierten Unternehmen.' : 'Keine Ergebnisse fuer diese Filterkriterien.'}
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                Kundenliste wird geladen...
              </div>
            }
          >
            <CustomerList
              customers={filteredCustomers}
              selectedCustomerId={selectedCustomer?.id}
              onSelect={(entry) => setSelectedCustomer(selectedCustomer?.id === entry.id ? null : entry)}
              formatDate={formatDate}
            />
          </Suspense>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Uebersicht</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCell value={activeCount} label="Aktiv" className="bg-green-500/10 border-green-500/20 text-green-600" />
            <MetricCell value={trialCount} label="Testphase" className="bg-orange-500/10 border-orange-500/20 text-orange-400" />
            <MetricCell value={starterCount} label="Starter" className="bg-gray-50 border-gray-200 text-gray-500" />
            <MetricCell value={professionalCount} label="Professional" className="bg-purple-500/10 border-purple-500/20 text-purple-400" />
            <MetricCell value={enterpriseCount} label="Enterprise" className="col-span-2 bg-amber-500/10 border-amber-500/20 text-amber-500" />
          </div>
        </div>

        {selectedCustomer && (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Kundendetails</h3>
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {selectedCustomer.name?.charAt(0) || '?'}
              </div>
              <h4 className="font-semibold text-gray-900 mt-3">{selectedCustomer.name}</h4>
              <p className="text-gray-400 text-sm">{selectedCustomer.email}</p>
            </div>
            <div className="space-y-3 text-sm">
              <DetailRow label="Plan" value={selectedCustomer.plan === 'enterprise' ? 'Enterprise' : selectedCustomer.plan === 'professional' ? 'Professional' : 'Starter'} valueClass={
                selectedCustomer.plan === 'enterprise' ? 'text-amber-500' : selectedCustomer.plan === 'professional' ? 'text-purple-400' : 'text-gray-500'
              } />
              <DetailRow label="Status" value={selectedCustomer.status === 'active' ? 'Aktiv' : 'Testphase'} valueClass={selectedCustomer.status === 'active' ? 'text-green-600' : 'text-orange-400'} />
              <DetailRow label="Kunde seit" value={formatDate(selectedCustomer.since)} />
              {selectedCustomer.phone && <DetailRow label="Telefon" value={selectedCustomer.phone} />}
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => notification.info(`Kunden-Editor fuer ${selectedCustomer.name} folgt in Kuerze`)}
                className="w-full px-4 py-2 bg-indigo-500/10 text-gray-900 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Bearbeiten
              </button>
              <button
                onClick={() => { window.location.href = `mailto:${selectedCustomer.email}`; }}
                className="w-full px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-Mail senden
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Conversion</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Testphase zu Aktiv</span>
              <span className="text-green-600 font-semibold">
                {trialCount > 0 ? Math.round((activeCount / (activeCount + trialCount)) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                style={{ width: `${trialCount > 0 ? (activeCount / (activeCount + trialCount)) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Starter zu Professional/Enterprise</span>
              <span className="text-purple-400 font-semibold">
                {starterCount > 0 ? Math.round(((professionalCount + enterpriseCount) / (starterCount + professionalCount + enterpriseCount)) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"
                style={{ width: `${starterCount > 0 ? ((professionalCount + enterpriseCount) / (starterCount + professionalCount + enterpriseCount)) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ value, label, className }) {
  return (
    <div className={`rounded-lg p-3 text-center border ${className}`}>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function DetailRow({ label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-200">
      <span className="text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
