import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, Briefcase, Plus, ArrowRight, Clock, Settings } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { OnboardingChecklist } from '../../components/dashboard';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import { useNotification } from '../../hooks/useNotification';
import { salonAPI, bookingAPI } from '../../utils/api';
import { useIsMobile } from '../../hooks/useMediaQuery';
import MobileBookingCard from '../../components/Dashboard/MobileBookingCard';

export default function StudioDashboard() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    avgRating: 0,
    activeServices: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [studioName, setStudioName] = useState('Mein Studio');
  const [bookingLimits, setBookingLimits] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, bookingsResponse] = await Promise.all([
        salonAPI.getDashboard().catch(() => ({ data: {} })),
        bookingAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => ({ data: { data: [] } }))
      ]);

      if (statsResponse.data) {
        const dashboard = statsResponse.data.dashboard || statsResponse.data;
        setStats({
          todayBookings: dashboard.stats?.todayBookings || statsResponse.data.todayBookings || 0,
          weekBookings: dashboard.stats?.upcomingBookings || statsResponse.data.weekBookings || 0,
          avgRating: statsResponse.data.avgRating || 4.8,
          activeServices: dashboard.stats?.totalServices || statsResponse.data.activeServices || 0
        });
        if (dashboard.salon?.name || statsResponse.data.studioName) {
          setStudioName(dashboard.salon?.name || statsResponse.data.studioName);
        }
        if (dashboard.bookingLimits) {
          setBookingLimits(dashboard.bookingLimits);
        }
      }

      const bookings = bookingsResponse.data?.data || bookingsResponse.data?.bookings || [];
      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showNotification('Fehler beim Laden der Dashboard-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { title: 'Heute', value: stats.todayBookings, icon: <Calendar className="w-5 h-5 text-blue-400" /> },
    { title: 'Diese Woche', value: stats.weekBookings, icon: <Users className="w-5 h-5 text-green-400" /> },
    { title: 'Bewertung', value: stats.avgRating.toFixed(1), icon: <Star className="w-5 h-5 text-yellow-400" /> },
    { title: 'Services', value: stats.activeServices, icon: <Briefcase className="w-5 h-5 text-purple-400" /> }
  ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist />
      {bookingLimits && bookingLimits.percentUsed >= 80 && (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            bookingLimits.percentUsed >= 100 ? 'border-red-500 bg-red-50 text-red-700' : 'border-yellow-500 bg-yellow-50 text-yellow-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                {bookingLimits.percentUsed >= 100
                  ? '⚠️ Buchungslimit erreicht!'
                  : `⚠️ ${bookingLimits.remaining} Buchungen verbleibend`}
              </p>
              <p className="text-sm text-gray-500">
                {bookingLimits.used} / {bookingLimits.limit} ({bookingLimits.planType === 'trial' ? 'Testphase' : 'Plan'})
              </p>
            </div>
            <Link to="/pricing" className="text-sm text-blue-600 hover:underline">
              Upgrade
            </Link>
          </div>
        </div>
      )}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Willkommen, {studioName}</h1>
        <p className="text-sm text-gray-400">Hier ist deine mobile Übersicht.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{card.title}</span>
              {card.icon}
            </div>
            <p className="text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Heutige Termine</h2>
            <p className="text-xs text-gray-500">{recentBookings.length} neue Buchungen</p>
          </div>
          <Link to="/dashboard/bookings" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {recentBookings.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-6">Noch keine Buchungen.</div>
          ) : isMobile ? (
            recentBookings.slice(0, 4).map((booking) => (
              <MobileBookingCard key={booking._id} booking={booking} onUpdate={fetchDashboardData} />
            ))
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800"
              >
                <div>
                  <p className="font-semibold text-white">{booking.customerName}</p>
                  <p className="text-sm text-gray-400">{booking.serviceName || booking.service?.name || 'Service'}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 text-sm text-gray-300">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.bookingDate).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Neuer Service', link: '/dashboard/services', icon: <Plus className="w-5 h-5 text-blue-400" /> },
            { title: 'Mitarbeiter', link: '/dashboard/employees', icon: <Users className="w-5 h-5 text-green-400" /> },
            { title: 'Widget', link: '/dashboard/widget', icon: <Briefcase className="w-5 h-5 text-purple-400" /> },
            { title: 'Einstellungen', link: '/dashboard/settings', icon: <Settings className="w-5 h-5 text-yellow-400" /> }
          ].map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-white">{action.title}</p>
                <p className="text-xs text-gray-400">Kurzlink</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <OnboardingTour />
    </div>
  );
}

function getStatusBadge(status) {
  const badges = {
    confirmed: { text: 'Bestätigt', bg: 'bg-green-500/20 text-green-400' },
    pending: { text: 'Ausstehend', bg: 'bg-yellow-500/20 text-yellow-400' },
    completed: { text: 'Abgeschlossen', bg: 'bg-blue-500/20 text-blue-400' },
    cancelled: { text: 'Storniert', bg: 'bg-red-500/20 text-red-400' },
    no_show: { text: 'Nicht erschienen', bg: 'bg-orange-500/20 text-orange-400' }
  };
  const badge = badges[status] || badges.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg}`}>
      {badge.text}
    </span>
  );
}

export default function StudioDashboard() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    avgRating: 0,
    activeServices: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [studioName, setStudioName] = useState('Mein Studio');
  const [bookingLimits, setBookingLimits] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, bookingsResponse] = await Promise.all([
        salonAPI.getDashboard().catch(() => ({ data: {} })),
        bookingAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => ({ data: { data: [] } }))
      ]);

      if (statsResponse.data) {
        const dashboard = statsResponse.data.dashboard || statsResponse.data;
        setStats({
          todayBookings: dashboard.stats?.todayBookings || statsResponse.data.todayBookings || 0,
          weekBookings: dashboard.stats?.upcomingBookings || statsResponse.data.weekBookings || 0,
          avgRating: statsResponse.data.avgRating || 4.8,
          activeServices: dashboard.stats?.totalServices || statsResponse.data.activeServices || 0
        });
        if (dashboard.salon?.name || statsResponse.data.studioName) {
          setStudioName(dashboard.salon?.name || statsResponse.data.studioName);
        }
        // Set booking limits if available
        if (dashboard.bookingLimits) {
          setBookingLimits(dashboard.bookingLimits);
        }
      }

      const bookings = bookingsResponse.data?.data || bookingsResponse.data?.bookings || [];
      setRecentBookings(bookings.slice(0, 5));

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showNotification('Fehler beim Laden der Dashboard-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    const labels = {
      confirmed: 'Bestätigt',
      pending: 'Ausstehend',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-zinc-700 text-zinc-300'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Booking Limit Warning */}
      {bookingLimits && bookingLimits.percentUsed >= 80 && (
        <div className={`mb-6 p-4 rounded-xl border ${
          bookingLimits.percentUsed >= 100
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${bookingLimits.percentUsed >= 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                {bookingLimits.percentUsed >= 100
                  ? '⚠️ Buchungslimit erreicht!'
                  : `⚠️ ${bookingLimits.remaining} Buchungen verbleibend`}
              </h3>
              <p className="text-sm text-zinc-300 mt-1">
                {bookingLimits.used} von {bookingLimits.limit} Buchungen diesen Monat
                ({bookingLimits.planType === 'trial' ? 'Testphase' : 'Starter Plan'})
              </p>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition"
              aria-label="Auf Pro Plan upgraden - Preise ansehen"
            >
              Auf Pro upgraden
            </a>
          </div>
          <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${bookingLimits.percentUsed >= 100 ? 'bg-red-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(100, bookingLimits.percentUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
          Willkommen, {studioName}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Hier ist deine Übersicht für heute
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Buchungen heute</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.todayBookings}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Diese Woche</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.weekBookings}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Bewertung</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.avgRating.toFixed(1)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-1">Aktive Services</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{stats.activeServices}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-white">Letzte Buchungen</h2>
            <Link
              to="/dashboard/bookings"
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              Alle anzeigen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Noch keine Buchungen</p>
                <p className="text-zinc-500 text-sm mt-1">Buchungen erscheinen hier automatisch</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking._id} className="p-4 md:p-5 hover:bg-zinc-800/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {booking.customerName || booking.customer?.name || 'Kunde'}
                      </p>
                      <p className="text-sm text-zinc-400 truncate">
                        {booking.serviceName || booking.service?.name || 'Service'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-sm text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.date ? new Date(booking.date).toLocaleDateString('de-DE') : '-'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {booking.time || booking.startTime || '-'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Schnellaktionen</h2>

          <div className="space-y-3">
            <Link
              to="/dashboard/services"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Neuer Service</p>
                <p className="text-xs text-zinc-400">Service hinzufügen</p>
              </div>
            </Link>

            <Link
              to="/dashboard/employees"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">Mitarbeiter</p>
                <p className="text-xs text-zinc-400">Team verwalten</p>
              </div>
            </Link>

            <Link
              to="/dashboard/widget"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition">
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Widget Setup</p>
                <p className="text-xs text-zinc-400">Buchungs-Widget einrichten</p>
              </div>
            </Link>

            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition">
                <Settings className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-white">Einstellungen</p>
                <p className="text-xs text-zinc-400">Studio konfigurieren</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Tour - shows only for new users */}
      <OnboardingTour />
    </div>
  );
}
