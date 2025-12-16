import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JN Business System",
    "description": "Online-Buchungssystem für Unternehmen mit automatischen Terminbestätigungen und No-Show-Killer",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "29",
      "priceCurrency": "EUR",
      "priceValidUntil": "2025-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  return (
    <>
      <SEO
        title="Online-Buchungssystem für Unternehmen"
        description="Automatische Terminbuchungen für Dienstleister aller Branchen. 30 Tage kostenlos testen. No-Show-Killer inklusive."
        keywords="Online Buchungssystem, Terminvereinbarung, Business Software, Unternehmensverwaltung, No-Show-Killer"
        url="/"
        structuredData={structuredData}
      />
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Large with Preview */}
      <section className="min-h-[90vh] flex items-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Online-Buchungssystem für Ihr Unternehmen
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-lg">
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

              <p className="text-sm text-gray-300">
                Keine Kreditkarte erforderlich · Jederzeit kündbar
              </p>
            </div>

            {/* Right: Dashboard Preview - Simple Version */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-zinc-800 px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-sm">JN</span>
                      </div>
                      <span className="font-medium">Mein Dashboard</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">47</div>
                        <div className="text-xs text-gray-300">Buchungen</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">€2.340</div>
                        <div className="text-xs text-gray-300">Umsatz</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold">4.8</div>
                        <div className="text-xs text-gray-300">Bewertung</div>
                      </div>
                    </div>

                    {/* Bookings List */}
                    <div>
                      <div className="text-sm text-gray-200 mb-3">Heutige Termine</div>
                      <div className="space-y-2">
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">MH</div>
                            <div>
                              <div className="font-medium">Maria H.</div>
                              <div className="text-sm text-gray-300">Beratung · 10:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Bestätigt</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">SK</div>
                            <div>
                              <div className="font-medium">Sophie K.</div>
                              <div className="text-sm text-gray-300">Behandlung · 14:00 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">Neu</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">LM</div>
                            <div>
                              <div className="font-medium">Lisa M.</div>
                              <div className="text-sm text-gray-300">Termin · 16:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Bestätigt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notification - New Booking - slides up and down */}
                <div className="absolute -top-3 -right-3 bg-white text-black rounded-xl shadow-lg p-3 animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Neue Buchung!</div>
                      <div className="text-xs text-gray-600">vor 2 Min.</div>
                    </div>
                  </div>
                </div>

                {/* Floating Review Badge */}
                <div className="absolute -bottom-3 -left-3 bg-white text-black rounded-xl shadow-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((i) => (
                        <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">+12 Bewertungen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">So funktioniert es</h2>
          <p className="text-gray-300 text-center mb-16 max-w-2xl mx-auto">
            In nur 3 Schritten zu Ihrem eigenen Online-Buchungssystem
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                1
              </div>
              <h3 className="font-semibold text-lg mb-3">Account erstellen</h3>
              <p className="text-gray-300">
                Registrieren Sie sich kostenlos und richten Sie Ihr Studio in wenigen Minuten ein.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                2
              </div>
              <h3 className="font-semibold text-lg mb-3">Services eintragen</h3>
              <p className="text-gray-300">
                Fügen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-zinc-800 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:bg-white group-hover:text-black transition-all duration-300">
                3
              </div>
              <h3 className="font-semibold text-lg mb-3">Buchungen empfangen</h3>
              <p className="text-gray-300">
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
              <p className="text-gray-300 mb-8">
                Alles was Sie brauchen, um Ihr Termingeschäft zu digitalisieren.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Automatische Erinnerungen', desc: 'Kunden bekommen 2 Tage vor dem Termin eine Nachricht. Vergessene Termine werden automatisch abgesagt. Spart €544 im Monat.', highlight: true },
                  { title: 'Automatisches Marketing', desc: 'Schickt automatisch Geburtstagswünsche, erinnert alte Kunden, fragt nach Bewertungen. Bringt €4.026 zusätzlich im Monat.', highlight: true },
                  { title: 'Keine Provisionen', desc: 'Sie zahlen nur den monatlichen Festpreis. Keine versteckten Gebühren pro Buchung.' },
                  { title: 'Branchen-Workflows', desc: 'Tattoo Studios, Medical/Botox, Wellness Spas - spezialisierte Workflows für Ihre Branche.' },
                  { title: 'Preis-Berater', desc: '6 einfache Fragen beantworten und wir finden den passenden Preis für Ihr Geschäft.', highlight: false },
                  { title: 'Datenschutz & Sicherheit', desc: 'Server in Deutschland, alle Daten verschlüsselt und sicher gespeichert.', highlight: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-6 h-6 ${item.highlight ? 'bg-green-500' : 'bg-white'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${item.highlight ? 'text-green-400' : ''}`}>{item.title}</h3>
                      <p className="text-gray-300 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-center">Was bringt es Ihnen?</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-green-400">€544</div>
                  <div className="text-gray-300 text-sm">Ersparnis pro Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-green-400">€4.026</div>
                  <div className="text-gray-300 text-sm">Zusatz-Umsatz pro Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">4x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 4-fach</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                  <div className="text-4xl font-bold mb-2">16x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 16-fach</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/onboarding/pricing-wizard"
                  className="inline-block px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  🎯 Preis-Berater starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">3 Preisstufen - Eine für jeden</h2>
          <p className="text-gray-300 mb-12">
            Von Starter (€129/Mo) bis Enterprise (€599/Mo). Keine versteckten Kosten, keine Provisionen.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Starter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <div className="text-2xl font-bold mb-2">€129</div>
              <div className="text-gray-300 mb-4">Starter</div>
              <ul className="space-y-3 text-sm">
                {['3 Mitarbeiter', '100 Buchungen/Mo', 'NO-SHOW-KILLER Basic', 'E-Mail Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional */}
            <div className="bg-white text-black border-4 border-green-500 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                BELIEBT
              </div>
              <div className="text-2xl font-bold mb-2">€249</div>
              <div className="text-gray-600 mb-4">Professional</div>
              <ul className="space-y-3 text-sm">
                {['Unlimited Staff', 'NO-SHOW-KILLER Full', 'MARKETING-AGENT (5/Mo)', '1 Branchen-Workflow'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left">
              <div className="text-2xl font-bold mb-2">€599</div>
              <div className="text-gray-300 mb-4">Enterprise</div>
              <ul className="space-y-3 text-sm">
                {['Unlimited Everything', 'Marketing Unlimited', 'ALLE 8 Workflows', '24/7 Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            to="/pricing"
            className="inline-block px-10 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition"
          >
            Alle Features vergleichen
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-gray-300 mb-8 text-lg">
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
    </>
  );
}

export default Home;
