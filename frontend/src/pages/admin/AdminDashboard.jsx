import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, UsersIcon, CogIcon, CodeBracketIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    todayBookings: 0,
    upcomingBookings: 0,
    totalCustomers: 0,
    confirmedBookings: 0,
    pendingBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [setupProgress, setSetupProgress] = useState({
    hasServices: false,
    hasOpeningHours: false,
    hasAddress: false,
    hasGoogleReview: false,
    hasFirstBooking: false
  });
  const [showSetup, setShowSetup] = useState(true);
  const user = JSON.parse(localStorage.getItem('jnUser') || localStorage.getItem('user') || '{}');

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  useEffect(() => {
    fetchStats();
    fetchSetupProgress();
  }, []);

  const fetchSetupProgress = async () => {
    const token = getToken();
    if (!token) return;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Check salon info
      const salonRes = await fetch(`${API_URL}/salons/my-salon`, { headers }).catch(() => null);
      if (salonRes?.ok) {
        const salonData = await salonRes.json();
        const salon = salonData.data || salonData.salon || salonData;
        setSetupProgress(prev => ({
          ...prev,
          hasAddress: !!(salon.address?.city || salon.address?.street),
          hasOpeningHours: !!(salon.businessHours || salon.openingHours),
          hasGoogleReview: !!salon.googleReviewUrl
        }));
      }

      // Check services
      const servicesRes = await fetch(`${API_URL}/services`, { headers }).catch(() => null);
      if (servicesRes?.ok) {
        const servicesData = await servicesRes.json();
        const services = servicesData.data || servicesData.services || [];
        setSetupProgress(prev => ({
          ...prev,
          hasServices: services.length > 0
        }));
      }

      // Check bookings
      const bookingsRes = await fetch(`${API_URL}/bookings?limit=1`, { headers }).catch(() => null);
      if (bookingsRes?.ok) {
        const bookingsData = await bookingsRes.json();
        const bookings = bookingsData.bookings || bookingsData.data || [];
        setSetupProgress(prev => ({
          ...prev,
          hasFirstBooking: bookings.length > 0
        }));
      }
    } catch (error) {
      console.error('Error fetching setup progress:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    const token = getToken();
    
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch booking stats
      const statsRes = await fetch(`${API_URL}/bookings/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(prev => ({
            ...prev,
            confirmedBookings: statsData.stats?.confirmedBookings || 0,
            pendingBookings: statsData.stats?.pendingBookings || 0,
            upcomingBookings: (statsData.stats?.confirmedBookings || 0) + (statsData.stats?.pendingBookings || 0)
          }));
        }
      }

      // Fetch today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await fetch(`${API_URL}/bookings/by-date?date=${today}`, { headers });
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        if (todayData.success) {
          setStats(prev => ({
            ...prev,
            todayBookings: todayData.count || todayData.bookings?.length || 0
          }));
          setRecentBookings(todayData.bookings?.slice(0, 5) || []);
        }
      }

      // Fetch unique customers (count distinct customerEmail from bookings)
      const bookingsRes = await fetch(`${API_URL}/bookings?limit=1000`, { headers });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success) {
          const uniqueEmails = new Set(bookingsData.bookings?.map(b => b.customerEmail).filter(Boolean));
          setStats(prev => ({
            ...prev,
            totalCustomers: uniqueEmails.size
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Business Dashboard</h1>
          <p className="text-gray-400 mt-2">Willkommen, {user.name || 'Admin'}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {/* Setup Checklist */}
            {showSetup && !Object.values(setupProgress).every(v => v) && (
              <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Studio-Setup abschließen
                    </h2>
                    <p className="text-indigo-200 text-sm mt-1">
                      Schließe diese Schritte ab, um dein Studio optimal einzurichten
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowSetup(false)}
                    className="text-indigo-300 hover:text-white text-sm"
                  >
                    Ausblenden
                  </button>
                </div>
                
                <div className="grid md:grid-cols-5 gap-4">
                  <Link 
                    to="/dashboard/services"
                    className={`p-4 rounded-lg border transition ${
                      setupProgress.hasServices 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-indigo-500/30 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {setupProgress.hasServices ? (
                        <CheckCircleSolid className="w-5 h-5 text-green-400" />
                      ) : (
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-medium text-white text-sm">Services</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {setupProgress.hasServices ? 'Erledigt ✓' : 'Services hinzufügen'}
                    </p>
                  </Link>

                  <Link 
                    to="/onboarding"
                    className={`p-4 rounded-lg border transition ${
                      setupProgress.hasOpeningHours 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-indigo-500/30 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {setupProgress.hasOpeningHours ? (
                        <CheckCircleSolid className="w-5 h-5 text-green-400" />
                      ) : (
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-medium text-white text-sm">Öffnungszeiten</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {setupProgress.hasOpeningHours ? 'Erledigt ✓' : 'Zeiten festlegen'}
                    </p>
                  </Link>

                  <Link 
                    to="/onboarding"
                    className={`p-4 rounded-lg border transition ${
                      setupProgress.hasAddress 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-indigo-500/30 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {setupProgress.hasAddress ? (
                        <CheckCircleSolid className="w-5 h-5 text-green-400" />
                      ) : (
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-medium text-white text-sm">Adresse</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {setupProgress.hasAddress ? 'Erledigt ✓' : 'Standort eintragen'}
                    </p>
                  </Link>

                  <Link 
                    to="/onboarding"
                    className={`p-4 rounded-lg border transition ${
                      setupProgress.hasGoogleReview 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-indigo-500/30 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {setupProgress.hasGoogleReview ? (
                        <CheckCircleSolid className="w-5 h-5 text-green-400" />
                      ) : (
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-medium text-white text-sm">Google Reviews</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {setupProgress.hasGoogleReview ? 'Erledigt ✓' : 'Link hinzufügen'}
                    </p>
                  </Link>

                  <div 
                    className={`p-4 rounded-lg border ${
                      setupProgress.hasFirstBooking 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-black/30 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {setupProgress.hasFirstBooking ? (
                        <CheckCircleSolid className="w-5 h-5 text-green-400" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="font-medium text-white text-sm">Erste Buchung</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {setupProgress.hasFirstBooking ? 'Erledigt ✓' : 'Warte auf Kunden'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1 bg-black/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(Object.values(setupProgress).filter(v => v).length / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-indigo-200 text-sm font-medium">
                    {Object.values(setupProgress).filter(v => v).length}/5 erledigt
                  </span>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Heute</p>
                    <p className="text-3xl font-bold text-white">{stats.todayBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">Termine</p>
                  </div>
                  <CalendarIcon className="h-12 w-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Bevorstehend</p>
                    <p className="text-3xl font-bold text-white">{stats.upcomingBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">Offene Buchungen</p>
                  </div>
                  <CalendarIcon className="h-12 w-12 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Kunden</p>
                    <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
                    <p className="text-xs text-gray-500 mt-1">Eindeutige Kunden</p>
                  </div>
                  <UsersIcon className="h-12 w-12 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            {recentBookings.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Heutige Termine</h2>
                <div className="space-y-3">
                  {recentBookings.map((booking, index) => (
                    <div key={booking._id || index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{booking.customerName || 'Kunde'}</p>
                        <p className="text-sm text-gray-400">{booking.serviceId?.name || 'Service'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">
                          {new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {booking.status === 'confirmed' ? 'Bestätigt' : 
                           booking.status === 'pending' ? 'Ausstehend' : booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Schnellaktionen</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link 
                  to="/dashboard/bookings"
                  className="flex items-center p-4 border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <CalendarIcon className="h-6 w-6 text-blue-400 mr-3" />
                  <span className="font-medium text-white">Termine verwalten</span>
                </Link>

                <Link 
                  to="/dashboard/services"
                  className="flex items-center p-4 border-2 border-gray-700 rounded-lg hover:border-green-500 transition-colors"
                >
                  <CogIcon className="h-6 w-6 text-green-400 mr-3" />
                  <span className="font-medium text-white">Services bearbeiten</span>
                </Link>

                <Link 
                  to="/dashboard/customers"
                  className="flex items-center p-4 border-2 border-gray-700 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <UsersIcon className="h-6 w-6 text-purple-400 mr-3" />
                  <span className="font-medium text-white">Kunden ansehen</span>
                </Link>

                <Link 
                  to="/dashboard/widget"
                  className="flex items-center p-4 border-2 border-gray-700 rounded-lg hover:border-yellow-500 transition-colors"
                >
                  <CodeBracketIcon className="h-6 w-6 text-yellow-400 mr-3" />
                  <span className="font-medium text-white">Widget-Code</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
