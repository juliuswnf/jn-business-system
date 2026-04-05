import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Clock, Check } from 'lucide-react';

const SERVICES = [
  { id: 1, name: 'Beratung Standard', duration: 45, price: '45€' },
  { id: 2, name: 'Beratung Express', duration: 30, price: '28€' },
  { id: 3, name: 'Behandlung Komplett', duration: 120, price: '85€' },
  { id: 4, name: 'Premium Behandlung', duration: 150, price: '120€' },
  { id: 5, name: 'Basis Service', duration: 30, price: '25€' },
];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

const stepLabels = ['Service', 'Zeit', 'Daten', 'Bestätigung'];

export default function Demo() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [done, setDone] = useState(false);
  const dates = generateDates();

  const formatDate = (d) => {
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleBook = () => {
    setDone(true);
  };

  const reset = () => {
    setStep(0);
    setService(null);
    setDate(null);
    setTime(null);
    setForm({ name: '', email: '', phone: '' });
    setDone(false);
  };

  const currentStep = done ? 3 : step;

  return (
    <>
      <SEO
        title="Demo - Interaktive Buchungsdemo"
        description="Testen Sie unser Buchungssystem live. Erleben Sie die intuitive Terminbuchung für Ihre Kunden."
        keywords="Demo, Buchungssystem Demo, Live Demo, Terminbuchung testen"
        url="/demo"
      />
      <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-16">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-5">
              Live Demo
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              So buchen Ihre Kunden
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Testen Sie das Buchungssystem live – genau so erleben es Ihre Kunden.
            </p>
          </div>

          {/* Booking Widget */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

            {/* Step indicator */}
            <div className="border-b border-gray-100 px-8 py-5">
              <div className="flex items-center justify-center gap-0">
                {stepLabels.map((label, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        index < currentStep
                          ? 'bg-gray-900 text-white'
                          : index === currentStep
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index < currentStep ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className={`w-12 md:w-20 h-px mx-2 mb-5 transition-colors ${index < currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Content */}
            <div className="p-8">

              {/* Salon badge */}
              {!done && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-600">M</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">Muster Business</p>
                    <p className="text-xs text-gray-400">Demo-Buchung</p>
                  </div>
                </div>
              )}

              {/* Step 0: Service */}
              {step === 0 && !done && (
                <div>
                  <h2 className="text-xl font-semibold tracking-tight mb-5">Welchen Service möchtest du buchen?</h2>
                  <div className="grid md:grid-cols-2 gap-3 mb-6">
                    {SERVICES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setService(s)}
                        className={`text-left p-4 rounded-xl border transition ${
                          service?.id === s.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="font-medium text-gray-900 mb-2">{s.name}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> {s.duration} Min.
                          </span>
                          <span className="font-semibold text-gray-900">{s.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    disabled={!service}
                    className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition"
                  >
                    Weiter
                  </button>
                </div>
              )}

              {/* Step 1: Zeit */}
              {step === 1 && !done && (
                <div>
                  <h2 className="text-xl font-semibold tracking-tight mb-1">Wann möchtest du kommen?</h2>
                  <p className="text-sm text-gray-400 mb-6">{service?.name} · {service?.duration} Min.</p>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Datum wählen</p>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {dates.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => { setDate(d); setTime(null); }}
                          className={`py-2.5 px-1 rounded-xl text-center transition flex flex-col items-center ${
                            date?.toDateString() === d.toDateString()
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="text-xs opacity-70">{d.toLocaleDateString('de-DE', { weekday: 'short' })}</span>
                          <span className="text-base font-semibold">{d.getDate()}</span>
                          <span className="text-xs opacity-70">{d.toLocaleDateString('de-DE', { month: 'short' })}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {date && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-3">Uhrzeit wählen</p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {TIMES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTime(t)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium transition ${
                              time === t
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(0)}
                      className="flex-1 px-5 py-3 border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!date || !time}
                      className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Daten */}
              {step === 2 && !done && (
                <div>
                  <h2 className="text-xl font-semibold tracking-tight mb-1">Deine Kontaktdaten</h2>
                  <p className="text-sm text-gray-400 mb-6">{service?.name} · {date && formatDate(date)} · {time}</p>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-gray-900">{service?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Datum & Zeit</span>
                      <span className="font-medium text-gray-900">{date && formatDate(date)}, {time}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-700">Gesamt</span>
                      <span className="font-semibold text-gray-900">{service?.price}</span>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition text-sm"
                        placeholder="Dein Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition text-sm"
                        placeholder="deine@email.de"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition text-sm"
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-5 py-3 border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleBook}
                      disabled={!form.name || !form.email}
                      className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition"
                    >
                      Termin buchen
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Bestätigung */}
              {done && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Check size={22} className="text-green-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-2 text-gray-900">Termin bestätigt!</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    Bestätigung wurde an <span className="font-medium text-gray-700">{form.email}</span> gesendet.
                  </p>
                  <p className="text-xs text-gray-400 mb-8">
                    Du erhältst eine E-Mail mit allen Details zu deinem Termin.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-left max-w-xs mx-auto space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-gray-900">{service?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Datum</span>
                      <span className="font-medium text-gray-900">{date && formatDate(date)}, {time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preis</span>
                      <span className="font-semibold text-gray-900">{service?.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="px-5 py-2.5 border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Demo neu starten
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Demo – keine echte Buchung wird erstellt
          </p>

          {/* CTA */}
          <div className="mt-14 border border-gray-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Bereit loszulegen?</h2>
            <p className="text-gray-500 mb-6 text-sm">14 Tage Enterprise kostenlos – kein Kreditkarte erforderlich.</p>
            <Link
              to="/register"
              className="inline-block px-7 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-900 transition text-sm"
            >
              Jetzt kostenlos starten
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
