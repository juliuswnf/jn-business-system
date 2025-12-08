import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Home() {
  const [activeService, setActiveService] = useState(0);
  const services = [
    { name: 'Haarschnitt Damen', duration: '45 Min', price: '45€' },
    { name: 'Färben komplett', duration: '120 Min', price: '85€' },
    { name: 'Balayage', duration: '150 Min', price: '120€' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Large with Preview */}
      <section className="min-h-[90vh] flex items-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Online-Buchungssystem für Salons
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-lg">
                Kunden buchen Termine direkt über Ihre Website. 
                Automatische Erinnerungen, einfache Verwaltung, faire Preise.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-center"
                >
                  30 Tage kostenlos testen
                </Link>
                <Link
                  to="/demo"
                  className="px-8 py-4 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-900 transition text-center"
                >
                  Demo ansehen
                </Link>
              </div>
              
              <p className="text-sm text-gray-500">
                Keine Kreditkarte erforderlich · Jederzeit kündbar
              </p>
            </div>

            {/* Right: Animated Preview Widget */}
            <div className="hidden lg:block">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                {/* Widget Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">MS</span>
                  </div>
                  <div>
                    <div className="font-semibold">Muster Salon</div>
                    <div className="text-xs text-gray-500">Online Terminbuchung</div>
                  </div>
                </div>

                {/* Service Selection - Animated */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 mb-3">Behandlung wählen</div>
                  <div className="space-y-2">
                    {services.map((service, i) => (
                      <div 
                        key={i}
                        className={`p-4 rounded-lg border transition-all duration-500 ${
                          activeService === i 
                            ? 'border-white bg-zinc-800' 
                            : 'border-zinc-800 bg-zinc-900/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-medium transition-colors ${activeService === i ? 'text-white' : 'text-gray-400'}`}>
                              {service.name}
                            </div>
                            <div className="text-xs text-gray-500">{service.duration}</div>
                          </div>
                          <div className={`font-semibold transition-colors ${activeService === i ? 'text-white' : 'text-gray-500'}`}>
                            {service.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Preview */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 mb-3">Verfügbare Termine</div>
                  <div className="flex gap-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((day, i) => (
                      <div 
                        key={day}
                        className={`flex-1 py-3 rounded-lg text-center text-sm transition-all duration-300 ${
                          i === 2 ? 'bg-white text-black font-medium' : 'bg-zinc-800 text-gray-400'
                        }`}
                      >
                        <div className="text-xs opacity-70">{day}</div>
                        <div className="font-medium">{10 + i}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full py-3 bg-white text-black font-medium rounded-lg">
                  Termin buchen
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">So funktioniert es</h2>
          <p className="text-gray-500 text-center mb-16 max-w-2xl mx-auto">
            In nur 3 Schritten zu Ihrem eigenen Online-Buchungssystem
          </p>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                1
              </div>
              <h3 className="font-semibold text-lg mb-3">Account erstellen</h3>
              <p className="text-gray-500">
                Registrieren Sie sich kostenlos und richten Sie Ihr Studio in wenigen Minuten ein.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                2
              </div>
              <h3 className="font-semibold text-lg mb-3">Services eintragen</h3>
              <p className="text-gray-500">
                Fügen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                3
              </div>
              <h3 className="font-semibold text-lg mb-3">Buchungen empfangen</h3>
              <p className="text-gray-500">
                Kunden buchen über Ihre Website, Sie verwalten alles im Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Warum JN Business System?</h2>
              <p className="text-gray-500 mb-8">
                Alles was Sie brauchen, um Ihr Termingeschäft zu digitalisieren.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'Keine Provisionen', desc: 'Sie zahlen nur den monatlichen Festpreis. Keine versteckten Gebühren pro Buchung.' },
                  { title: 'Automatische Erinnerungen', desc: 'Kunden erhalten automatisch Termin-Erinnerungen per E-Mail. Weniger No-Shows.' },
                  { title: 'Einfaches Widget', desc: 'Ein Code-Snippet auf Ihrer Website und Kunden können direkt buchen.' },
                  { title: 'Google Bewertungen', desc: 'Nach jedem Termin wird automatisch um eine Google-Bewertung gebeten.' },
                  { title: 'DSGVO-konform', desc: 'Server in Deutschland, alle Daten sicher und datenschutzkonform gespeichert.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-gray-500 text-sm">Aktive Salons</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">50k+</div>
                  <div className="text-gray-500 text-sm">Buchungen/Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">4.9</div>
                  <div className="text-gray-500 text-sm">Bewertung</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">2h</div>
                  <div className="text-gray-500 text-sm">Zeit gespart/Tag</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Einfache Preisgestaltung</h2>
          <p className="text-gray-500 mb-12">
            Ab 49€ pro Monat. Keine versteckten Kosten, keine Provisionen.
          </p>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-lg mx-auto">
            <div className="text-5xl font-bold mb-2">ab 49€</div>
            <div className="text-gray-500 mb-8">pro Monat</div>
            <ul className="text-left space-y-4 mb-10">
              {['Online-Buchungen', 'E-Mail-Erinnerungen', 'Eigenes Buchungswidget', '30 Tage kostenlos testen'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="block w-full py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-center"
            >
              Alle Tarife ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-gray-500 mb-8 text-lg">
            Testen Sie JN Business System 30 Tage kostenlos. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition text-lg"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
