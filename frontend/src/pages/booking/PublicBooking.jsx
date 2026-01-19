import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { FiInfo } from 'react-icons/fi';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentMethodStep from '../../components/Booking/PaymentMethodStep';
import { useIsMobile } from '../../hooks/useMediaQuery';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
  const navigate = useNavigate();
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
  // Step 0 = Service, 1 = Zeit, 2 = Daten, 3 = Übersicht
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
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [noShowKillerEnabled, setNoShowKillerEnabled] = useState(false);
  const [noShowFeeAmount, setNoShowFeeAmount] = useState(15);

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
      // ✅ SRE FIX #30: Generate idempotency key for double-click prevention using crypto
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      const idempotencyKey = `booking-${Date.now()}-${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;

      // ✅ AUDIT FIX: Send date and time separately for timezone handling
      // Prepare request body
      const requestBody = {
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
      };

      // Add payment method if No-Show-Killer is enabled
      if (noShowKillerEnabled && paymentMethodId) {
        requestBody.paymentMethodId = paymentMethodId;
        requestBody.gdprConsentAccepted = true;
        requestBody.noShowFeeAcceptance = {
          accepted: true,
          terms: `NO-SHOW-GEBÜHR RICHTLINIE\n\nBei Nichterscheinen wird eine Gebühr von €${noShowFeeAmount} automatisch von Ihrer hinterlegten Kreditkarte abgebucht. Sie können kostenlos stornieren, wenn Sie dies mindestens 24 Stunden vorher tun.`,
          checkboxText: `Ich akzeptiere die No-Show-Gebühr von €${noShowFeeAmount} bei Nichterscheinen und habe die Richtlinie gelesen.`
        };
      }

      const res = await fetch(`${API_URL}/bookings/public/s/${salonSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        // Store confirmation data in sessionStorage and navigate to confirmation page
        const confirmationData = {
          salon: salonInfo?.name || 'Salon',
          service: bookingData.service,
          employee: bookingData.employee || 'Wird zugewiesen',
          date: bookingData.date,
          time: bookingData.time,
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
        };

        // Store in sessionStorage as fallback
        Object.entries(confirmationData).forEach(([key, value]) => {
          sessionStorage.setItem(`booking_${key}`, value);
        });

        // Navigate to confirmation page with URL params
        const params = new URLSearchParams(confirmationData).toString();
        navigate(`/booking/confirmation?${params}`);
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

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6 md:mb-8 overflow-x-auto px-2">
      {stepLabels.map((step, index) => (
        <div key={step.step} className="flex items-center min-w-0">
          <div className="flex items-center">
            <div
              className={`
                flex items-center justify-center
                h-8 w-8 md:h-10 md:w-10
                rounded-full
                text-sm md:text-base
                transition
                ${bookingStep === step.step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
              `}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-xs md:text-sm hidden sm:inline">{step.label}</span>
          </div>
          {index < stepLabels.length - 1 && (
            <div className="w-8 md:w-12 h-px bg-gray-300 mx-2" />
          )}
        </div>
      ))}
    </div>
  );

  const DateTimeSection = () => {
    const isMobile = useIsMobile();
    const upcomingDates = useMemo(() => {
      return Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
      });
    }, []);

    const handleDateSelect = (date) => {
      setBookingData(prev => ({
        ...prev,
        date,
        time: ''
      }));
    };

    const handleTimeSelect = (slot) => {
      setBookingData(prev => ({
        ...prev,
        time: slot
      }));
    };

    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <div className="order-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Datum wählen *</p>
              <h3 className="text-lg md:text-xl font-semibold">Kalender</h3>
            </div>
            <span className="text-xs text-gray-400">{salonInfo?.name || 'Salon'}</span>
          </div>
          {isMobile ? (
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={bookingData.date}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full p-4 text-lg border-2 rounded-2xl bg-white focus:border-blue-500 transition touch-manipulation"
            />
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {upcomingDates.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
                const isActive = bookingData.date === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(dateStr)}
                    className={`flex flex-col items-center rounded-2xl text-center px-2 py-3 text-sm transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider">{dayName}</span>
                    <span className="text-lg font-bold">{dayNum}</span>
                    <span className="text-xs text-gray-500">{monthName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="order-2">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Zeit auswählen *</p>
            <h3 className="text-lg md:text-xl font-semibold">Verfügbare Slots</h3>
          </div>
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 max-h-96 overflow-y-auto">
            {timeSlots.map(slot => {
              const isBooked = bookedSlots.includes(slot);
              const isSelected = bookingData.time === slot;
              return (
                <button
                  key={slot}
                  onClick={() => !isBooked && handleTimeSelect(slot)}
                  disabled={isBooked}
                  className={`
                    rounded-2xl px-3 py-2 text-sm md:text-base transition
                    ${isBooked ? 'bg-gray-200 text-gray-400 line-through' : ''}
                    ${isSelected && !isBooked ? 'bg-blue-600 text-white' : isBooked ? '' : 'bg-white border border-gray-200 hover:border-blue-500'}
                  `}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const BookingActions = () => (
    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
      {bookingStep > 0 && (
        <button
          onClick={() => setBookingStep(prev => Math.max(prev - 1, 0))}
          className="w-full sm:w-auto py-3 text-base font-semibold rounded-2xl border border-gray-300 bg-white text-black hover:bg-gray-100 touch-manipulation"
        >
          Zurück
        </button>
      )}
      <button
        onClick={() => {
          if (bookingStep === 3) {
            handleSubmit();
          } else {
            setBookingStep(prev => prev + 1);
          }
        }}
        disabled={
          (bookingStep === 0 && !bookingData.service) ||
          (bookingStep === 1 && (!bookingData.date || !bookingData.time)) ||
          (bookingStep === 2 && (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone)) ||
          submitting
        }
        className="w-full sm:w-auto py-3 text-base font-semibold rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
      >
        {bookingStep === 3 ? (submitting ? 'Wird gebucht...' : 'Termin buchen') : 'Weiter'}
      </button>
    </div>
  );

  const ServiceGrid = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {services.map(service => {
        const isSelected = bookingData.serviceId === service.id;
        return (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`
              w-full text-left rounded-2xl p-4 md:p-5 shadow-sm transition
              ${isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-200 bg-white hover:border-blue-500'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base md:text-lg font-semibold">{service.name}</h3>
              <span className="text-sm text-gray-500">{service.duration}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{service.description || 'Beschreibung folgt'}</p>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-500">Dauer</span>
              <span className="font-semibold text-blue-600">{service.price}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10 lg:px-12 lg:py-12 text-gray-900">
      <div className="w-full mx-auto max-w-full md:max-w-4xl space-y-6">
        <header className="bg-black text-white rounded-2xl border border-zinc-800 shadow-lg p-6 md:p-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Öffentlicher Termin</p>
              <h1 className="text-3xl font-bold">Neuen Termin buchen</h1>
              <p className="text-sm text-gray-300 mt-1">Wähle deinen Wunsch-Salon und buche in wenigen Schritten.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Ausgewählter Salon</p>
              <p className="text-lg font-semibold">{salonInfo?.name || 'Salon'}</p>
            </div>
          </div>
          {!isAuthenticated && (
            <div className="bg-zinc-900 bg-opacity-70 border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/login?redirect=${encodeURIComponent(currentPathWithQuery)}`}
                className="flex-1 text-center px-4 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 touch-manipulation"
              >
                Mit Anmeldung fortfahren
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('booking-start');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex-1 text-center px-4 py-3 border border-zinc-700 text-white rounded-full font-semibold hover:bg-zinc-900 touch-manipulation"
              >
                Ohne Anmeldung fortfahren
              </button>
            </div>
          )}
        </header>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8" id="booking-start">
          <StepIndicator />

          {bookingStep === 0 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Salon</p>
                <h2 className="text-2xl font-semibold">{salonInfo?.name || 'Salon'}</h2>
                <p className="text-sm text-gray-500">{salonInfo?.address?.street || 'Adresse folgt'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Welcher Service interessiert dich?</h3>
                  <span className="text-sm text-gray-500">{services.length} Services verfügbar</span>
                </div>
                <ServiceGrid />
              </div>

              {employees.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Bevorzugter Mitarbeiter (optional)</h3>
                    <span className="text-sm text-gray-500">({employees.length} verfügbar)</span>
                  </div>
                  <div className="space-y-2">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleEmployeeSelect(emp)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition border ${
                          bookingData.employeeId === emp.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 hover:border-blue-500 bg-white'
                        }`}
                      >
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-sm text-gray-500">{emp.rating ? emp.rating.toFixed(1) : '⭐'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {bookingStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <h2 className="text-2xl font-bold">{bookingData.service || 'Bitte wählen'}</h2>
                </div>
                <button
                  onClick={() => setBookingStep(0)}
                  className="text-sm text-blue-500 underline"
                >
                  Service ändern
                </button>
              </div>
              <DateTimeSection />
              <BookingActions />
            </div>
          )}

          {bookingStep === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Termin</p>
                <h2 className="text-2xl font-bold">
                  {bookingData.date ? `${new Date(bookingData.date).toLocaleDateString('de-DE')} um ${bookingData.time}` : 'Datum & Uhrzeit auswählen'}
                </h2>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600">Vollständiger Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={bookingData.customerName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600">E-Mail Adresse *</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={bookingData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="email@beispiel.de"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600">Telefonnummer *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={bookingData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base focus:border-blue-500 focus:outline-none touch-manipulation"
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-sm text-blue-700">
                <FiInfo className="mt-1 text-blue-600" />
                <p>Du erhältst die Buchungsbestätigung direkt per E-Mail.</p>
              </div>
              <BookingActions />
            </div>
          )}

          {bookingStep === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Dein Termin</p>
                <h2 className="text-2xl font-bold">Übersicht & Zahlung</h2>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                  <p className="text-sm text-gray-500">Salon</p>
                  <p className="font-semibold">{salonInfo?.name || 'Salon'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-semibold">{bookingData.service}</p>
                  <p className="text-sm text-gray-500">Mitarbeiter</p>
                  <p className="font-semibold">{bookingData.employee || 'Wird zugewiesen'}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                <p className="text-sm text-gray-500">Kontaktdaten</p>
                <p className="font-semibold">{bookingData.customerName}</p>
                <p className="text-sm text-gray-500">{bookingData.customerEmail}</p>
                <p className="text-sm text-gray-500">{bookingData.customerPhone}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                <p className="text-sm text-gray-500">Termin</p>
                <p className="font-semibold">
                  {bookingData.date ? `${new Date(bookingData.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}` : '-'}{' '}
                  um {bookingData.time || '-'} Uhr
                </p>
              </div>
              <Elements stripe={stripePromise}>
                <PaymentMethodStep
                  onComplete={(methodId) => setPaymentMethodId(methodId)}
                  onBack={() => setBookingStep(2)}
                  feeAmount={noShowFeeAmount}
                  loading={submitting}
                  salonName={salonInfo?.name}
                />
              </Elements>
              <BookingActions />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
