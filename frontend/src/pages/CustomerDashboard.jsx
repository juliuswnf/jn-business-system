import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

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
      } else {
        setUpcomingBookings([]);
        setPastBookings([]);
      }
    } catch (fetchError) {
      setError('Termine konnten nicht geladen werden. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    if (cancellingBookingId) {
      return;
    }

    setActionError('');
    setCancellingBookingId(bookingId);

    // ? SECURITY FIX: Use central api instance
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);

      if (res.data.success) {
        // Move booking to past and update status
        setUpcomingBookings(prev => {
          const cancelledBooking = prev.find(b => b.id === bookingId);
          if (cancelledBooking) {
            setPastBookings(pastPrev => [{ ...cancelledBooking, status: 'cancelled' }, ...pastPrev]);
          }
          return prev.filter(b => b.id !== bookingId);
        });
      } else {
        setActionError('Termin konnte nicht abgesagt werden. Bitte versuche es erneut.');
      }
    } catch (cancelError) {
      setActionError('Termin konnte nicht abgesagt werden. Bitte versuche es erneut.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { label: 'Ausstehend', color: 'text-yellow-600 bg-yellow-100' },
      confirmed: { label: 'Bestätigt', color: 'text-green-600 bg-green-100' },
      completed: { label: 'Abgeschlossen', color: 'text-gray-700 bg-gray-100' },
      cancelled: { label: 'Abgesagt', color: 'text-red-600 bg-red-100' }
    };
    return statusMap[status] || { label: status, color: 'text-gray-500 bg-gray-100' };
  };

  if (loading) {
    return <LoadingSpinner text="Termine werden geladen..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-8">Mein Dashboard</h1>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <EmptyState
              title="Termine konnten nicht geladen werden"
              description={error}
              action={{ label: 'Erneut laden', onClick: fetchBookings }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-8">Mein Dashboard</h1>

        {actionError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        {/* Upcoming Bookings */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bevorstehende Termine</h2>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              title="Keine bevorstehenden Termine"
              description="Du hast aktuell keine bevorstehenden Buchungen."
            />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-100/30 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{booking.service}</p>
                      <p className="text-gray-700">{booking.salon}</p>
                      <p className="text-gray-400 text-sm">{booking.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(booking.status).color}`}>
                        {getStatusDisplay(booking.status).label}
                      </span>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={Boolean(cancellingBookingId)}
                        className="px-4 py-2 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        {cancellingBookingId === booking.id ? 'Wird abgesagt...' : 'Absagen'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vergangene Termine</h2>
          {pastBookings.length === 0 ? (
            <EmptyState
              title="Keine vergangenen Termine"
              description="Sobald Termine abgeschlossen oder storniert sind, erscheinen sie hier."
            />
          ) : (
            <div className="space-y-4">
              {pastBookings.map(booking => (
                <div key={booking.id} className="border border-gray-100 rounded-2xl p-4 opacity-75">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-600">{booking.service}</p>
                      <p className="text-gray-400">{booking.salon}</p>
                      <p className="text-gray-500 text-sm">{booking.date}</p>
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
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-base font-medium rounded-xl text-gray-900 bg-white hover:bg-gray-100 transition-colors"
          >
            Profil bearbeiten
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
