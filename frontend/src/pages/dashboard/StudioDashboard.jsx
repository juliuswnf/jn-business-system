import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, Briefcase, Plus, ArrowRight, Clock, Settings } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { OnboardingChecklist } from '../../components/dashboard';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import { useNotification } from '../../hooks/useNotification';
import { useBusinessType } from '../../hooks/useBusinessType';
import { salonAPI, bookingAPI } from '../../utils/api';
import { useIsMobile } from '../../hooks/useMediaQuery';
import MobileBookingCard from '../../components/Dashboard/MobileBookingCard';

// Import branch-specific dashboards
import TattooStudioDashboard from './dashboards/TattooStudioDashboard';
import MedicalSpaDashboard from './dashboards/MedicalSpaDashboard';
import WellnessDashboard from './dashboards/WellnessDashboard';
import BarberDashboard from './dashboards/BarberDashboard';
import BeautyDashboard from './dashboards/BeautyDashboard';
import NailsDashboard from './dashboards/NailsDashboard';
import PetGroomingDashboard from './dashboards/PetGroomingDashboard';

export default function StudioDashboard() {
  const businessType = useBusinessType();
  const { showNotification } = useNotification();

  // Conditional routing based on business type
  if (businessType === 'tattoo-piercing') {
    return <TattooStudioDashboard />;
  }
  if (businessType === 'medical-aesthetics') {
    return <MedicalSpaDashboard />;
  }
  if (businessType === 'spa-wellness') {
    return <WellnessDashboard />;
  }
  if (businessType === 'barbershop') {
    return <BarberDashboard />;
  }
  if (businessType === 'beauty-salon') {
    return <BeautyDashboard />;
  }
  if (businessType === 'nail-salon') {
    return <NailsDashboard />;
  }
  if (businessType === 'petgrooming') {
    return <PetGroomingDashboard />;
  }

  // Default to salon dashboard

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
      showNotification('Fehler beim Laden der Dashboard-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  const statCards = [
    { title: 'Heute', value: stats.todayBookings, icon: <Calendar className="w-5 h-5 text-blue-400" /> },
    { title: 'Diese Woche', value: stats.weekBookings, icon: <Users className="w-5 h-5 text-green-600" /> },
    { title: 'Bewertung', value: stats.avgRating.toFixed(1), icon: <Star className="w-5 h-5 text-yellow-600" /> },
    { title: 'Services', value: stats.activeServices, icon: <Briefcase className="w-5 h-5 text-purple-400" /> }
  ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist />
      {bookingLimits && bookingLimits.percentUsed >= 80 && (
        <div
          className={`rounded-2xl border px-4 py-3 ${bookingLimits.percentUsed >= 100 ? 'border-red-500 bg-red-50 text-red-700' : 'border-yellow-500 bg-yellow-50 text-yellow-700'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                {bookingLimits.percentUsed >= 100
                  ? 'Buchungslimit erreicht!'
                  : `${bookingLimits.remaining} Buchungen verbleibend`}
              </p>
              <p className="text-sm text-zinc-400">
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
        <h1 className="text-2xl font-bold text-zinc-900">Willkommen, {studioName}</h1>
        <p className="text-sm text-zinc-500">Hier ist deine mobile Übersicht.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.title} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{card.title}</span>
              {card.icon}
            </div>
            <p className="text-2xl font-semibold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Heutige Termine</h2>
            <p className="text-xs text-zinc-400">{recentBookings.length} neue Buchungen</p>
          </div>
          <Link to="/dashboard/bookings" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {recentBookings.length === 0 ? (
            <div className="text-sm text-zinc-400 text-center py-6">Noch keine Buchungen.</div>
          ) : isMobile ? (
            recentBookings.slice(0, 4).map((booking) => (
              <MobileBookingCard key={booking._id} booking={booking} onUpdate={fetchDashboardData} />
            ))
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div>
                  <p className="font-semibold text-zinc-900">{booking.customerName}</p>
                  <p className="text-sm text-zinc-500">{booking.serviceName || booking.service?.name || 'Service'}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 text-sm text-zinc-600">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-zinc-400">
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
        <h2 className="text-lg font-semibold text-zinc-900">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Neuer Service', link: '/dashboard/services', icon: <Plus className="w-5 h-5 text-blue-400" /> },
            { title: 'Mitarbeiter', link: '/dashboard/employees', icon: <Users className="w-5 h-5 text-green-600" /> },
            { title: 'Widget', link: '/dashboard/widget', icon: <Briefcase className="w-5 h-5 text-purple-400" /> },
            { title: 'Einstellungen', link: '/dashboard/settings', icon: <Settings className="w-5 h-5 text-yellow-600" /> }
          ].map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center">
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-zinc-900">{action.title}</p>
                <p className="text-xs text-zinc-500">Kurzlink</p>
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
    confirmed: { text: 'Bestätigt', bg: 'bg-green-500/20 text-green-600' },
    pending: { text: 'Ausstehend', bg: 'bg-yellow-500/20 text-yellow-600' },
    completed: { text: 'Abgeschlossen', bg: 'bg-blue-500/20 text-blue-400' },
    cancelled: { text: 'Storniert', bg: 'bg-red-500/20 text-red-600' },
    no_show: { text: 'Nicht erschienen', bg: 'bg-orange-500/20 text-orange-400' }
  };
  const badge = badges[status] || badges.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg}`}>
      {badge.text}
    </span>
  );
}
