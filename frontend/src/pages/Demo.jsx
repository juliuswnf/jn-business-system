import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  CheckCircleIcon, 
  CalendarIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { FiClock } from 'react-icons/fi';

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

export default function Demo() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [done, setDone] = useState(false);

  const dates = generateDates();

  const formatDate = (d) => {
    const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('de-DE', { month: 'short' });
    return `${dayName}, ${dayNum}. ${monthName}`;
  };

  const handleBook = () => {
    setStep(3);
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

  const stepLabels = [
    { step: 0, label: 'Service' },
    { step: 1, label: 'Termin' },
    { step: 2, label: 'Daten' },
    { step: 3, label: 'Bestätigung' }
  ];

  return (
    <>
      <SEO
        title="Demo - Interaktive Buchungsdemo"
        description="Testen Sie unser Buchungssystem live. Erleben Sie die intuitive Terminbuchung für Ihre Kunden."
        keywords="Demo, Buchungssystem Demo, Live Demo, Terminbuchung testen"
        url="/demo"
      />
      <div className="min-h-screen bg-white text-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-20">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              So einfach buchen Ihre Kunden
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Testen Sie unser Buchungssystem live. Keine Anmeldung nötig.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left: Info Section */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* How it works */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6 text-zinc-900">So funktioniert es</h3>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Widget einbinden', desc: 'Code-Snippet auf Ihre Website kopieren' },
                    { step: 2, title: 'Services anlegen', desc: 'Behandlungen mit Preisen definieren' },
                    { step: 3, title: 'Kunden buchen', desc: '24/7 ohne Anruf oder Wartezeit' },
                    { step: 4, title: 'Automatische E-Mails', desc: 'Bestätigung und Erinnerung' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 text-black rounded-lg text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                        <div className="text-xs text-zinc-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {[
                  { title: '5 Minuten Setup', desc: 'Sofort einsatzbereit' },
                  { title: 'Mehr Google-Bewertungen', desc: 'Automatische Anfrage nach Termin' },
                  { title: 'Keine Provisionen', desc: 'Fixpreis statt Prozente' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-4 hover:border-zinc-200 transition-colors">
                    <CheckCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{b.title}</div>
                      <div className="text-xs text-zinc-500">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold mb-2 text-zinc-900">Bereit loszulegen?</h3>
                <p className="text-sm text-zinc-600 mb-5">30 Tage kostenlos testen</p>
                <Link
                  to="/register"
                  className="inline-block w-full px-6 py-3 bg-zinc-200 text-zinc-900 font-bold rounded-lg border border-zinc-300 hover:bg-zinc-300 transition-colors"
                >
                  Jetzt starten
                </Link>
              </div>
            </div>

            {/* Center: Widget Demo */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
                
                {/* Progress Bar */}
                <div className="border-b border-zinc-200 p-6">
                  <div className="flex items-center justify-center max-w-2xl mx-auto">
                    {stepLabels.map(({ step: stepNum, label }, index) => (
                      <div key={stepNum} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                            stepNum <= step ? 'bg-white text-black' : 'bg-zinc-50 text-zinc-600'
                          }`}>
                            {stepNum + 1}
                          </div>
                          <span className={`text-sm mt-2 ${stepNum <= step ? 'text-zinc-900' : 'text-zinc-600'}`}>
                            {label}
                          </span>
                        </div>
                        {index < 3 && (
                          <div className={`w-16 md:w-24 h-1 mx-2 md:mx-4 -mt-6 transition ${stepNum < step ? 'bg-white' : 'bg-zinc-50'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget Content */}
                <div className="p-8">
                  
                  {/* Step 0: Service Selection */}
                  {step === 0 && !done && (
                    <div>
                      <div className="mb-6">
                        <p className="text-sm text-zinc-600 mb-1">Ausgewählter Salon</p>
                        <h3 className="text-xl font-semibold">Muster Business</h3>
                      </div>

                      <h2 className="text-2xl font-bold mb-6">Welcher Service interessiert dich?</h2>

                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {SERVICES.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => { setService(s); setStep(1); }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                              service?.id === s.id
                                ? 'border-white bg-zinc-50'
                                : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                            }`}
                          >
                            <h3 className="font-semibold mb-2">{s.name}</h3>
                            <div className="flex justify-between text-sm text-zinc-600">
                              <span className="flex items-center gap-2">
                                <FiClock className="text-zinc-600" /> {s.duration} Min.
                              </span>
                              <span className="text-zinc-900 font-bold">{s.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(1)}
                          disabled={!service}
                          className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
                        >
                          Weiter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Date & Time Selection */}
                  {step === 1 && !done && (
                    <div>
                      <div className="mb-6">
                        <p className="text-sm text-zinc-600 mb-1">Muster Business</p>
                        <p className="text-zinc-600">{service?.name}</p>
                      </div>

                      <h2 className="text-2xl font-bold mb-6">Wann möchtest du kommen?</h2>

                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">Datum wählen *</label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {dates.map((d, i) => {
                            const dateStr = d.toISOString().split('T')[0];
                            const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const monthName = d.toLocaleDateString('de-DE', { month: 'short' });
                            return (
                              <button
                                key={i}
                                onClick={() => { setDate(d); setTime(null); }}
                                className={`py-3 px-2 rounded-lg font-medium transition flex flex-col items-center ${
                                  date?.toDateString() === d.toDateString()
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
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

                      {date && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-3">Verfügbare Zeiten *</label>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {TIMES.map((t) => (
                              <button
                                key={t}
                                onClick={() => { setTime(t); setStep(2); }}
                                className={`py-2 px-3 rounded-lg font-medium transition ${
                                  time === t
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(0)}
                          className="flex-1 px-6 py-3 border border-zinc-200 hover:bg-zinc-100 rounded-full font-semibold transition"
                        >
                          Zurück
                        </button>
                        <button
                          onClick={() => setStep(2)}
                          disabled={!date || !time}
                          className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
                        >
                          Zur Übersicht
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Customer Data */}
                  {step === 2 && !done && (
                    <div>
                      <div className="mb-6">
                        <p className="text-sm text-zinc-600 mb-1">Muster Business</p>
                        <p className="text-zinc-600">{service?.name}</p>
                      </div>

                      <h2 className="text-2xl font-bold mb-6">Deine Kontaktdaten</h2>

                      {/* Summary */}
                      <div className="bg-zinc-50 rounded-lg p-4 mb-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-zinc-600">
                            <span>Service:</span>
                            <span className="text-zinc-900">{service?.name}</span>
                          </div>
                          <div className="flex justify-between text-zinc-600">
                            <span>Datum & Zeit:</span>
                            <span className="text-zinc-900">{formatDate(date)}, {time}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-zinc-200 text-zinc-900 font-semibold">
                            <span>Gesamtpreis:</span>
                            <span>{service?.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Form */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Name *</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition"
                            placeholder="Ihr Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">E-Mail *</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition"
                            placeholder="ihre@email.de"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Telefon (optional)</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition"
                            placeholder="+49 123 456789"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 px-6 py-3 border border-zinc-200 hover:bg-zinc-100 rounded-full font-semibold transition"
                        >
                          Zurück
                        </button>
                        <button
                          onClick={handleBook}
                          disabled={!form.name || !form.email}
                          className="flex-1 px-6 py-3 bg-white text-black rounded-full font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
                        >
                          Termin buchen
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Success */}
                  {done && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-zinc-900">Termin bestätigt!</h3>
                      <p className="text-zinc-600 mb-2">
                        Bestätigung wurde an <span className="text-zinc-900 font-medium">{form.email}</span> gesendet.
                      </p>
                      <p className="text-sm text-zinc-500 mb-8">
                        Sie erhalten eine E-Mail mit allen Details zu Ihrem Termin.
                      </p>
                      <button
                        onClick={reset}
                        className="px-6 py-3 bg-zinc-50 border border-zinc-200 rounded-full text-zinc-900 hover:bg-zinc-100 transition"
                      >
                        Demo neu starten
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-xs text-zinc-400 mt-4">
                Demo – keine echte Buchung wird erstellt
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
