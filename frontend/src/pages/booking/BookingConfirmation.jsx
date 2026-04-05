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
    const date = searchParams.get('date') || sessionStorage.getItem('booking_date');
    const time = searchParams.get('time') || sessionStorage.getItem('booking_time');
    const customerName = searchParams.get('name') || sessionStorage.getItem('booking_name');
    const customerEmail = searchParams.get('email') || sessionStorage.getItem('booking_email');
    const customerPhone = searchParams.get('phone') || sessionStorage.getItem('booking_phone');

    if (salonName && service && date && time && customerName && customerEmail) {
      setConfirmationData({
        salonName,
        service,
        date,
        time,
        customerName,
        customerEmail,
        customerPhone
      });

      // Clear sessionStorage after reading
      sessionStorage.removeItem('booking_salon');
      sessionStorage.removeItem('booking_service');
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
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Bestätigung...</p>
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Success Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 border border-green-100 rounded-2xl mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">Termin erfolgreich gebucht!</h1>
          <p className="text-gray-500">
            Du erhältst eine Bestätigung per E-Mail
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm shadow-sm overflow-hidden">
          {/* Booking Details */}
          <div className="p-4 md:p-8 lg:p-12">
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-green-600" />
                Deine Buchungsdetails
              </h2>

              <div className="space-y-6">
                {/* Salon */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Salon</p>
                    <p className="text-lg font-semibold text-gray-900">{confirmationData.salonName}</p>
                  </div>
                </div>

                {/* Service */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Service</p>
                    <p className="text-lg font-semibold text-gray-900">{confirmationData.service}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <Clock className="w-5 h-5 text-gray-900 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Termin</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formattedDate} um {confirmationData.time} Uhr
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-bold mb-6">Deine Kontaktdaten</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{confirmationData.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">E-Mail</p>
                    <p className="font-semibold text-gray-900">{confirmationData.customerEmail}</p>
                  </div>
                </div>

                {confirmationData.customerPhone && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Telefon</p>
                      <p className="font-semibold text-gray-900">{confirmationData.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Important Info */}
            <div className="mt-8 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-600" />
                Wichtige Informationen
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
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
          <div className="bg-white px-4 md:px-8 lg:px-12 py-4 md:py-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/"
                className="flex-1 px-5 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-gray-700 transition text-center text-sm"
              >
                Zur Startseite
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm transition"
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

