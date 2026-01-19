import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';

const BookingAction = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') === 'cancel' ? 'cancel' : 'confirm';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/token/${token}`);
        if (res.data.success) {
          setBooking(res.data.booking);
        } else {
          setResult({ success: false, message: res.data.message || 'Buchung nicht gefunden.' });
        }
      } catch (error) {
        setResult({ success: false, message: 'Buchung konnte nicht geladen werden.' });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const endpoint = action === 'cancel' ? `/bookings/cancel/${token}` : `/bookings/confirm/${token}`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        setResult(res.data);
      } else {
        setResult({ success: false, message: res.data.message || 'Aktion fehlgeschlagen' });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Netzwerkfehler. Bitte teste den Link später erneut.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const actionLabel = action === 'cancel' ? 'Termin stornieren' : 'Termin bestätigen';
  const actionHint =
    action === 'cancel'
      ? 'Mit einem Klick storniert du den Termin. Bitte bestätige die Stornierung.'
      : 'Bestätige deinen Termin, wenn du erscheinen möchtest.';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full mx-auto max-w-lg bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-2">Terminaktion</p>
          <h1 className="text-2xl font-bold text-gray-900">{actionLabel}</h1>
          <p className="text-sm text-gray-500 mt-1">{actionHint}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Salon</span>
            <span className="font-semibold text-gray-800">{booking?.salon?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Service</span>
            <span className="font-semibold text-gray-800">{booking?.service?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Datum</span>
            <span className="font-semibold text-gray-800">
              {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Uhrzeit</span>
            <span className="font-semibold text-gray-800">
              {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Kunde</span>
            <span className="font-semibold text-gray-800">{booking?.customerName || '—'}</span>
          </div>
        </div>

        {loading && (
          <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center text-sm text-gray-500">
            Lade Buchungsdaten…
          </div>
        )}

        {result && (
          <div
            className={`p-4 rounded-2xl border ${
              result.success ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            <p className="font-semibold">{result.success ? 'Erfolgreich' : 'Fehler'}</p>
            <p className="text-sm mt-1">{result.message || 'Action abgeschlossen.'}</p>
          </div>
        )}

        {!loading && !result && (
          <button
            onClick={handleAction}
            disabled={actionLoading || !booking}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Wird verarbeitet…' : actionLabel}
          </button>
        )}

        <div className="text-center text-sm text-gray-500">
          <Link to="/" className="text-blue-500 hover:underline">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingAction;

