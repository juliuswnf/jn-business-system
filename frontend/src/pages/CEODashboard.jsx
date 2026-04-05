import { useState, useEffect } from 'react';
import { api, API_URL } from '../utils/api';
import { captureError } from '../utils/errorTracking';
import { useNotification } from '../context/NotificationContext';
import { AlertTriangle, Users, CreditCard, Building2, Server, BarChart3, RefreshCw, Play, Square } from 'lucide-react';

const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const CEODashboard = () => {
  const notification = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    starterAbos: 0,
    professionalAbos: 0,
    enterpriseAbos: 0,
    proAbos: 0, // backward compat
    trialAbos: 0,
    totalRevenue: 0
  });
  const [errors, setErrors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const statsRes = await api.get('/ceo/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }

        const errorsRes = await api.get('/ceo/errors?limit=50');
        if (errorsRes.data.success) {
          setErrors(errorsRes.data.errors || []);
        }

        const customersRes = await api.get('/ceo/customers?limit=100');
        if (customersRes.data.success) {
          setCustomers(customersRes.data.customers || []);
        }

        const subsRes = await api.get('/ceo/ceo-subscriptions?limit=100');
        if (subsRes.data.success) {
          setSubscriptions(subsRes.data.subscriptions || []);
        }

      } catch (err) {
        captureError(err, { context: 'fetchCEODashboard' });
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markErrorAsResolved = async (errorId) => {
    try {
      const response = await api.patch(`/ceo/errors/${errorId}/resolve`, { notes: 'Vom CEO Kontrollpanel als gelöst markiert' });

      if (response.data.success) {
        setErrors(errors.map(e => e.id === errorId ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e));
      }
    } catch (err) {
      captureError(err, { context: 'resolveError' });
    }
  };

  const navItems = [
    { id: 'overview', label: 'Übersicht', icon: BarChart3 },
    { id: 'errors', label: 'Fehler', icon: AlertTriangle, badge: errors.filter(e => !e.resolved).length },
    { id: 'customers', label: 'Unternehmen', icon: Building2 },
    { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
    { id: 'system', label: 'System', icon: Server },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} errors={errors} setActiveTab={setActiveTab} />;
      case 'errors':
        return <ErrorsTab errors={errors} onResolve={markErrorAsResolved} />;
      case 'customers':
        return <CustomersTab customers={customers} />;
      case 'subscriptions':
        return <SubscriptionsTab subscriptions={subscriptions} />;
      case 'system':
        return <SystemControlTab />;
      default:
        return <OverviewTab stats={stats} errors={errors} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">CEO Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System-Übersicht und Verwaltung</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-[11px] rounded-full font-semibold ${
                  activeTab === item.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
};

// ==================== TAB COMPONENTS ====================

const OverviewTab = ({ stats, errors, setActiveTab }) => {
  const unresolvedErrors = errors.filter(e => !e.resolved).length;

  // Calculate metrics
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
      {/* Error Alert */}
      {unresolvedErrors > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">System-Alarme</h3>
            <p className="text-red-600 text-sm">{unresolvedErrors} ungelöste {unresolvedErrors === 1 ? 'Meldung erfordert' : 'Meldungen erfordern'} Ihre Aufmerksamkeit</p>
          </div>
          <button
            onClick={() => setActiveTab('errors')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            Jetzt prüfen
          </button>
        </div>
      )}

      {/* Revenue Hero */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Monatlicher Umsatz</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString('de-DE')}</span>
              <span className="text-gray-400 text-sm">/ Monat</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats.starterAbos}× €129 + {professionalAbos}× €249 + {enterpriseAbos}× €599
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 font-semibold">{totalPaidCustomers}</span>
              <span className="text-emerald-600 text-sm ml-1.5">Zahlende Kunden</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-900 font-semibold">€{avgRevenue}</span>
              <span className="text-gray-500 text-sm ml-1.5">Ø pro Kunde</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Gesamt Kunden</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.totalCustomers}</p>
          <p className="text-gray-400 text-xs mt-1">Registrierte Unternehmen</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Starter</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.starterAbos}</p>
          <p className="text-gray-400 text-xs mt-1">€{stats.starterAbos * 129}/Monat</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Professional</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{professionalAbos}</p>
          <p className="text-gray-400 text-xs mt-1">€{professionalAbos * 249}/Monat</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Enterprise</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{enterpriseAbos}</p>
          <p className="text-gray-400 text-xs mt-1">€{enterpriseAbos * 599}/Monat</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
            <RefreshCw className="w-5 h-5 text-gray-900" />
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Testphase</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{stats.trialAbos}</p>
          <p className="text-gray-400 text-xs mt-1">In Testphase</p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
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
          <p className="text-gray-400 text-xs mt-2">Testphase → Zahlender Kunde</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Ø Umsatz pro Kunde</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-gray-900">€{avgRevenue}</p>
          <p className="text-gray-400 text-xs mt-3">Monatlich pro zahlenden Kunden</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">System Status</p>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-green-600">Online</p>
          <p className="text-gray-400 text-xs mt-3">Alle Dienste aktiv</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, iconType, color, subtitle }) => {
  const colors = {
    blue: 'from-blue-500/10 to-blue-600/10 border-gray-200/20',
    green: 'from-green-500/10 to-green-600/10 border-green-500/20',
    purple: 'from-purple-500/10 to-purple-600/10 border-purple-500/20',
    orange: 'from-orange-500/10 to-orange-600/10 border-orange-500/20',
  };

  const textColors = {
    blue: 'text-gray-500',
    green: 'text-green-600',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  const iconColors = {
    blue: 'text-gray-500/60',
    green: 'text-green-600/60',
    purple: 'text-purple-400/60',
    orange: 'text-orange-400/60',
  };

  const renderIcon = () => {
    const iconClass = `w-8 h-8 ${iconColors[color]}`;
    switch (iconType) {
      case 'users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'rocket':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
        );
      case 'star':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        );
      case 'target':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-700 text-sm">{title}</p>
          <p className={`text-2xl font-semibold tracking-tight ${textColors[color]} mt-1`}>{value}</p>
          <p className="text-gray-700 text-xs mt-1">{subtitle}</p>
        </div>
        {renderIcon()}
      </div>
    </div>
  );
};

const ErrorsTab = ({ errors, onResolve }) => {
  const [filter, setFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);

  const handleResolve = (id) => {
    onResolve(id);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredErrors = errors.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !e.resolved;
    if (filter === 'critical') return e.type === 'critical' && !e.resolved;
    if (filter === 'errors') return e.type === 'error' && !e.resolved;
    if (filter === 'warnings') return e.type === 'warning' && !e.resolved;
    if (filter === 'resolved') return e.resolved;
    return true;
  });

  const criticalCount = errors.filter(e => !e.resolved && e.type === 'critical').length;
  const errorCount = errors.filter(e => !e.resolved && e.type === 'error').length;
  const warningCount = errors.filter(e => !e.resolved && e.type === 'warning').length;
  const resolvedCount = errors.filter(e => e.resolved).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Error List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header with Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Fehlermeldungen</h2>
            <p className="text-gray-700 text-sm">Überwachen Sie alle Fehler und Warnungen</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'unresolved', label: 'Offen' },
              { key: 'critical', label: 'Kritisch', color: 'text-red-600' },
              { key: 'errors', label: 'Fehler', color: 'text-orange-400' },
              { key: 'warnings', label: 'Warnungen', color: 'text-yellow-600' },
              { key: 'resolved', label: 'Gelöst', color: 'text-green-600' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f.key
                    ? 'bg-white text-black'
                    : `bg-gray-50/50 ${f.color || 'text-gray-500'} hover:bg-gray-100`
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error List */}
        {filteredErrors.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Fehler</h3>
            <p className="text-gray-700 mt-2">
              {filter === 'all' ? 'Alle Systeme laufen einwandfrei' : 'Keine Ergebnisse für diesen Filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredErrors.map((error) => (
              <div
                key={error.id}
                onClick={() => setSelectedError(selectedError?.id === error.id ? null : error)}
                className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
                  selectedError?.id === error.id ? 'ring-2 ring-indigo-500' : ''
                } ${
                  error.resolved
                    ? 'border-gray-200 opacity-60'
                    : error.type === 'critical'
                    ? 'border-red-500/50'
                    : error.type === 'error'
                    ? 'border-orange-500/30'
                    : 'border-yellow-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      error.resolved
                        ? 'bg-green-500/20'
                        : error.type === 'critical'
                        ? 'bg-red-500/20'
                        : error.type === 'error'
                        ? 'bg-orange-500/20'
                        : 'bg-yellow-500/20'
                    }`}
                  >
                    {error.resolved ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${error.type === 'critical' ? 'text-red-600' : error.type === 'error' ? 'text-orange-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-medium ${error.resolved ? 'text-gray-400' : 'text-gray-900'}`}>
                          {error.message}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatTimestamp(error.timestamp)}</span>
                          {error.source && <span className="capitalize">• {error.source}</span>}
                          {error.salon && <span>• {error.salon.name}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        error.resolved
                          ? 'bg-green-500/20 text-green-600'
                          : error.type === 'critical'
                          ? 'bg-red-500/20 text-red-600'
                          : error.type === 'error'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {error.resolved ? 'Gelöst' : error.type === 'critical' ? 'Kritisch' : error.type === 'error' ? 'Fehler' : 'Warnung'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status Overview */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">Status Übersicht</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-red-600 font-medium">Kritisch</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-red-600">{criticalCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-orange-400 font-medium">Fehler</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-orange-400">{errorCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-yellow-600 font-medium">Warnungen</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-yellow-600">{warningCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-600 font-medium">Gelöst</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-green-600">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Selected Error Details */}
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
                  <p className="text-xs text-gray-400">Quelle</p>
                  <p className="text-gray-900 text-sm mt-1 capitalize">{selectedError.source}</p>
                </div>
              )}
              {selectedError.stack && (
                <div>
                  <p className="text-xs text-gray-400">Stack Trace</p>
                  <pre className="mt-1 p-2 bg-white/50 rounded-lg text-xs text-gray-500 overflow-x-auto">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
              {!selectedError.resolved && (
                <button
                  onClick={() => handleResolve(selectedError.id)}
                  className="w-full mt-2 px-4 py-2 bg-green-500 text-gray-900 rounded-lg font-medium hover:bg-green-600 transition"
                >
                  Als gelöst markieren
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Schnellaktionen</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                errors.filter(e => !e.resolved).forEach(e => handleResolve(e.id));
              }}
              className="w-full px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium hover:bg-green-500/20 transition text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Alle als gelöst markieren
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-left flex items-center gap-2"
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
};

const CustomersTab = ({ customers }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = customers.filter(c => {
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = c.status === 'active';
    else if (filter === 'trial') matchesFilter = c.status === 'trial';
    else if (filter === 'starter') matchesFilter = c.plan === 'starter';
    else if (filter === 'professional') matchesFilter = c.plan === 'professional';
    else if (filter === 'enterprise') matchesFilter = c.plan === 'enterprise';

    const matchesSearch = searchTerm === '' ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  };

  // Stats
  const activeCount = customers.filter(c => c.status === 'active').length;
  const trialCount = customers.filter(c => c.status === 'trial').length;
  const starterCount = customers.filter(c => c.plan === 'starter').length;
  const professionalCount = customers.filter(c => c.plan === 'professional').length;
  const enterpriseCount = customers.filter(c => c.plan === 'enterprise').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
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
              { key: 'enterprise', label: 'Enterprise', color: 'text-amber-500' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f.key
                    ? 'bg-white text-black'
                    : `bg-gray-50/50 ${f.color || 'text-gray-500'} hover:bg-gray-100`
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Suche nach Name oder Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Kunden gefunden</h3>
            <p className="text-gray-400 mt-2">
              {customers.length === 0 ? 'Es gibt noch keine registrierten Unternehmen.' : 'Keine Ergebnisse für diese Filterkriterien.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
                  selectedCustomer?.id === customer.id ? 'ring-2 ring-indigo-500 border-indigo-500/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-gray-900 font-bold text-lg flex-shrink-0">
                    {customer.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 truncate">{customer.name || 'Unbekannt'}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        customer.plan === 'enterprise'
                          ? 'bg-amber-500/20 text-amber-500'
                          : customer.plan === 'professional'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        {customer.plan === 'enterprise' ? 'Enterprise' : customer.plan === 'professional' ? 'Professional' : 'Starter'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{customer.email || '-'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active'
                        ? 'bg-green-500/20 text-green-600'
                        : customer.status === 'trial'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {customer.status === 'active' ? 'Aktiv' : customer.status === 'trial' ? 'Testphase' : 'Inaktiv'}
                    </span>
                    <p className="text-gray-500 text-xs mt-1">seit {formatDate(customer.since)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Übersicht</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-green-600">{activeCount}</p>
              <p className="text-xs text-green-600/70">Aktiv</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-orange-400">{trialCount}</p>
              <p className="text-xs text-orange-400/70">Testphase</p>
            </div>
            <div className="bg-gray-50 border border-gray-200/20 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-gray-500">{starterCount}</p>
              <p className="text-xs text-gray-500/70">Starter</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-purple-400">{professionalCount}</p>
              <p className="text-xs text-purple-400/70">Professional</p>
            </div>
            <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold tracking-tight text-amber-500">{enterpriseCount}</p>
              <p className="text-xs text-amber-500/70">Enterprise</p>
            </div>
          </div>
        </div>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Kundendetails</h3>
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-gray-900 font-bold text-2xl">
                {selectedCustomer.name?.charAt(0) || '?'}
              </div>
              <h4 className="font-semibold text-gray-900 mt-3">{selectedCustomer.name}</h4>
              <p className="text-gray-400 text-sm">{selectedCustomer.email}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Plan</span>
                <span className={
                  selectedCustomer.plan === 'enterprise' ? 'text-amber-500' :
                  selectedCustomer.plan === 'professional' ? 'text-purple-400' : 'text-gray-500'
                }>
                  {selectedCustomer.plan === 'enterprise' ? 'Enterprise' : selectedCustomer.plan === 'professional' ? 'Professional' : 'Starter'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Status</span>
                <span className={selectedCustomer.status === 'active' ? 'text-green-600' : 'text-orange-400'}>
                  {selectedCustomer.status === 'active' ? 'Aktiv' : 'Testphase'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Kunde seit</span>
                <span className="text-gray-900">{formatDate(selectedCustomer.since)}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-400">Telefon</span>
                  <span className="text-gray-900">{selectedCustomer.phone}</span>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => notification.info(`Kunden-Editor für ${selectedCustomer.name} – folgt in Kürze`)}
                className="w-full px-4 py-2 bg-indigo-500/10 text-gray-900 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Bearbeiten
              </button>
              <button
                onClick={() => { window.location.href = `mailto:${selectedCustomer.email}`; }}
                className="w-full px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-Mail senden
              </button>
            </div>
          </div>
        )}

        {/* Conversion Funnel */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Conversion</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Testphase → Aktiv</span>
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
              <span className="text-gray-500 text-sm">Starter → Professional/Enterprise</span>
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
};

const SubscriptionsTab = ({ subscriptions }) => {
  const [filter, setFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);

  const filteredSubs = subscriptions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.status === 'active';
    if (filter === 'trial') return s.status === 'trial';
    if (filter === 'cancelled') return s.status === 'cancelled';
    return true;
  });

  const totalMRR = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const avgRevenue = activeCount > 0 ? Math.round(totalMRR / activeCount) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
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
              { key: 'cancelled', label: 'Gekündigt', color: 'text-red-600' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f.key
                    ? 'bg-white text-black'
                    : `bg-gray-50/50 ${f.color || 'text-gray-500'} hover:bg-gray-100`
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription List */}
        {filteredSubs.length === 0 ? (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Keine Abonnements</h3>
            <p className="text-gray-400 mt-2">
              {subscriptions.length === 0 ? 'Es gibt noch keine aktiven Abonnements.' : 'Keine Ergebnisse für diesen Filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubs.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(selectedSub?.id === sub.id ? null : sub)}
                className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
                  selectedSub?.id === sub.id ? 'ring-2 ring-indigo-500 border-indigo-500/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      sub.plan === 'enterprise'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : sub.plan === 'professional'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{sub.customer || 'Unbekannt'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.plan === 'enterprise'
                            ? 'bg-amber-500/20 text-amber-500'
                            : sub.plan === 'professional'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-50 text-gray-500'
                        }`}>
                          {sub.plan}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-400 text-sm">seit {formatDate(sub.startDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${sub.amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {sub.amount > 0 ? `€${sub.amount}` : '€0'}
                      <span className="text-xs font-normal text-gray-400">/Mo</span>
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.status === 'active'
                        ? 'bg-green-500/20 text-green-600'
                        : sub.status === 'trial'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-red-500/20 text-red-600'
                    }`}>
                      {sub.status === 'active' ? 'Aktiv' : sub.status === 'trial' ? 'Testphase' : 'Gekündigt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Revenue Stats */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Umsatz</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">€{totalMRR}</p>
            <p className="text-green-600/70 text-sm">Monatlicher Umsatz (MRR)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/30 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-400">Zahlend</p>
            </div>
            <div className="bg-white/30 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">€{avgRevenue}</p>
              <p className="text-xs text-gray-400">Ø/Kunde</p>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-500 text-sm">Aktiv</span>
              </div>
              <span className="text-gray-900 font-semibold">{activeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-500 text-sm">Testphase</span>
              </div>
              <span className="text-gray-900 font-semibold">{trialCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-gray-500 text-sm">Total</span>
              </div>
              <span className="text-gray-900 font-semibold">{subscriptions.length}</span>
            </div>
          </div>
        </div>

        {/* Selected Subscription */}
        {selectedSub && (
          <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Kunde</span>
                <span className="text-gray-900">{selectedSub.customer}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Plan</span>
                <span className={selectedSub.plan === 'Pro' ? 'text-purple-400' : 'text-gray-500'}>
                  {selectedSub.plan}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Betrag</span>
                <span className="text-green-600">€{selectedSub.amount}/Mo</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-400">Start</span>
                <span className="text-gray-900">{formatDate(selectedSub.startDate)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Nächste Abrechnung</span>
                <span className="text-gray-900">{formatDate(selectedSub.nextBilling)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Projections */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Prognose</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">ARR (Jährlich)</span>
              <span className="text-gray-900 font-bold">€{totalMRR * 12}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Bei +10 Kunden/Mo</span>
              <span className="text-purple-400 font-bold">€{(totalMRR + (avgRevenue * 10)) * 12}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SYSTEM CONTROL TAB ====================

const SystemControlTab = () => {
  const [services, setServices] = useState([
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'Datenbank-Container',
      status: 'unknown',
      port: 27017,
      type: 'database',
      command: 'docker'
    },
    {
      id: 'backend',
      name: 'Backend Server',
      description: 'Node.js API Server',
      status: 'unknown',
      port: 3000,
      type: 'server',
      command: 'node'
    },
    {
      id: 'frontend',
      name: 'Frontend',
      description: 'React Development Server',
      status: 'unknown',
      port: 3000,
      type: 'server',
      command: 'vite'
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'Cache & Queue Service',
      status: 'unknown',
      port: 6379,
      type: 'cache',
      command: 'docker'
    }
  ]);

  const [actionLoading, setActionLoading] = useState({});
  const [logs, setLogs] = useState([]);
  const [allStarting, setAllStarting] = useState(false);
  const [allStopping, setAllStopping] = useState(false);

  // Check service status
  const checkServiceStatus = async (serviceId) => {
    // ? SECURITY FIX: Use central api instance
    try {
      const response = await api.get(`/ceo/system/status/${serviceId}`);

      if (response.data) {
        const data = response.data;
        setServices(prev => prev.map(s =>
          s.id === serviceId ? { ...s, status: data.status } : s
        ));
      }
    } catch (err) {
      captureError(err, { context: 'checkServiceStatus', serviceId });
    }
  };

  // Check all services on mount
  useEffect(() => {
    services.forEach(s => checkServiceStatus(s.id));

    // Poll status every 10 seconds
    const interval = setInterval(() => {
      services.forEach(s => checkServiceStatus(s.id));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-50));
  };

  // Start service
  const startService = async (serviceId) => {
    setActionLoading(prev => ({ ...prev, [serviceId]: 'starting' }));
    addLog(`Starte ${serviceId}...`, 'info');

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const response = await api.post(`/ceo/system/start/${serviceId}`);
      const data = response.data;

      if (data.success) {
        addLog(`[OK] ${serviceId} erfolgreich gestartet`, 'success');
        setServices(prev => prev.map(s =>
          s.id === serviceId ? { ...s, status: 'running' } : s
        ));
      } else {
        addLog(`[ERR] Fehler beim Starten von ${serviceId}: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [serviceId]: null }));
    }
  };

  // Stop service
  const stopService = async (serviceId) => {
    setActionLoading(prev => ({ ...prev, [serviceId]: 'stopping' }));
    addLog(`Stoppe ${serviceId}...`, 'info');

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const response = await api.post(`/ceo/system/stop/${serviceId}`);
      const data = response.data;

      if (data.success) {
        addLog(`[OK] ${serviceId} gestoppt`, 'success');
        setServices(prev => prev.map(s =>
          s.id === serviceId ? { ...s, status: 'stopped' } : s
        ));
      } else {
        addLog(`[ERR] Fehler beim Stoppen von ${serviceId}: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [serviceId]: null }));
    }
  };

  // Start all services
  const startAllServices = async () => {
    setAllStarting(true);
    addLog('[SYS] Starte alle Services...', 'info');

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const response = await api.post('/ceo/system/start-all');
      const data = response.data;

      if (data.success) {
        addLog('[OK] Alle Services werden gestartet...', 'success');
        // Update all service statuses
        data.results?.forEach(result => {
          if (result.success) {
            setServices(prev => prev.map(s =>
              s.id === result.service ? { ...s, status: 'running' } : s
            ));
            addLog(`  > ${result.service} gestartet`, 'success');
          } else {
            addLog(`  X ${result.service}: ${result.message}`, 'error');
          }
        });
      } else {
        addLog(`[ERR] Fehler: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setAllStarting(false);
      // Refresh status after a delay
      setTimeout(() => services.forEach(s => checkServiceStatus(s.id)), 3000);
    }
  };

  // Stop all services
  const stopAllServices = async () => {
    setAllStopping(true);
    addLog('[SYS] Stoppe alle Services...', 'info');

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const response = await api.post('/ceo/system/stop-all');
      const data = response.data;

      if (data.success) {
        addLog('[OK] Alle Services werden gestoppt...', 'success');
        setServices(prev => prev.map(s => ({ ...s, status: 'stopped' })));
      } else {
        addLog(`[ERR] Fehler: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setAllStopping(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'running': return 'Läuft';
      case 'stopped': return 'Gestoppt';
      case 'starting': return 'Startet...';
      case 'error': return 'Fehler';
      default: return 'Unbekannt';
    }
  };

  // Get type icon - returns SVG element
  const getTypeIcon = (type) => {
    const iconClass = "w-6 h-6 text-gray-500";
    switch (type) {
      case 'database':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case 'server':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'cache':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Services */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Services</h2>
            <p className="text-gray-400 text-sm">Alle System-Komponenten im Überblick</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={startAllServices}
              disabled={allStarting || allStopping}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                allStarting
                  ? 'bg-green-500/20 text-green-600 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {allStarting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Play size={16} />
              )}
              {allStarting ? 'Startet...' : 'Alle Starten'}
            </button>
            <button
              onClick={stopAllServices}
              disabled={allStarting || allStopping}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                allStopping
                  ? 'bg-red-500/20 text-red-600 cursor-wait'
                  : 'bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              {allStopping ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
              ) : (
                <Square size={16} />
              )}
              {allStopping ? 'Stoppt...' : 'Alle Stoppen'}
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const isRunning = service.status === 'running';
            const isStopped = service.status === 'stopped';

            return (
              <div
                key={service.id}
                className={`bg-white/50 border rounded-xl p-5 transition-all ${
                  isRunning
                    ? 'border-green-500/30 shadow-sm shadow-green-500/10'
                    : 'border-gray-200 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isRunning ? 'bg-green-500/20' : 'bg-gray-50'
                    }`}>
                      {getTypeIcon(service.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-gray-400 text-sm">{service.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                      <span className="text-sm text-gray-500">{getStatusText(service.status)}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">:{service.port}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startService(service.id)}
                      disabled={actionLoading[service.id] || isRunning}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        isRunning
                          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                          : actionLoading[service.id] === 'starting'
                          ? 'bg-green-500/20 text-green-600 cursor-wait'
                          : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                      }`}
                    >
                      {actionLoading[service.id] === 'starting' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-400 border-t-transparent"></div>
                      ) : (
                        <Play size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => stopService(service.id)}
                      disabled={actionLoading[service.id] || isStopped}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        isStopped
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : actionLoading[service.id] === 'stopping'
                          ? 'bg-red-500/20 text-red-600 cursor-wait'
                          : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                      }`}
                    >
                      {actionLoading[service.id] === 'stopping' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent"></div>
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => checkServiceStatus(service.id)}
                      className="px-2 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-400 hover:text-gray-700 transition"
                      title="Status aktualisieren"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Logs */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-semibold text-gray-900">System Logs</h3>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
            >
              Leeren
            </button>
          </div>
          <div className="bg-white rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-gray-500 flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Keine Logs vorhanden...
                </div>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`py-1.5 border-b border-gray-900 last:border-0 ${
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'success' ? 'text-green-600' :
                    'text-gray-500'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* System Status Overview */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
              <span className="text-gray-500">Aktive Services</span>
              <span className="text-xl font-bold text-green-600">
                {services.filter(s => s.status === 'running').length}/{services.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
              <span className="text-gray-500">Gestoppt</span>
              <span className="text-xl font-bold text-red-600">
                {services.filter(s => s.status === 'stopped').length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
              <span className="text-gray-500">Unbekannt</span>
              <span className="text-xl font-bold text-gray-500">
                {services.filter(s => s.status === 'unknown').length}
              </span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">System Health</span>
              <span className="text-gray-900 font-medium">
                {Math.round((services.filter(s => s.status === 'running').length / services.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${(services.filter(s => s.status === 'running').length / services.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-200/20 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => window.open('http://localhost:3000', '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/30 rounded-lg text-left hover:bg-white/50 transition group"
            >
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm font-medium">Frontend öffnen</p>
                <p className="text-gray-400 text-xs">localhost:3000</p>
              </div>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button
              onClick={() => window.open(`${BACKEND_ORIGIN}/api/health`, '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/30 rounded-lg text-left hover:bg-white/50 transition group"
            >
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm font-medium">Backend Health</p>
                <p className="text-gray-400 text-xs">API Status prüfen</p>
              </div>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Startup Order Info */}
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Startup-Reihenfolge</h3>
          <div className="space-y-3">
            {[
              { step: 1, name: 'MongoDB', desc: 'Datenbank', color: 'green' },
              { step: 2, name: 'Redis', desc: 'Cache Layer', color: 'red' },
              { step: 3, name: 'Backend', desc: 'API Server', color: 'yellow' },
              { step: 4, name: 'Frontend', desc: 'React App', color: 'blue' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center text-xs font-bold`}>
                  {item.step}
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">{item.name}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;
