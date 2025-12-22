import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState('tattoo');

  const industryFeatures = {
    tattoo: {
      name: 'Tattoo-Studio',
      subtitle: 'Multi-Session Projekte',
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      features: [
        'Projekt-Fortschritt verfolgen',
        'Fotos Before/After hochladen',
        'Portfolio-Galerie für Marketing',
        'Digitale Einverständniserklärungen'
      ]
    },
    medical: {
      name: 'Medizinische Praxis',
      subtitle: 'Behandlungspläne, sichere Akten',
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      features: [
        'Sichere Patientenakten (DSGVO-konform)',
        'Behandlungspläne verwalten',
        'Medizinische Notizen & Dokumentation',
        'Automatische Nachsorge-Termine',
        'Verschlüsselte Datenübertragung'
      ]
    },
    wellness: {
      name: 'Wellness & Spa',
      subtitle: 'Pakete, Mitgliedschaften, Abos',
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      features: [
        'Paket-Verwaltung (z.B. "10 Massagen")',
        'Mitgliedschaften & Abos',
        'Gutschein-System',
        'Treuepunkte & Rabatte',
        'Automatische Verlängerungen'
      ]
    },
    beauty: {
      name: 'Friseursalon',
      subtitle: 'Standard Buchungen + Treueprogramm',
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      ),
      features: [
        'Produkt-Verkauf im System',
        'Treueprogramm & Stempelkarten',
        'Kombi-Angebote verwalten',
        'Kunden-Historie & Vorlieben',
        'Automatische Rabatt-Gutscheine'
      ]
    }
  };
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
                  className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition text-center"
                >
                  30 Tage kostenlos testen
                </Link>
                <Link
                  to="/demo"
                  className="px-8 py-4 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-900 hover:border-zinc-600 transition text-center"
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
                      <div className="bg-zinc-800 rounded-xl p-4 text-center border border-zinc-700">
                        <div className="text-2xl font-bold text-white">47</div>
                        <div className="text-xs text-gray-400">Buchungen</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center border border-green-500/20">
                        <div className="text-2xl font-bold text-green-500">€2.340</div>
                        <div className="text-xs text-gray-400">Umsatz</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-500">4.8</div>
                        <div className="text-xs text-gray-400">Bewertung</div>
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
                          <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-1 rounded-full font-medium">Bestätigt</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">SK</div>
                            <div>
                              <div className="font-medium">Sophie K.</div>
                              <div className="text-sm text-gray-300">Behandlung · 14:00 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-full font-medium">Neu</span>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">LM</div>
                            <div>
                              <div className="font-medium">Lisa M.</div>
                              <div className="text-sm text-gray-300">Termin · 16:30 Uhr</div>
                            </div>
                          </div>
                          <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-1 rounded-full font-medium">Bestätigt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notification - New Booking - slides up and down */}
                <div className="absolute -top-3 -right-3 bg-zinc-900 border border-cyan-500/30 rounded-xl shadow-lg p-3 animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-cyan-500">Neue Buchung!</div>
                      <div className="text-xs text-gray-400">vor 2 Min.</div>
                    </div>
                  </div>
                </div>

                {/* Floating Review Badge */}
                <div className="absolute -bottom-3 -left-3 bg-zinc-900 border border-yellow-500/30 rounded-xl shadow-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {[1,2,3,4,5].map((i) => (
                        <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">+12 Bewertungen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feature Showcase */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 text-white">6 Haupt-Features die Ihr Business voranbringen</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Einfach zu bedienen, leistungsstark und speziell für Ihr Geschäft entwickelt
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1: Booking System - The Foundation */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Buchungssystem
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Kunden buchen online - Tag und Nacht</h3>
                <p className="text-gray-400 text-lg mb-8">
                  Ihre Kunden/Patienten können jederzeit Termine buchen. Das System zeigt nur freie Termine an keine Doppelbuchungen möglich.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Einfach auf Ihrer Website einfügen</div>
                      <div className="text-gray-400">Ihren Code-Abschnitt kopieren und fertig. Keine technischen Kenntnisse nötig</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Für alle Ihre Mitarbeiter</div>
                      <div className="text-gray-400">Jeder Mitarbeiter hat eigene Arbeitszeiten und Verfügbarkeit</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Warteliste für volle Tage</div>
                      <div className="text-gray-400">Kunden werden automatisch informiert sobald ein Termin frei wird</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Booking Widget Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-white">Termin buchen</h3>
                      <p className="text-sm text-gray-400">Beauty Studio Müller</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Service Selection */}
                    <div>
                      <label className="text-sm text-gray-400 font-medium block mb-2">Was möchten Sie buchen?</label>
                      <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">Haarschnitt</div>
                            <div className="text-sm text-gray-400">45 Minuten</div>
                          </div>
                          <div className="text-lg font-semibold text-white">€35</div>
                        </div>
                      </div>
                    </div>
                    {/* Date Picker */}
                    <div>
                      <label className="text-sm text-gray-400 font-medium block mb-2">Wählen Sie einen Tag</label>
                      <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950">
                        <div className="text-center mb-2 text-sm font-medium text-white">Dezember 2025</div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                          <div className="p-2 text-gray-500 text-xs">Mo</div>
                          <div className="p-2 text-gray-500 text-xs">Di</div>
                          <div className="p-2 text-gray-500 text-xs">Mi</div>
                          <div className="p-2 text-gray-500 text-xs">Do</div>
                          <div className="p-2 text-gray-500 text-xs">Fr</div>
                          <div className="p-2 text-gray-500 text-xs">Sa</div>
                          <div className="p-2 text-gray-500 text-xs">So</div>
                          <div className="p-2 text-gray-600">15</div>
                          <div className="p-2 text-gray-600">16</div>
                          <div className="p-2 bg-zinc-800 text-white rounded-lg font-medium">17</div>
                          <div className="p-2 hover:bg-zinc-800 rounded-lg cursor-pointer text-gray-400">18</div>
                          <div className="p-2 hover:bg-zinc-800 rounded-lg cursor-pointer text-gray-400">19</div>
                          <div className="p-2 hover:bg-zinc-800 rounded-lg cursor-pointer text-gray-400">20</div>
                          <div className="p-2 hover:bg-zinc-800 rounded-lg cursor-pointer text-gray-400">21</div>
                        </div>
                      </div>
                    </div>
                    {/* Time Slots */}
                    <div>
                      <label className="text-sm text-gray-400 font-medium block mb-2">Wählen Sie eine Uhrzeit</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg font-medium transition text-white">09:00</button>
                        <button className="px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg font-medium transition text-white">10:30</button>
                        <button className="px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg font-medium transition text-white">13:00</button>
                      </div>
                    </div>
                    <button className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 rounded-lg transition">
                      Jetzt buchen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: NO-SHOW KILLER - THE UNIQUE ONE */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* No-Show Prevention Flow */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3 text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">No-Show Verhinderung</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Step 1: SMS Confirmation */}
                    <div className="bg-zinc-950 rounded-lg p-4 border-l-2 border-cyan-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-full flex items-center justify-center font-semibold">1</div>
                        <span className="font-medium text-white">48h vorher: SMS-Erinnerung</span>
                      </div>
                      <div className="bg-zinc-900 border border-cyan-500/20 p-3 rounded-lg text-sm mt-3">
                        <p className="font-medium mb-1 text-cyan-500">Beauty Studio Müller</p>
                        <p className="text-gray-300">Hallo Anna! Ihr Termin ist übermorgen um 10:00 Uhr.</p>
                        <p className="mt-2 font-medium text-white">Antworten Sie mit JA zur Bestätigung</p>
                      </div>
                    </div>

                    {/* Step 2: Auto-Cancel */}
                    <div className="bg-zinc-950 rounded-lg p-4 border-l-2 border-yellow-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-full flex items-center justify-center font-semibold">2</div>
                        <span className="font-medium text-white">Keine Antwort? → Automatische Stornierung</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">Falls der Kunde nicht antwortet, wird der Termin nach 24h automatisch storniert und der Platz wird frei.</p>
                    </div>

                    {/* Step 3: Waitlist Matching */}
                    <div className="bg-zinc-950 rounded-lg p-4 border-l-2 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center font-semibold">3</div>
                        <span className="font-medium text-white">Warteliste wird sofort informiert</span>
                      </div>
                      <div className="bg-zinc-900 border border-green-500/20 p-3 rounded-lg text-sm mt-3">
                        <p className="font-medium mb-1 text-green-500">Gute Nachrichten!</p>
                        <p className="text-gray-300">Ein Termin ist frei geworden: Mittwoch 10:00 Uhr</p>
                        <button className="mt-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium w-full transition">Jetzt buchen</button>
                      </div>
                    </div>

                    {/* Savings Badge */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-500 mb-1">€544</div>
                      <div className="text-gray-300 text-sm">Durchschnittliche Ersparnis pro Monat</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  No-Show Killer - EINZIGARTIG!
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Nie wieder leere Stühle durch vergessene Termine</h3>
                <p className="text-gray-400 text-lg mb-8">
                  30% aller Kunden vergessen ihren Termin. Das kostet Sie durchschnittlich €544 pro Monat. Unser System verhindert das automatisch.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">SMS-Bestätigung 48h vorher</div>
                      <div className="text-gray-400">Kunde muss Termin bestätigen sonst wird storniert</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Automatisch freigegebene Termine</div>
                      <div className="text-gray-400">Plätze werden nicht verschwendet und andere Kunden können nachrücken</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Warteliste sofort benachrichtigt</div>
                      <div className="text-gray-400">Kunden von der Warteliste bekommen sofort eine SMS</div>
                    </div>
                  </li>
                </ul>
                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-green-500">Durchschnittlich €544/Monat mehr Umsatz</div>
                      <div className="text-sm text-gray-300">Keine leeren Termine = mehr Einnahmen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Marketing-Agent */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Automatisches Marketing
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Marketing läuft automatisch</h3>
                <p className="text-gray-400 text-lg mb-8">
                  Das System schickt automatisch Geburtstagsrabatte, holt verlorene Kunden zurück und bittet um Bewertungen. Einmal einrichten und für immer profitieren.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Geburtstags-Aktionen</div>
                      <div className="text-gray-400">Automatisch "Alles Gute! 20% Rabatt" - 7 Tage vor Geburtstag</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Kunden zurückholen</div>
                      <div className="text-gray-400">"Wir vermissen Sie! 15% Rabatt" - nach 60 Tagen ohne Besuch</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Bewertungen sammeln</div>
                      <div className="text-gray-400">Automatische Bitte um Google-Bewertung - 24h nach Besuch</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Freunde werben</div>
                      <div className="text-gray-400">"Bringen Sie einen Freund - beide bekommen 10% Rabatt"</div>
                    </div>
                  </li>
                </ul>
                <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <div>
                      <div className="font-semibold text-cyan-500">Durchschnittlich +€4.026/Monat Zusatz-Umsatz</div>
                      <div className="text-sm text-gray-300">Durch automatisierte Kampagnen</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Marketing Campaign Examples */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-white">Automatische Kampagnen</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {/* Birthday Campaign */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 109.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <div>
                          <div className="font-medium text-white">Geburtstags-Rabatt</div>
                          <div className="text-sm text-gray-400">Gesendet 7 Tage vorher</div>
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-2 text-white">Alles Gute zum Geburtstag, Anna!</p>
                        <p className="mb-2 text-gray-400">Wir schenken Ihnen 20% Rabatt auf alle Services zum Geburtstag.</p>
                        <button className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium w-full transition">Jetzt Termin buchen</button>
                      </div>
                    </div>

                    {/* Win-Back Campaign */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <div>
                          <div className="font-medium text-white">Rückgewinnungs-Aktion</div>
                          <div className="text-sm text-gray-400">Nach 60 Tagen Inaktivität</div>
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-2 text-white">Wir vermissen Sie, Lisa!</p>
                        <p className="mb-2 text-gray-400">Kommen Sie zurück und erhalten Sie 15% Rabatt auf Ihren nächsten Besuch.</p>
                        <button className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium w-full transition">Termin vereinbaren</button>
                      </div>
                    </div>

                    {/* Review Request */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <div>
                          <div className="font-medium text-white">Bewertungs-Anfrage</div>
                          <div className="text-sm text-gray-400">24h nach Besuch</div>
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-2 text-white">Wie war Ihr Besuch?</p>
                        <p className="mb-2 text-gray-400">Helfen Sie anderen mit einer Google-Bewertung. Dauert nur 30 Sekunden!</p>
                        <button className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium w-full transition">Jetzt bewerten</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Industry-Specific Workflows */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Branchen-spezifisch
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Perfekt für Ihre Branche gemacht</h3>
                <p className="text-gray-400 text-lg mb-8">
                  Nicht jedes Geschäft arbeitet gleich. Deshalb haben wir spezielle Funktionen für 8 verschiedene Branchen entwickelt.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Tattoo-Studios</div>
                      <div className="text-gray-400">Große Tattoos über mehrere Termine verfolgen, Fortschritt dokumentieren, Portfolio-Galerie</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Ärzte & Botox-Kliniken</div>
                      <div className="text-gray-400">Behandlungspläne, sichere Patientenakten, medizinische Notizen, Nachsorge-Termine</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Wellness & Spa</div>
                      <div className="text-gray-400">Pakete (z.B. "10 Massagen für €500"), Mitgliedschaften, Abos</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Friseure, Beauty, Nails</div>
                      <div className="text-gray-400">Standard-Funktionen + Produkt-Verkauf, Treueprogramme</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                {/* Industry Selection Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-white">Ihre Branche wählen</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {/* Industry Options - Fixed Order */}
                    {Object.entries(industryFeatures).map(([key, industry]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedIndustry(selectedIndustry === key ? null : key)}
                        className={`bg-zinc-950 border rounded-lg p-4 transition cursor-pointer ${
                          selectedIndustry === key
                            ? 'border-cyan-500/50 hover:border-cyan-500/70'
                            : 'border-zinc-800 hover:bg-zinc-900 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded flex items-center justify-center ${
                            selectedIndustry === key
                              ? 'bg-cyan-500/10 border border-cyan-500/30'
                              : 'bg-zinc-900 border border-zinc-800'
                          }`}>
                            {industry.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{industry.name}</div>
                            <div className="text-sm text-gray-400">{industry.subtitle}</div>
                          </div>
                          <svg 
                            className={`w-5 h-5 transition-transform ${
                              selectedIndustry === key 
                                ? 'text-cyan-500 rotate-180' 
                                : 'text-gray-400'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {selectedIndustry === key && (
                          <div className="mt-3 bg-zinc-900 rounded-lg p-3 space-y-2 text-sm animate-in slide-in-from-top-2 duration-200">
                            {industry.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-300">
                                <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: Pricing Wizard */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Pricing Wizard Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3 text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-semibold">Welcher Plan passt zu Ihnen?</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Question Example */}
                    <div>
                      <div className="text-sm text-gray-400 mb-3">Frage 1 von 6</div>
                      <div className="font-semibold text-lg mb-4 text-white">Wie viele Termine haben Sie pro Woche?</div>
                      <div className="space-y-2">
                        <button className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 text-left transition">
                          <div className="font-medium text-white">Unter 20 Termine</div>
                          <div className="text-sm text-gray-400">Kleines Studio, wenige Kunden</div>
                        </button>
                        <button className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-4 text-left">
                          <div className="font-medium text-white">20-50 Termine</div>
                          <div className="text-sm text-gray-300">Mittleres Geschäft</div>
                        </button>
                        <button className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 text-left transition">
                          <div className="font-medium text-white">Über 50 Termine</div>
                          <div className="text-sm text-gray-400">Großes Studio, mehrere Mitarbeiter</div>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{width: '33%'}}></div>
                      </div>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-6">
                      <div className="text-center mb-3">
                        <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="font-semibold text-lg text-green-500 mb-1">Professional Plan empfohlen!</div>
                        <div className="text-sm text-gray-300">95% Übereinstimmung mit Ihren Anforderungen</div>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Monatlicher Preis</span>
                          <span className="font-semibold text-white">€249/Monat</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ihre Ersparnis</span>
                          <span className="font-semibold text-green-500">€544/Monat</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-zinc-800">
                          <span className="text-gray-400">Sie gewinnen</span>
                          <span className="font-semibold text-green-500">€295/Monat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Intelligenter Preis-Finder
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Finden Sie den perfekten Plan in nur 60 Sekunden</h3>
                <p className="text-gray-400 text-lg mb-8">
                  Beantworten Sie 6 einfache Fragen über Ihr Geschäft. Das System empfiehlt automatisch den besten Plan und zeigt Ihnen, wie viel Sie sparen.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">6 einfache Fragen</div>
                      <div className="text-gray-400">Kunden-Anzahl, Termine pro Woche, Mitarbeiter, gewünschte Features</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Automatische Empfehlung</div>
                      <div className="text-gray-400">Das System berechnet welcher Plan am besten passt</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Genaue Ersparnis-Berechnung</div>
                      <div className="text-gray-400">Sie sehen sofort wie viel Sie durch No-Show-Killer sparen</div>
                    </div>
                  </li>
                </ul>
                <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-yellow-500">Keine Fehlentscheidung mehr</div>
                      <div className="text-sm text-gray-300">Wählen Sie von Anfang an den richtigen Plan</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 6: Multi-Location */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Mehrere Filialen
                </div>
                <h3 className="text-4xl font-bold mb-6 text-white">Perfekt für Ketten mit mehreren Standorten</h3>
                <p className="text-gray-400 text-lg mb-8">
                  Haben Sie 2, 5 oder 10 Filialen? Kein Problem. Verwalten Sie alle Standorte zentral, aber jede Filiale kann eigene Einstellungen haben.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Ein Dashboard für alle Filialen</div>
                      <div className="text-gray-400">Sehen Sie Umsätze und Buchungen aller Standorte auf einen Blick</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Eigene Preise pro Filiale</div>
                      <div className="text-gray-400">München kann andere Preise haben als Berlin - Sie entscheiden</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-1 text-white">Vergleiche zwischen Standorten</div>
                      <div className="text-gray-400">Welche Filiale läuft am besten? Sofort sichtbar</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Multi-Location Dashboard */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-semibold text-white">Alle Standorte</span>
                    </div>
                    <button className="px-3 py-1 bg-white hover:bg-gray-100 text-black text-sm font-medium rounded-lg transition">+ Neue Filiale</button>
                  </div>
                  <div className="p-6 space-y-3">
                    {/* Location 1 - Best Performer */}
                    <div className="bg-zinc-950 border-2 border-zinc-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-white font-semibold">
                            M
                          </div>
                          <div>
                            <div className="font-semibold text-white">München Zentrum</div>
                            <div className="text-sm text-gray-400">Marienplatz 5</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium rounded-full">Top Filiale</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">47</div>
                          <div className="text-xs text-gray-400">Termine heute</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">€3.2k</div>
                          <div className="text-xs text-gray-400">Umsatz</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">5</div>
                          <div className="text-xs text-gray-400">Mitarbeiter</div>
                        </div>
                      </div>
                    </div>

                    {/* Location 2 */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-white font-semibold">
                            B
                          </div>
                          <div>
                            <div className="font-semibold text-white">Berlin Mitte</div>
                            <div className="text-sm text-gray-400">Friedrichstraße 123</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-gray-300 text-xs font-medium rounded-full">Geöffnet</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">32</div>
                          <div className="text-xs text-gray-400">Heute</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">€2.1k</div>
                          <div className="text-xs text-gray-400">Umsatz</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">4</div>
                          <div className="text-xs text-gray-400">Mitarbeiter</div>
                        </div>
                      </div>
                    </div>

                    {/* Location 3 */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-white font-semibold">
                            H
                          </div>
                          <div>
                            <div className="font-semibold text-white">Hamburg Altona</div>
                            <div className="text-sm text-gray-400">Ottenser Hauptstraße 45</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-gray-300 text-xs font-medium rounded-full">Geöffnet</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">28</div>
                          <div className="text-xs text-gray-400">Heute</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">€1.8k</div>
                          <div className="text-xs text-gray-400">Umsatz</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2">
                          <div className="text-lg font-semibold text-white">3</div>
                          <div className="text-xs text-gray-400">Mitarbeiter</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Visual Version */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">So funktioniert es</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            In nur 3 Schritten zu Ihrem eigenen Online-Buchungssystem
          </p>

          <div className="space-y-24">
            {/* Step 1 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-4">
                  Schritt 1
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Account erstellen & einrichten</h3>
                <p className="text-gray-400 text-lg mb-6">
                  Registrieren Sie sich kostenlos und richten Sie Ihr Konto in wenigen Minuten ein. Keine technischen Kenntnisse erforderlich.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Firmenname und Kontaktdaten eingeben
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Öffnungszeiten festlegen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Logo und Farben anpassen
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Settings Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Einstellungen
                    </span>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Firmenname</label>
                      <input type="text" value="Mein Beauty Studio" readOnly className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Öffnungszeiten</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="time" value="09:00" readOnly className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm" />
                        <input type="time" value="18:00" readOnly className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm" />
                      </div>
                    </div>
                    <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 rounded-lg transition">
                      Speichern
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Services Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold text-white">💼 Services</span>
                    <button className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-medium rounded-lg transition">+ Neu</button>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">Haarschnitt</div>
                        <div className="text-sm text-gray-400">45 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-cyan-500">€35</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">Färben</div>
                        <div className="text-sm text-gray-400">90 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-cyan-500">€65</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">Styling</div>
                        <div className="text-sm text-gray-400">30 Min.</div>
                      </div>
                      <div className="text-lg font-bold text-cyan-500">€25</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-500 text-sm font-medium mb-4">
                  Schritt 2
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Services anlegen</h3>
                <p className="text-gray-400 text-lg mb-6">
                  Fügen Sie Ihre Dienstleistungen mit Preisen und Zeitdauer hinzu. Kunden sehen sofort, was Sie anbieten.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Name, Preis und Dauer festlegen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Beschreibung und Bilder hinzufügen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mitarbeiter zuweisen
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 - With Visual */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm font-medium mb-4">
                  Schritt 3
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Buchungen empfangen</h3>
                <p className="text-gray-400 text-lg mb-6">
                  Kunden buchen über Ihre Website, Sie verwalten alles im Dashboard. Automatische Bestätigungen und Erinnerungen inklusive.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Echtzei Terminkalender
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Automatische E-Mail Bestätigungen
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kunden-Datenbank mit Historie
                  </li>
                </ul>
              </div>
              <div className="relative">
                {/* Bookings Preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Heutige Buchungen
                    </span>
                    <span className="text-sm text-gray-400">17. Dez 2025</span>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-500 font-semibold">
                            MK
                          </div>
                          <div>
                            <div className="font-semibold text-white">Maria Klein</div>
                            <div className="text-sm text-gray-400">10:00 Uhr</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-medium rounded-full">Bestätigt</span>
                      </div>
                      <div className="text-sm text-gray-400">Haarschnitt • 45 Min. • €35</div>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-500 font-semibold">
                            SB
                          </div>
                          <div>
                            <div className="font-semibold text-white">Stefan Bauer</div>
                            <div className="text-sm text-gray-400">14:30 Uhr</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-medium rounded-full">Neu</span>
                      </div>
                      <div className="text-sm text-gray-400">Färben • 90 Min. • €65</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Warum JN Business System?</h2>
              <p className="text-gray-400 mb-8">
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
                    <div className={item.highlight ? 'w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5' : 'w-6 h-6 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center flex-shrink-0 mt-0.5'}>
                      <svg className={`w-4 h-4 ${item.highlight ? 'text-black' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={item.highlight ? 'font-semibold mb-1 text-cyan-500' : 'font-semibold mb-1 text-white'}>{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-center text-white">Was bringt es Ihnen?</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-green-500">€544</div>
                  <div className="text-gray-300 text-sm">Ersparnis pro Monat</div>
                </div>
                <div className="text-center p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-cyan-500">€4.026</div>
                  <div className="text-gray-300 text-sm">Zusatz-Umsatz pro Monat</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-white">4x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 4-fach</div>
                </div>
                <div className="text-center p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <div className="text-4xl font-bold mb-2 text-white">16x</div>
                  <div className="text-gray-300 text-sm">Lohnt sich 16-fach</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/onboarding/pricing-wizard"
                  className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition"
                >
                  Preis-Berater starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">3 Preisstufen - Eine für jeden</h2>
          <p className="text-gray-400 mb-12">
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
            <div className="bg-zinc-900 border-2 border-cyan-500 rounded-2xl p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-black px-4 py-1 rounded-full text-xs font-bold">
                BELIEBT
              </div>
              <div className="text-2xl font-bold mb-2 text-white">€249</div>
              <div className="text-gray-300 mb-4">Professional</div>
              <ul className="space-y-3 text-sm">
                {['Unlimited Staff', 'NO-SHOW-KILLER Full', 'MARKETING-AGENT (5/Mo)', '1 Branchen-Workflow'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h2 className="text-3xl font-bold mb-4 text-white">Bereit loszulegen?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Testen Sie JN Business System 30 Tage kostenlos. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition text-lg"
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
