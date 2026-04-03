import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, Briefcase, Plus, ArrowRight, Clock, Settings } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { OnboardingChecklist } from '../../components/dashboard';
import OnboardingTour from '../../components/onboarding/OnboardingTour';
import { useNotification } from '../../hooks/useNotification';
import { useDashboardIndustry } from '../../hooks/useDashboardIndustry';
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
import MassageDashboard from './dashboards/MassageDashboard';
import PhysiotherapyDashboard from './dashboards/PhysiotherapyDashboard';

export default function StudioDashboard() {
  const industry = useDashboardIndustry();
  const industryDashboards = {
    tattoo: TattooStudioDashboard,
    medical_aesthetics: MedicalSpaDashboard,
    spa_wellness: WellnessDashboard,
    barbershop: BarberDashboard,
    beauty: BeautyDashboard,
    nails: NailsDashboard,
    massage: MassageDashboard,
    physiotherapy: PhysiotherapyDashboard
  };

  const IndustryDashboardComponent = industryDashboards[industry];

  if (IndustryDashboardComponent) {
    return <IndustryDashboardComponent />;
  }

  return <DefaultSalonDashboard />;
}

function DefaultSalonDashboard() {
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
      showNotification('Fehler beim Laden der Kontrollpanel-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  const statCards = [
    { title: 'Heute', value: stats.todayBookings, icon: <Calendar className="w-5 h-5 text-zinc-600" /> },
    { title: 'Diese Woche', value: stats.weekBookings, icon: <Users className="w-5 h-5 text-zinc-600" /> },
    { title: 'Bewertung', value: stats.avgRating.toFixed(1), icon: <Star className="w-5 h-5 text-zinc-600" /> },
    { title: 'Services', value: stats.activeServices, icon: <Briefcase className="w-5 h-5 text-zinc-600" /> }
  ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist />
      {bookingLimits && bookingLimits.percentUsed >= 80 && (
        <div
          className={`rounded-xl border px-5 py-3.5 ${bookingLimits.percentUsed >= 100 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                {bookingLimits.percentUsed >= 100
                  ? 'Buchungslimit erreicht!'
                  : `${bookingLimits.remaining} Buchungen verbleibend`}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                {bookingLimits.used} / {bookingLimits.limit} ({bookingLimits.planType === 'trial' ? 'Testphase' : 'Plan'})
              </p>
            </div>
            <Link to="/pricing" className="text-[13px] font-medium text-zinc-900 hover:text-zinc-600">
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900">Willkommen, {studioName}</h1>
        <p className="text-sm text-zinc-500">Deine Übersicht für heute.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-500 font-medium">{card.title}</span>
              <div className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-zinc-200">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Heutige Termine</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{recentBookings.length} Buchungen</p>
          </div>
          <Link to="/dashboard/bookings" className="text-[13px] text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1">
            Alle anzeigen <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {recentBookings.length === 0 ? (
            <div className="text-sm text-zinc-400 text-center py-10">Noch keine Buchungen.</div>
          ) : isMobile ? (
            recentBookings.slice(0, 4).map((booking) => (
              <MobileBookingCard key={booking._id} booking={booking} onUpdate={fetchDashboardData} />
            ))
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-zinc-50/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 text-sm">{booking.customerName}</p>
                  <p className="text-[13px] text-zinc-500">{booking.serviceName || booking.service?.name || 'Service'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="flex items-center gap-1.5 text-sm text-zinc-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(booking.bookingDate).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="shrink-0">{getStatusBadge(booking.status)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Neuer Service', desc: 'Service hinzufügen', link: '/dashboard/services', icon: <Plus className="w-5 h-5 text-zinc-600" /> },
            { title: 'Mitarbeiter', desc: 'Team verwalten', link: '/dashboard/employees', icon: <Users className="w-5 h-5 text-zinc-600" /> },
            { title: 'Buchungs-Widget', desc: 'Online buchen', link: '/dashboard/widget', icon: <Briefcase className="w-5 h-5 text-zinc-600" /> },
            { title: 'Einstellungen', desc: 'Studio anpassen', link: '/dashboard/settings', icon: <Settings className="w-5 h-5 text-zinc-600" /> }
          ].map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{action.title}</p>
                <p className="text-xs text-zinc-400">{action.desc}</p>
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
    confirmed: { text: 'Bestätigt', bg: 'bg-emerald-50 text-emerald-700' },
    pending: { text: 'Ausstehend', bg: 'bg-amber-50 text-amber-700' },
    completed: { text: 'Abgeschlossen', bg: 'bg-blue-50 text-blue-700' },
    cancelled: { text: 'Storniert', bg: 'bg-red-50 text-red-700' },
    no_show: { text: 'Nicht erschienen', bg: 'bg-orange-50 text-orange-700' }
  };
  const badge = badges[status] || badges.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg}`}>
      {badge.text}
    </span>
  );
}
