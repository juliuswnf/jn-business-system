import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);

      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      try {
        // Fetch customer's bookings
        const res = await api.get('/bookings?limit=50');

        if (res.data.success && res.data.bookings) {
          const data = res.data;
            const now = new Date();

            // Split into upcoming and past
            const upcoming = data.bookings
              .filter(b => new Date(b.bookingDate) >= now && b.status !== 'cancelled' && b.status !== 'completed')
              .map(b => ({
                id: b._id,
                salon: b.salonId?.name || 'Salon',
                service: b.serviceId?.name || 'Service',
                date: new Date(b.bookingDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: b.status
              }));

            const past = data.bookings
              .filter(b => new Date(b.bookingDate) < now || b.status === 'completed' || b.status === 'cancelled')
              .map(b => ({
                id: b._id,
                salon: b.salonId?.name || 'Salon',
                service: b.serviceId?.name || 'Service',
                date: new Date(b.bookingDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: b.status
              }));

            setUpcomingBookings(upcoming);
            setPastBookings(past);
        }
      } catch (error) {
        // Error handled by UI state
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    // ? SECURITY FIX: Use central api instance
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);

      if (res.data.success) {
        // Move booking to past and update status
        setUpcomingBookings(prev => prev.filter(b => b.id !== bookingId));
        const cancelledBooking = upcomingBookings.find(b => b.id === bookingId);
        if (cancelledBooking) {
          setPastBookings(prev => [{ ...cancelledBooking, status: 'cancelled' }, ...prev]);
        }
      }
    } catch (error) {
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { label: 'Ausstehend', color: 'text-yellow-600 bg-yellow-100' },
      confirmed: { label: 'Bestätigt', color: 'text-green-600 bg-green-100' },
      completed: { label: 'Abgeschlossen', color: 'text-blue-600 bg-blue-100' },
      cancelled: { label: 'Abgesagt', color: 'text-red-600 bg-red-100' }
    };
    return statusMap[status] || { label: status, color: 'text-zinc-500 bg-gray-100' };
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Mein Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Bookings */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">Bevorstehende Termine</h2>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-zinc-700">Keine bevorstehenden Termine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="border border-zinc-200 rounded-lg p-4 hover:bg-zinc-100/30 transition">
                      <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-zinc-900">{booking.service}</p>
                        <p className="text-zinc-700">{booking.salon}</p>
                        <p className="text-zinc-400 text-sm">{booking.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                            {getStatusDisplay(booking.status).label}
                          </span>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition text-sm"
                          >
                            Absagen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">Vergangene Termine</h2>
              {pastBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-zinc-700">Keine vergangenen Termine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="border border-zinc-200 rounded-lg p-4 opacity-75">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-zinc-600">{booking.service}</p>
                          <p className="text-zinc-400">{booking.salon}</p>
                          <p className="text-zinc-500 text-sm">{booking.date}</p>
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

            {/* Profile Edit Button */}
            <div className="mt-8 text-center">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-200 text-base font-medium rounded-lg text-zinc-900 bg-white hover:bg-zinc-100 transition-colors"
              >
                Profil bearbeiten
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
