import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { CalendarIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

const CustomerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { success, error } = useNotification();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingAPI.getMine();

      if (data?.success) {
        const now = new Date();
        const upcoming = data.bookings.filter(b => new Date(b.date) >= now);
        const past = data.bookings.filter(b => new Date(b.date) < now);
        setUpcomingBookings(upcoming);
        setPastBookings(past);
      }
    } catch (err) {
      error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm('Möchten Sie diesen Termin wirklich absagen?')) return;

    try {
      await bookingAPI.cancel(bookingId);
      success('Termin erfolgreich abgesagt');
      fetchBookings();
    } catch (err) {
      error(formatError(err));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Meine Termine</h1>
        <p className="text-sm text-gray-400 mt-1">Willkommen zurück, {user.name}!</p>
      </div>

      {/* Upcoming Bookings */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Bevorstehende Termine</h2>
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-sm text-gray-400">Lade Termine...</p>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <CalendarIcon className="h-9 w-9 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Keine bevorstehenden Termine</p>
            <Link
              to="/customer/booking"
              className="mt-3 inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Termin buchen
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingBookings.map((booking) => (
              <div key={booking._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {booking.serviceId?.name || 'Service'}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-[13px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {new Date(booking.date).toLocaleDateString('de-DE')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {new Date(booking.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelBooking(booking._id)}
                    className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Termin absagen"
                  >
                    <XCircleIcon className="h-4.5 w-4.5" style={{ height: '18px', width: '18px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Vergangene Termine</h2>
          <div className="space-y-2">
            {pastBookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="bg-gray-50/60 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-500">
                      {booking.serviceId?.name || 'Service'}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-4 text-[13px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                    Abgeschlossen
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
