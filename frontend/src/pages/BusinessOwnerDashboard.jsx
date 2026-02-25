import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SMSUsageWidget from '../components/SMSUsageWidget';
import { api } from '../utils/api';

const BusinessOwnerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('jnUser') || localStorage.getItem('user') || '{}');
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [widgetCode, setWidgetCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    totalServices: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      try {
        
        // Fetch today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayRes = await api.get(`/bookings/by-date?date=${today}`);
        if (todayRes.data.success) {
          const todayData = todayRes.data;
          setTodaysBookings(todayData.bookings?.map(b => ({
            id: b._id,
            customer: b.customerName || 'Unbekannt',
            service: b.serviceId?.name || 'Service',
            time: new Date(b.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            status: b.status
          })) || []);
        }

        // Fetch upcoming bookings (next 7 days)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingRes = await api.get(`/bookings?startDate=${tomorrow.toISOString()}&endDate=${nextWeek.toISOString()}&limit=10`);
        if (upcomingRes.data.success) {
          const upcomingData = upcomingRes.data;
          setUpcomingBookings(upcomingData.bookings?.map(b => ({
            id: b._id,
            customer: b.customerName || 'Unbekannt',
            service: b.serviceId?.name || 'Service',
            time: new Date(b.bookingDate).toLocaleString('de-DE', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: b.status
          })) || []);
        }

        // Fetch services
        const servicesRes = await api.get('/salons/services');
        if (servicesRes.data.success) {
          const servicesData = servicesRes.data;
          setServices(servicesData.services?.map(s => ({
            id: s._id,
            name: s.name,
            price: s.price,
            duration: s.duration
          })) || []);
        }

        // Fetch booking stats
        const statsRes = await api.get('/bookings/stats');
        if (statsRes.data.success) {
          const statsData = statsRes.data;
          setStats({
            todayCount: statsData.stats?.todayBookings || todaysBookings.length,
            upcomingCount: statsData.stats?.pendingBookings || upcomingBookings.length,
            totalServices: services.length
          });
        }

        // Generate widget code based on salon slug
        if (user?.salonId) {
          const salonRes = await api.get('/salons/my-salon');
          if (salonRes.data.success && salonRes.data.salon?.slug) {
            const baseUrl = window.location.origin;
            setWidgetCode(`<iframe src="${baseUrl}/widget/${salonRes.data.salon.slug}" width="100%" height="600px" style="border: none;"></iframe>`);
          }
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { label: 'Ausstehend', color: 'bg-yellow-500/20 text-yellow-400' },
      confirmed: { label: 'Bestätigt', color: 'bg-green-500/20 text-green-400' },
      completed: { label: 'Abgeschlossen', color: 'bg-blue-500/20 text-blue-400' },
      cancelled: { label: 'Abgesagt', color: 'bg-red-500/20 text-red-400' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Mein Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {/* SMS Usage Widget (Enterprise Only) */}
            <div className="mb-8">
              <SMSUsageWidget />
            </div>

            {/* Today's Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Heutige Termine</h2>
              {todaysBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-gray-400">Keine Termine für heute</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{booking.customer}</p>
                          <p className="text-gray-400">{booking.service}</p>
                          <p className="text-gray-500 text-sm">{booking.time}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                          {getStatusDisplay(booking.status).label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Kommende Termine</h2>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-400">Keine kommenden Termine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{booking.customer}</p>
                          <p className="text-gray-400">{booking.service}</p>
                          <p className="text-gray-500 text-sm">{booking.time}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                          {getStatusDisplay(booking.status).label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services Management */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Services verwalten</h2>
              {services.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💇</div>
                  <p className="text-gray-400">Noch keine Services angelegt</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{service.name}</p>
                          <p className="text-gray-400">{service.price}€, {service.duration} Min.</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition text-sm">
                            Bearbeiten
                          </button>
                          <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm">
                            Löschen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition">
                + Service hinzufügen
              </button>
            </div>

            {/* Widget Code */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Widget Code</h2>
              <p className="text-gray-400 text-sm mb-4">Kopieren Sie diesen Code und fügen Sie ihn in Ihre Website ein:</p>
              <div className="space-y-4">
                <textarea
                  readOnly
                  value={widgetCode || 'Widget Code wird generiert...'}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm text-gray-300 resize-none"
                  rows={3}
                />
                <button
                  onClick={() => copyToClipboard(widgetCode)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:from-red-600 hover:to-orange-700 transition font-medium"
                >
                  📋 Code kopieren
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessOwnerDashboard;
