import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, Euro, Loader2, MapPin, Phone } from 'lucide-react';
import { api } from '../../utils/api';

export default function PublicBookingPage() {
  const { studioSlug } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [studio, setStudio] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startTime: ''
  });

  useEffect(() => {
    const loadPublicBookingData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await api.get(`/v1/public/booking/${studioSlug}`);
        const nextStudio = response?.data?.studio || null;
        const nextServices = response?.data?.services || [];

        setStudio(nextStudio);
        setServices(nextServices);
        setSelectedServiceId(nextServices[0]?._id || '');
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Die Buchungsseite konnte nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    };

    if (studioSlug) {
      loadPublicBookingData();
    }
  }, [studioSlug]);

  const selectedService = useMemo(
    () => services.find((service) => service._id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedServiceId) {
      setSubmitError('Bitte wähle zuerst eine Dienstleistung aus.');
      return;
    }

    if (!formData.startTime) {
      setSubmitError('Bitte wähle eine Wunsch-Uhrzeit aus.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      await api.post(`/v1/public/booking/${studioSlug}/appointments`, {
        serviceId: selectedServiceId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        startTime: new Date(formData.startTime).toISOString()
      });

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Die Buchung konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-500" />
          <p className="mt-3 text-sm text-zinc-600">Buchungsseite wird geladen...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10">
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Danke für deine Buchung!</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Dein Termin wurde angefragt. Du erhältst in Kürze eine Bestätigung.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl space-y-5">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
            {studio?.businessName || 'Online-Buchung'}
          </h1>

          {studio?.address?.street || studio?.address?.city || studio?.address?.postalCode ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {[studio?.address?.street, studio?.address?.postalCode, studio?.address?.city].filter(Boolean).join(', ')}
              </p>
              {studio?.phone && (
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {studio.phone}
                </p>
              )}
            </div>
          ) : null}
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-zinc-900">1. Dienstleistung auswählen</h2>
          <div className="mt-4 space-y-3">
            {services.length === 0 ? (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Aktuell sind keine Dienstleistungen verfügbar.
              </p>
            ) : (
              services.map((service) => {
                const isSelected = selectedServiceId === service._id;

                return (
                  <button
                    key={service._id}
                    type="button"
                    onClick={() => setSelectedServiceId(service._id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-100'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-zinc-900">{service.name}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {service.duration} Min.
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Euro className="h-3.5 w-3.5" />
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(service.price || 0)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {selectedService ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-zinc-900">2. Deine Kontaktdaten & Wunschzeit</h2>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="public-booking-name" className="mb-1 block text-sm font-medium text-zinc-700">
                  Name
                </label>
                <input
                  id="public-booking-name"
                  type="text"
                  value={formData.customerName}
                  onChange={(event) => handleFormFieldChange('customerName', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="public-booking-email" className="mb-1 block text-sm font-medium text-zinc-700">
                  E-Mail
                </label>
                <input
                  id="public-booking-email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(event) => handleFormFieldChange('customerEmail', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="public-booking-phone" className="mb-1 block text-sm font-medium text-zinc-700">
                  Telefon
                </label>
                <input
                  id="public-booking-phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(event) => handleFormFieldChange('customerPhone', event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="public-booking-time" className="mb-1 block text-sm font-medium text-zinc-700">
                  Wunsch-Uhrzeit
                </label>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    id="public-booking-time"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(event) => handleFormFieldChange('startTime', event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {submitError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
              ) : null}

              <div className="pt-2">
                <p className="mb-3 text-xs text-zinc-500">
                  3. Buchung absenden
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || services.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Wird gebucht...' : 'Kostenpflichtig buchen'}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </section>
    </main>
  );
}
