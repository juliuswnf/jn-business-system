import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link, useLocation } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { FiClock, FiStar, FiInfo } from 'react-icons/fi';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

/**
 * PUBLIC BOOKING - Ohne Anmeldung
 * Unterstützt zwei Formate:
 * - /s/:slug (Route Parameter)
 * - /booking/public?salon=xyz (Query Parameter)
 */
export default function PublicBooking() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const location = useLocation();
  // Support both route param (/s/:slug) and query param (?salon=xyz)
  const salonSlug = slug || searchParams.get('salon');

  const currentPathWithQuery = `${location.pathname}${location.search || ''}`;

  const getPrefillFromUser = () => {
    if (!isAuthenticated || !user) return {};

    const fullNameFromParts = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const name = (user.name || fullNameFromParts || '').trim();
    const email = (user.email || '').trim();
    const phone = (user.phone || '').trim();

    return {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
    };
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salonInfo, setSalonInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  // Step 0 = Service, 1 = Zeit, 2 = Daten, 3 = Übersicht, 4 = Bestätigung (Erfolg)
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    customerName: getPrefillFromUser().customerName || '',
    customerEmail: getPrefillFromUser().customerEmail || '',
    customerPhone: getPrefillFromUser().customerPhone || '',
    service: '',
    serviceId: '',
    date: '',
    time: '',
    employee: '',
    employeeId: '',
  });

  const { showNotification } = useNotification();

  // Autofill contact data for logged-in users (don’t overwrite existing input)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const prefill = getPrefillFromUser();
    if (!prefill.customerName && !prefill.customerEmail && !prefill.customerPhone) return;

    setBookingData((prev) => ({
      ...prev,
      customerName: prev.customerName || prefill.customerName || '',
      customerEmail: prev.customerEmail || prefill.customerEmail || '',
      customerPhone: prev.customerPhone || prefill.customerPhone || '',
    }));
  }, [isAuthenticated, user]);

  // Default time slots (fallback)
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Fetch salon data on mount
  useEffect(() => {
    if (salonSlug) {
      fetchSalonData();
    } else {
      setLoading(false);
    }
  }, [salonSlug]);

  const fetchSalonData = async () => {
    setLoading(true);
    try {
      // Fetch salon info and services via public widget API
      const res = await fetch(`${API_URL}/bookings/public/s/${salonSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalonInfo(data.salon || { name: 'Salon' });

          // Map services
          if (data.services) {
            setServices(data.services.map(s => ({
              id: s._id,
              name: s.name,
              duration: `${s.duration || 30} min`,
              price: `${s.price || 0}€`
            })));
          }

          // Map employees if available
          if (data.employees) {
            setEmployees(data.employees.map(e => ({
              id: e._id,
              name: e.name,
              rating: e.rating || 4.5
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId && salonSlug) {
      fetchAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId]);

  const fetchAvailableSlots = async () => {
    try {
      const res = await fetch(
        `${API_URL}/bookings/public/s/${salonSlug}/available-slots`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: bookingData.date,
            serviceId: bookingData.serviceId,
            employeeId: bookingData.employeeId || undefined
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.slots) {
          setAvailableSlots(data.slots);
          setBookedSlots(data.bookedSlots || []);
          return;
        }
      }
    } catch (error) {
      // Using default slots
    }
    setAvailableSlots(defaultTimeSlots);
    setBookedSlots([]);
  };

  const timeSlots = availableSlots.length > 0 ? availableSlots : defaultTimeSlots;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (service) => {
    setBookingData(prev => ({
      ...prev,
      service: service.name,
      serviceId: service.id
    }));
  };

  const handleEmployeeSelect = (emp) => {
    setBookingData(prev => ({
      ...prev,
      employee: emp.name,
      employeeId: emp.id
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // ✅ SRE FIX #30: Generate idempotency key for double-click prevention
      const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // ✅ AUDIT FIX: Send date and time separately for timezone handling
      const res = await fetch(`${API_URL}/bookings/public/s/${salonSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          employeeId: bookingData.employeeId || undefined,
          bookingDate: {
            date: bookingData.date, // "2025-12-15"
            time: bookingData.time  // "14:00"
          },
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          idempotencyKey // ✅ SRE FIX #30
        })
      });

      if (res.ok) {
        // Show a proper confirmation window instead of toast popup
        setConfirmation({
          salonName: salonInfo?.name || 'Salon',
          service: bookingData.service,
          employee: bookingData.employee || 'Wird zugewiesen',
          date: bookingData.date,
          time: bookingData.time,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
        });
        setBookingStep(4);
      } else {
        const data = await res.json();
        showNotification(data.message || 'Fehler beim Buchen', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('Fehler beim Buchen des Termins', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-300 mt-4">Lade Buchungsoptionen...</p>
        </div>
      </div>
    );
  }

  if (!salonSlug) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Kein Salon angegeben. Bitte verwenden Sie einen gültigen Buchungslink.</p>
        </div>
      </div>
    );
  }

  const stepLabels = [
    { step: 0, label: 'Service' },
    { step: 1, label: 'Zeit' },
    { step: 2, label: 'Daten' },
    { step: 3, label: 'Bestätigung' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Neuen Termin buchen</h1>
              <p className="text-gray-300 text-sm">Wähle einen Salon und buche deinen Termin</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Ausgewählter Salon:</p>
              <p className="font-semibold">{salonInfo?.name || 'Salon'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12" id="booking-start">
        {!isAuthenticated && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-1">Mit oder ohne Anmeldung buchen</h2>
            <p className="text-sm text-gray-300 mb-4">
              Optional kannst du dich anmelden, damit deine Kontodaten automatisch übernommen werden.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/login?redirect=${encodeURIComponent(currentPathWithQuery)}`}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 transition shadow-md text-center"
              >
                Mit Anmeldung fortfahren
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('booking-start');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Ohne Anmeldung fortfahren
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar - 4 Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {stepLabels.map(({ step, label }, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                    step <= bookingStep ? 'bg-white text-black' : 'bg-zinc-800 text-gray-300'
                  }`}>
                    {step + 1}
                  </div>
                  <span className={`text-sm mt-2 ${step <= bookingStep ? 'text-white' : 'text-gray-300'}`}>
                    {label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-4 -mt-6 transition ${step < bookingStep ? 'bg-white' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: Service Selection */}
        {bookingStep === 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-1">Ausgewählter Salon</p>
              <h3 className="text-xl font-semibold">{salonInfo?.name || 'Salon'}</h3>
            </div>

            <h2 className="text-2xl font-bold mb-6">Welcher Service interessiert dich?</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {services.length === 0 ? (
                <p className="text-gray-400 col-span-2">Keine Services verfügbar</p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      bookingData.service === service.name
                        ? 'border-white bg-zinc-800'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">{service.name}</h3>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span className="flex items-center gap-2"><FiClock className="text-gray-300" /> {service.duration}</span>
                      <span className="text-white font-bold">{service.price}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {employees.length > 0 && (
              <>
                <h3 className="text-xl font-bold mb-4 mt-8">Bevorzugten Mitarbeiter wählen (optional)</h3>
                <div className="space-y-3 mb-6">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleEmployeeSelect(emp)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        bookingData.employee === emp.name
                          ? 'border-white bg-white/5'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{emp.name}</p>
                        </div>
                        {emp.rating > 0 && (
                          <div className="flex items-center text-sm text-gray-300 gap-2">
                            <FiStar className="text-yellow-400" />
                            <span>{emp.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(1)}
                disabled={!bookingData.service}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Date & Time Selection */}
        {bookingStep === 1 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-1">{salonInfo?.name || 'Salon'}</p>
              <p className="text-gray-300">{bookingData.service}</p>
            </div>

            <h2 className="text-2xl font-bold mb-6">Wann möchtest du kommen?</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Datum wählen *</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setBookingData(prev => ({ ...prev, date: dateStr, time: '' }))}
                      className={`py-3 px-2 rounded-lg font-medium transition flex flex-col items-center ${
                        bookingData.date === dateStr
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                      }`}
                    >
                      <span className="text-xs opacity-70">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs opacity-70">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Verfügbare Zeiten *</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => !isBooked && setBookingData(prev => ({ ...prev, time: slot }))}
                      disabled={isBooked}
                      className={`py-2 px-3 rounded-lg font-medium transition ${
                        isBooked
                          ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed line-through'
                          : bookingData.time === slot
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(0)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(2)}
                disabled={!bookingData.date || !bookingData.time}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Zur Übersicht
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customer Data */}
        {bookingStep === 2 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Deine Kontaktdaten</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vollständiger Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={bookingData.customerName}
                  onChange={handleInputChange}
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">E-Mail Adresse *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={bookingData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="email@beispiel.de"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefonnummer *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={bookingData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+49 XXX XXXXXXX"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 focus:outline-none transition"
                  required
                />
              </div>

              <div className="p-4 bg-zinc-800 bg-opacity-50 rounded-lg text-sm text-gray-300 flex items-start gap-3">
                <FiInfo className="mt-1" />
                <div><span className="font-semibold">Hinweis:</span> Du erhältst die Bestätigung per E‑Mail.</div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setBookingStep(1)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Zurück
              </button>
              <button
                onClick={() => setBookingStep(3)}
                disabled={!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {bookingStep === 3 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Termin-Übersicht</h2>

            <div className="space-y-4 mb-8 p-6 bg-zinc-800 bg-opacity-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-300">Salon:</span>
                <span className="font-semibold">{salonInfo?.name || 'Salon'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Name:</span>
                <span className="font-semibold">{bookingData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">E-Mail:</span>
                <span className="font-semibold">{bookingData.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Telefon:</span>
                <span className="font-semibold">{bookingData.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Service:</span>
                <span className="font-semibold">{bookingData.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Mitarbeiter:</span>
                <span className="font-semibold">{bookingData.employee || 'Wird zugewiesen'}</span>
              </div>
              <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Termin:</span>
                  <span>
                    {new Date(bookingData.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })} um {bookingData.time} Uhr
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setBookingStep(2)}
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition"
              >
                Ändern
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-50 transition shadow-md"
              >
                {submitting ? 'Wird gebucht...' : 'Termin buchen'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success Confirmation Window */}
        {bookingStep === 4 && confirmation && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-2">Termin bestätigt</h2>
            <p className="text-gray-300 mb-6">Du erhältst die Bestätigung per E-Mail.</p>

            <div className="space-y-4 mb-8 p-6 bg-zinc-800 bg-opacity-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-300">Salon:</span>
                <span className="font-semibold">{confirmation.salonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Service:</span>
                <span className="font-semibold">{confirmation.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Mitarbeiter:</span>
                <span className="font-semibold">{confirmation.employee}</span>
              </div>

              <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Termin:</span>
                  <span>
                    {new Date(confirmation.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })} um {confirmation.time} Uhr
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="font-semibold">{confirmation.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">E-Mail:</span>
                  <span className="font-semibold">{confirmation.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Telefon:</span>
                  <span className="font-semibold">{confirmation.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmation(null);
                  setBookingStep(0);
                  setBookingData({
                    customerName: getPrefillFromUser().customerName || '',
                    customerEmail: getPrefillFromUser().customerEmail || '',
                    customerPhone: getPrefillFromUser().customerPhone || '',
                    service: '',
                    serviceId: '',
                    date: '',
                    time: '',
                    employee: '',
                    employeeId: '',
                  });
                }}
                className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 transition shadow-md"
              >
                Neuen Termin buchen
              </button>
              <Link
                to="/"
                className="flex-1 px-6 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-full font-semibold transition text-center"
              >
                Zur Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
