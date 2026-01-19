import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MapPin } from 'lucide-react';

/**
 * Separate Booking Confirmation Page
 * Shows after successful booking
 */
export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmationData, setConfirmationData] = useState(null);

  useEffect(() => {
    // Get booking data from URL params or sessionStorage
    const salonName = searchParams.get('salon') || sessionStorage.getItem('booking_salon');
    const service = searchParams.get('service') || sessionStorage.getItem('booking_service');
    const employee = searchParams.get('employee') || sessionStorage.getItem('booking_employee') || 'Wird zugewiesen';
    const date = searchParams.get('date') || sessionStorage.getItem('booking_date');
    const time = searchParams.get('time') || sessionStorage.getItem('booking_time');
    const customerName = searchParams.get('name') || sessionStorage.getItem('booking_name');
    const customerEmail = searchParams.get('email') || sessionStorage.getItem('booking_email');
    const customerPhone = searchParams.get('phone') || sessionStorage.getItem('booking_phone');

    if (salonName && service && date && time && customerName && customerEmail) {
      setConfirmationData({
        salonName,
        service,
        employee,
        date,
        time,
        customerName,
        customerEmail,
        customerPhone
      });

      // Clear sessionStorage after reading
      sessionStorage.removeItem('booking_salon');
      sessionStorage.removeItem('booking_service');
      sessionStorage.removeItem('booking_employee');
      sessionStorage.removeItem('booking_date');
      sessionStorage.removeItem('booking_time');
      sessionStorage.removeItem('booking_name');
      sessionStorage.removeItem('booking_email');
      sessionStorage.removeItem('booking_phone');
    } else {
      // If no data, redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [searchParams, navigate]);

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Lade Bestätigung...</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(confirmationData.date).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Termin erfolgreich gebucht!</h1>
          <p className="text-xl text-gray-300">
            Du erhältst eine Bestätigung per E-Mail
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Booking Details */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-green-400" />
                Deine Buchungsdetails
              </h2>

              <div className="space-y-6">
                {/* Salon */}
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Salon</p>
                    <p className="text-lg font-semibold text-white">{confirmationData.salonName}</p>
                  </div>
                </div>

                {/* Service */}
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Service</p>
                    <p className="text-lg font-semibold text-white">{confirmationData.service}</p>
                  </div>
                </div>

                {/* Employee */}
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Mitarbeiter</p>
                    <p className="text-lg font-semibold text-white">{confirmationData.employee}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Termin</p>
                    <p className="text-lg font-semibold text-green-400">
                      {formattedDate} um {confirmationData.time} Uhr
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-zinc-800 pt-8">
              <h3 className="text-xl font-bold mb-6">Deine Kontaktdaten</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Name</p>
                    <p className="font-semibold text-white">{confirmationData.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">E-Mail</p>
                    <p className="font-semibold text-white">{confirmationData.customerEmail}</p>
                  </div>
                </div>

                {confirmationData.customerPhone && (
                  <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Telefon</p>
                      <p className="font-semibold text-white">{confirmationData.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Important Info */}
            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Wichtige Informationen
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Du erhältst eine Bestätigungs-E-Mail mit allen Details</li>
                <li>• Bitte erscheine pünktlich zu deinem Termin</li>
                <li>• Bei Fragen kontaktiere bitte den Salon direkt</li>
                {confirmationData.customerPhone && (
                  <li>• Du kannst deinen Termin bis 24 Stunden vorher kostenlos stornieren</li>
                )}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-zinc-800/50 px-8 md:px-12 py-6 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/"
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-700 rounded-lg font-semibold transition text-center"
              >
                Zur Startseite
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold transition"
              >
                Bestätigung drucken
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

