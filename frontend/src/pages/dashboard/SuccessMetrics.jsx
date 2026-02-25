import { useState, useEffect } from 'react';
import { captureError } from '../../utils/errorTracking';
import { api } from '../../utils/api';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Star,
  BarChart3,
  PieChart,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Target,
  Repeat,
  Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Success Metrics Dashboard for Business Owners
 * Shows KPIs and value they get from JN Automation
 */
const SuccessMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [peakHours, setPeakHours] = useState({ hourly: [], daily: [] });
  const [customerInsights, setCustomerInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    // ? SECURITY FIX: Use central api instance (already imported)
    try {
      // Fetch all data in parallel
      const [metricsRes, trendsRes, servicesRes, peakRes, customersRes] = await Promise.all([
        api.get('/salons/analytics/overview'),
        api.get(`/salons/analytics/trends?period=${period}`),
        api.get('/salons/analytics/top-services'),
        api.get('/salons/analytics/peak-hours'),
        api.get('/salons/analytics/customers')
      ]);

      if (metricsRes.data) {
        const data = metricsRes.data;
        setMetrics(data.metrics);
      }

      if (trendsRes.data) {
        const data = trendsRes.data;
        setTrends(data.data || []);
      }

      if (servicesRes.data) {
        const data = servicesRes.data;
        // Calculate percentages
        const total = data.services?.reduce((sum, s) => sum + s.bookings, 0) || 1;
        setTopServices(data.services?.map(s => ({
          ...s,
          percentage: Math.round((s.bookings / total) * 100)
        })) || []);
      }

      if (peakRes.data) {
        const data = peakRes.data;
        setPeakHours(data);
      }

      if (customersRes.data) {
        const data = customersRes.data;
        setCustomerInsights(data.insights);
      }
    } catch (error) {
      captureError(error, { context: 'fetchMetrics' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('de-DE').format(value || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-300">Lade Statistiken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
                Erfolgs-Dashboard
              </h1>
              <p className="text-gray-300 text-sm mt-1">Deine KPIs auf einen Blick</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Letzte 7 Tage</option>
                <option value="30d">Letzte 30 Tage</option>
                <option value="90d">Letzte 90 Tage</option>
                <option value="1y">Letztes Jahr</option>
              </select>
              <button
                onClick={fetchAllData}
                className="p-2 text-gray-300 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-zinc-700 -mb-px">
            {[
              { id: 'overview', label: 'Übersicht', icon: Target },
              { id: 'services', label: 'Services', icon: Star },
              { id: 'customers', label: 'Kunden', icon: Users },
              { id: 'timing', label: 'Stoßzeiten', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent text-gray-300 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Value Highlight */}
            <div className="bg-zinc-900 rounded-lg p-6 text-white border border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-300">Dein Erfolg mit JN Business System</h2>
                  <div className="text-3xl font-bold mt-1">
                    {metrics?.timeSavedHours || 0} Stunden gespart
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Durch {formatNumber(metrics?.totalBookings)} Online-Buchungen (ca. 5 Min. pro Anruf)
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(metrics?.totalBookings)}</div>
                    <div className="text-sm opacity-80">Buchungen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue)}</div>
                    <div className="text-sm opacity-80">Umsatz</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(metrics?.totalCustomers)}</div>
                    <div className="text-sm opacity-80">Kunden</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* This Month Bookings */}
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Buchungen (Monat)</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatNumber(metrics?.thisMonthBookings)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    (metrics?.bookingGrowth || 0) >= 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {(metrics?.bookingGrowth || 0) >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(metrics?.bookingGrowth || 0)}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">vs. Vormonat ({metrics?.lastMonthBookings || 0})</p>
              </div>

              {/* This Month Revenue */}
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Umsatz (Monat)</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(metrics?.thisMonthRevenue)}
                    </p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Ø {formatCurrency(metrics?.avgBookingValue)} pro Buchung</p>
              </div>

              {/* New Customers */}
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Neue Kunden (Monat)</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatNumber(metrics?.newCustomersThisMonth)}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">von {metrics?.totalCustomers || 0} gesamt</p>
              </div>

              {/* No-Show Rate */}
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Stornierungsrate</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {metrics?.noShowRate || 0}%
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${(metrics?.noShowRate || 0) < 10 ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    <Calendar className={`w-5 h-5 ${(metrics?.noShowRate || 0) < 10 ? 'text-green-400' : 'text-yellow-400'}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {(metrics?.noShowRate || 0) < 10 ? '✓ Sehr gut!' : 'Erinnerungen aktiviert?'}
                </p>
              </div>
            </div>

            {/* Booking Trend Chart */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Buchungsverlauf</h3>
              {trends.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {trends.map((point, idx) => {
                    const maxBookings = Math.max(...trends.map(t => t.bookings), 1);
                    const height = (point.bookings / maxBookings) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-indigo-500/30 hover:bg-indigo-500/50 rounded-t transition-colors relative group"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-zinc-700">
                          {point.bookings} Buchungen
                          <br />
                          {formatCurrency(point.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600">
                  Noch keine Daten verfügbar
                </div>
              )}
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>{trends[0]?.date || '-'}</span>
                <span>{trends[trends.length - 1]?.date || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Top Services
              </h3>
              {topServices.length > 0 ? (
                <div className="space-y-4">
                  {topServices.map((service, idx) => (
                    <div key={service.id || idx} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        idx === 1 ? 'bg-zinc-700 text-zinc-300' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white truncate">{service.name}</span>
                          <span className="text-sm text-gray-300">{service.bookings} Buchungen</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{formatCurrency(service.revenue)}</div>
                        <div className="text-xs text-gray-300">{service.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-center py-8">Noch keine Service-Daten verfügbar</p>
              )}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{customerInsights?.totalCustomers || 0}</p>
                    <p className="text-sm text-gray-300">Gesamtkunden</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Repeat className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{customerInsights?.repeatRate || 0}%</p>
                    <p className="text-sm text-gray-300">Wiederkehrend</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(customerInsights?.avgLifetimeValue)}</p>
                    <p className="text-sm text-gray-300">Ø Kundenwert</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Top Kunden</h3>
              {customerInsights?.topCustomers?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-300 border-b border-zinc-700">
                        <th className="pb-3 font-medium">Kunde</th>
                        <th className="pb-3 font-medium text-center">Buchungen</th>
                        <th className="pb-3 font-medium text-right">Umsatz</th>
                        <th className="pb-3 font-medium text-right">Letzter Besuch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInsights.topCustomers.map((customer, idx) => (
                        <tr key={idx} className="border-b border-zinc-800 last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-300">
                                {customer.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="font-medium text-white">{customer.name}</div>
                                <div className="text-xs text-gray-600">{customer.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium">
                              {customer.bookings}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium text-white">
                            {formatCurrency(customer.totalSpent)}
                          </td>
                          <td className="py-3 text-right text-sm text-gray-300">
                            {customer.lastVisit
                              ? new Date(customer.lastVisit).toLocaleDateString('de-DE')
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-300 text-center py-8">Noch keine Kundendaten verfügbar</p>
              )}
            </div>
          </div>
        )}

        {/* Timing Tab */}
        {activeTab === 'timing' && (
          <div className="space-y-6">
            {/* Peak Hours */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Buchungen nach Uhrzeit</h3>
              {peakHours.hourly?.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
                    const data = peakHours.hourly.find(h => h.hour === hour);
                    const maxBookings = Math.max(...peakHours.hourly.map(h => h.bookings), 1);
                    const height = data ? (data.bookings / maxBookings) * 100 : 0;
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full rounded-t transition-colors ${height > 60 ? 'bg-indigo-500' : height > 30 ? 'bg-indigo-400/60' : 'bg-indigo-500/30'}`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs text-gray-600 mt-2">{hour}h</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Noch keine Daten verfügbar</p>
              )}
            </div>

            {/* Peak Days */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Buchungen nach Wochentag</h3>
              {peakHours.daily?.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => {
                    const data = peakHours.daily.find(d => d.day === idx + 2 || (idx === 6 && d.day === 1));
                    const maxBookings = Math.max(...peakHours.daily.map(d => d.bookings), 1);
                    const intensity = data ? (data.bookings / maxBookings) : 0;
                    return (
                      <div key={day} className="text-center">
                        <div
                          className={`h-16 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                            intensity > 0.6 ? 'bg-indigo-500 text-white' :
                            intensity > 0.3 ? 'bg-indigo-500/50 text-indigo-200' :
                            'bg-zinc-800 text-gray-600'
                          }`}
                        >
                          {data?.bookings || 0}
                        </div>
                        <span className="text-sm text-gray-300 mt-1">{day}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Noch keine Daten verfügbar</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessMetrics;

