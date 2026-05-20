import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { noShowAPI } from '../utils/api';

export default function BookingConfirmation() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({
    success: false,
    message: '',
    booking: null
  });

  useEffect(() => {
    const confirmBooking = async () => {
      if (!token) {
        setResult({ success: false, message: 'Ungueltiger Bestaetigungslink.', booking: null });
        setLoading(false);
        return;
      }

      try {
        const response = await noShowAPI.confirmToken(token);
        setResult({
          success: response.data?.success === true,
          message: response.data?.message || 'Termin bestaetigt.',
          booking: response.data?.booking || null
        });
      } catch (error) {
        setResult({
          success: false,
          message: error.response?.data?.message || 'Bestaetigung fehlgeschlagen.',
          booking: null
        });
      } finally {
        setLoading(false);
      }
    };

    confirmBooking();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-500">Termin wird bestaetigt...</p>
        </div>
      </div>
    );
  }

  const bookingDate = result.booking?.bookingDate ? new Date(result.booking.bookingDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 py-10">
      <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${result.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            {result.success ? (
              <CheckCircle className="w-7 h-7 text-green-600" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {result.success ? 'Termin bestaetigt' : 'Bestaetigung nicht moeglich'}
          </h1>
          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
        </div>

        {result.booking && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Salon</span>
              <span className="text-sm font-semibold text-gray-900">{result.booking.salon?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Service</span>
              <span className="text-sm font-semibold text-gray-900">{result.booking.service?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> Datum</span>
              <span className="text-sm font-semibold text-gray-900">
                {bookingDate ? bookingDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Uhrzeit</span>
              <span className="text-sm font-semibold text-gray-900">
                {bookingDate ? bookingDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 px-4 py-3 text-center border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Zur Startseite
          </Link>
          <Link
            to={token ? `/booking/reschedule/${token}` : '/'}
            className="flex-1 px-4 py-3 text-center bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-black"
          >
            Termin verschieben
          </Link>
        </div>
      </div>
    </div>
  );
}
