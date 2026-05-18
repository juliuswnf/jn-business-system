import { AlertTriangle, BarChart3, Building2, CreditCard, RefreshCw, Users } from 'lucide-react';
import PanelCard from '../common/PanelCard';

export default function OverviewTab({ stats, errors, onOpenErrors }) {
  const unresolvedErrors = errors.filter((entry) => !entry.resolved).length;

  const professionalAbos = stats.professionalAbos || stats.proAbos || 0;
  const enterpriseAbos = stats.enterpriseAbos || 0;
  const totalPaidCustomers = stats.starterAbos + professionalAbos + enterpriseAbos;
  const conversionRate = stats.totalCustomers > 0
    ? Math.round((totalPaidCustomers / stats.totalCustomers) * 100)
    : 0;
  const avgRevenue = totalPaidCustomers > 0
    ? Math.round(stats.totalRevenue / totalPaidCustomers)
    : 0;

  return (
    <div className="space-y-6">
      {unresolvedErrors > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">System-Alarme</h3>
            <p className="text-red-600 text-sm">
              {unresolvedErrors} ungeloeste {unresolvedErrors === 1 ? 'Meldung erfordert' : 'Meldungen erfordern'} Ihre Aufmerksamkeit
            </p>
          </div>
          <button
            onClick={onOpenErrors}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            Jetzt pruefen
          </button>
        </div>
      )}

      <PanelCard className="border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Monatlicher Umsatz</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">EUR {stats.totalRevenue.toLocaleString('de-DE')}</span>
              <span className="text-gray-400 text-sm">/ Monat</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats.starterAbos}x EUR 129 + {professionalAbos}x EUR 249 + {enterpriseAbos}x EUR 599
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 font-semibold">{totalPaidCustomers}</span>
              <span className="text-emerald-600 text-sm ml-1.5">Zahlende Kunden</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-900 font-semibold">EUR {avgRevenue}</span>
              <span className="text-gray-500 text-sm ml-1.5">Durchschnitt pro Kunde</span>
            </div>
          </div>
        </div>
      </PanelCard>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <PanelCard>
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Gesamt Kunden</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.totalCustomers}</p>
          <p className="text-gray-400 text-xs mt-1">Registrierte Unternehmen</p>
        </PanelCard>

        <PanelCard>
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Starter</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.starterAbos}</p>
          <p className="text-gray-400 text-xs mt-1">EUR {stats.starterAbos * 129}/Monat</p>
        </PanelCard>

        <PanelCard>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Professional</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{professionalAbos}</p>
          <p className="text-gray-400 text-xs mt-1">EUR {professionalAbos * 249}/Monat</p>
        </PanelCard>

        <PanelCard>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Enterprise</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{enterpriseAbos}</p>
          <p className="text-gray-400 text-xs mt-1">EUR {enterpriseAbos * 599}/Monat</p>
        </PanelCard>

        <PanelCard>
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
            <RefreshCw className="w-5 h-5 text-gray-900" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Testphase</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.trialAbos}</p>
          <p className="text-gray-400 text-xs mt-1">In Testphase</p>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Conversion Rate</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">{conversionRate}%</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-1000"
              style={{ width: `${conversionRate}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-xs mt-2">Testphase zu zahlendem Kunden</p>
        </PanelCard>

        <PanelCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Durchschnitt Umsatz pro Kunde</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">EUR {avgRevenue}</p>
          <p className="text-gray-400 text-xs mt-3">Monatlich pro zahlendem Kunden</p>
        </PanelCard>

        <PanelCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">System Status</p>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-green-600">Online</p>
          <p className="text-gray-400 text-xs mt-3">Alle Dienste aktiv</p>
        </PanelCard>
      </div>
    </div>
  );
}
