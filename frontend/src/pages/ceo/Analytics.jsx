import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [churnAnalysis, setChurnAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, revenueRes, cohortRes, churnRes] = await Promise.all([
        ceoAPI.getAnalyticsOverview({ period: timeRange }),
        ceoAPI.getRevenueChart({ period: '12m' }),
        ceoAPI.getCohortAnalysis(),
        ceoAPI.getChurnAnalysis()
      ]);

      if (overviewRes.data?.success) setOverview(overviewRes.data.analytics);
      if (revenueRes.data?.success) setRevenueChart(revenueRes.data.chartData || []);
      if (cohortRes.data?.success) setCohorts(cohortRes.data.cohorts || []);
      if (churnRes.data?.success) setChurnAnalysis(churnRes.data.analysis);
    } catch (err) {
      // Only show error for server errors, not for empty data
      if (err.response?.status >= 500) {
        setError('Server-Fehler beim Laden der Analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  const StatCard = ({ title, value, change, changeLabel, icon, color }) => (
    <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center`}>{icon}</div>
        {change !== undefined && change !== null && (
          <span className={`text-sm font-medium px-2 py-1 rounded ${change >= 0 ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-zinc-900 mb-1">{value}</p>
      <p className="text-zinc-400 text-sm">{title}</p>
      {changeLabel && <p className="text-zinc-500 text-xs mt-1">{changeLabel}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/ceo/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Analytics Deep-Dive</h1>
                <p className="text-xs text-zinc-400">Wachstum & Performance</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm">
                <option value="7d">Letzte 7 Tage</option>
                <option value="30d">Letzte 30 Tage</option>
                <option value="90d">Letzte 90 Tage</option>
                <option value="1y">Letztes Jahr</option>
              </select>
              <button onClick={fetchAllAnalytics} className="p-2 text-zinc-500 hover:text-zinc-900 transition" title="Aktualisieren">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-600">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Monthly Recurring Revenue" value={formatCurrency(overview?.revenue?.mrr || 0)} change={overview?.overview?.customerGrowth} changeLabel="vs. Vormonat" color="green" icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard title="Customer Lifetime Value" value={formatCurrency(overview?.revenue?.ltv || 0)} change={null} changeLabel="Durchschnitt" color="indigo" icon={<svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          <StatCard title="Churn Rate" value={`${overview?.churn?.rate || 0}%`} change={null} changeLabel="Monatlich" color="orange" icon={<svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} />
          <StatCard title="Zahlende Kunden" value={overview?.overview?.paidCustomers || 0} change={overview?.overview?.customerGrowth} changeLabel={`von ${overview?.overview?.totalCustomers || 0} gesamt`} color="purple" icon={<svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/50 border border-zinc-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-6">MRR Entwicklung</h3>
            {revenueChart.length > 0 ? (
              <div className="h-64 flex items-end gap-4">
                {revenueChart.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg" style={{ height: `${Math.max(5, (item.revenue / Math.max(...revenueChart.map(r => r.revenue || 1))) * 100)}%` }}></div>
                    <p className="text-zinc-400 text-xs mt-2">{item.month}</p>
                    <p className="text-zinc-900 text-sm font-medium">{formatCurrency(item.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : <div className="h-64 flex items-center justify-center text-zinc-400">Keine Daten verfügbar</div>}
          </div>

          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-6">Kündigungsgründe</h3>
            {churnAnalysis?.reasons?.length > 0 ? (
              <div className="space-y-4">
                {churnAnalysis.reasons.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-500 text-sm">{item.reason}</span>
                      <span className="text-zinc-900 text-sm font-medium">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-zinc-50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="h-48 flex items-center justify-center text-zinc-400 text-center">Keine Kündigungen 🎉</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-6">Abonnements</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <span className="text-zinc-900">Pro Plan (€69/Mo)</span>
                <div className="text-right">
                  <p className="text-zinc-900 font-bold">{formatCurrency((overview?.subscriptions?.pro || 0) * 69)}</p>
                  <p className="text-zinc-400 text-sm">{overview?.subscriptions?.pro || 0} Kunden</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <span className="text-zinc-900">Starter Plan (€29/Mo)</span>
                <div className="text-right">
                  <p className="text-zinc-900 font-bold">{formatCurrency((overview?.subscriptions?.starter || 0) * 29)}</p>
                  <p className="text-zinc-400 text-sm">{overview?.subscriptions?.starter || 0} Kunden</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <span className="text-zinc-900">Testphase</span>
                <div className="text-right">
                  <p className="text-yellow-600 font-bold">{overview?.subscriptions?.trial || 0}</p>
                  <p className="text-zinc-400 text-sm">Potenzielle Kunden</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Zusammenfassung</h3>
            <div className="space-y-4">
              <div>
                <p className="text-zinc-500 text-sm mb-1">Annual Recurring Revenue</p>
                <p className="text-3xl font-bold text-zinc-900">{formatCurrency(overview?.revenue?.arr || 0)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm mb-1">Ø Revenue pro Kunde</p>
                <p className="text-green-600 font-medium">{formatCurrency(overview?.revenue?.arpu || 0)}/Monat</p>
              </div>
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-zinc-500 text-sm mb-1">Neue Kunden (Zeitraum)</p>
                <p className="text-zinc-900 font-medium">+{overview?.overview?.newCustomers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
