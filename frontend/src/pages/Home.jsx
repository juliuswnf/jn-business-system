import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

/* Reusable inline browser chrome wrapper */
function BrowserFrame({ children, url = 'app.jn-business.de' }) {
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-[0_2px_40px_-12px_rgba(0,0,0,0.12)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[11px] text-zinc-400 bg-zinc-100 rounded px-3 py-0.5">{url}</span>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white">{children}</div>
    </div>
  );
}

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
      "priceValidUntil": "2026-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  const features = [
    { title: 'Online-Buchungen', desc: 'Kunden buchen rund um die Uhr über Ihre Website. Keine Anrufe, keine Doppelbuchungen.' },
    { title: 'No-Show-Killer', desc: 'Automatische SMS-Bestätigung 48h vorher. Keine Antwort? Termin wird storniert, Warteliste rückt nach.' },
    { title: 'Marketing-Autopilot', desc: 'Geburtstagsgutscheine, Rückgewinnung inaktiver Kunden und Bewertungs-Anfragen. Vollautomatisch.' },
    { title: 'Branchen-Workflows', desc: 'Spezielle Abläufe für Tattoo-Studios, Ärzte, Wellness, Beauty und mehr.' },
    { title: 'Mehrere Standorte', desc: 'Zentrale Verwaltung aller Filialen. Eigene Preise, eigene Teams, ein Dashboard.' },
    { title: 'DSGVO-konform', desc: 'Server in Deutschland. Verschlüsselte Daten, automatische Löschfristen.' },
  ];

  const metrics = [
    { value: '€544', label: 'weniger Verlust / Monat', sub: 'durch No-Show-Killer' },
    { value: '€4.026', label: 'Zusatz-Umsatz / Monat', sub: 'durch Marketing-Autopilot' },
    { value: '30 Tage', label: 'kostenlos testen', sub: 'keine Kreditkarte nötig' },
  ];

  return (
    <>
      <SEO
        title="Online-Buchungssystem für Unternehmen"
        description="Automatische Terminbuchungen für Dienstleister aller Branchen. 30 Tage kostenlos testen. No-Show-Killer inklusive."
        keywords="Online Buchungssystem, Terminvereinbarung, Business Software, Unternehmensverwaltung, No-Show-Killer"
        url="/"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-44 md:pb-28">
          <p className="text-sm tracking-widest uppercase text-zinc-400 mb-6">
            Buchungssystem für exklusive Salons
          </p>
          <h1 className="max-w-3xl text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.08]">
            Weniger Chaos.{' '}
            <br className="hidden sm:block" />
            Mehr Umsatz.
          </h1>
          <p className="mt-6 max-w-xl text-center text-lg text-zinc-500 leading-relaxed">
            Online-Termine, automatische Erinnerungen,
            No-Show-Schutz und Marketing. Alles in einem System.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-flex items-center justify-center px-8 py-4 bg-zinc-900 text-white text-base font-semibold rounded-full hover:bg-zinc-800 transition-colors"
          >
            Jetzt starten
          </Link>
          <p className="mt-4 text-sm text-zinc-400">
            30 Tage kostenlos · Keine Kreditkarte
          </p>
        </section>

        {/* Hero Visual */}
        <section className="pb-24 md:pb-32 px-6">
          <div className="max-w-5xl mx-auto">
            <BrowserFrame url="app.jn-business.de/dashboard">
              <div className="p-5 md:p-8 space-y-6">
                {/* Top stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Heute', value: '12 Termine', accent: false },
                    { label: 'Diese Woche', value: '47 Buchungen', accent: false },
                    { label: 'Umsatz', value: '€2.340', accent: true },
                    { label: 'No-Show-Rate', value: '0 %', accent: true },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border border-zinc-100 p-4">
                      <p className="text-xs text-zinc-400">{s.label}</p>
                      <p className={`mt-1 text-lg font-semibold ${s.accent ? 'text-zinc-900' : 'text-zinc-700'}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Upcoming appointments */}
                <div>
                  <p className="text-sm font-medium text-zinc-900 mb-3">Heutige Termine</p>
                  <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 overflow-hidden">
                    {[
                      { initials: 'MH', name: 'Maria H.', service: 'Beratung', time: '10:30', status: 'Bestätigt', statusColor: 'text-emerald-600 bg-emerald-50' },
                      { initials: 'SK', name: 'Sophie K.', service: 'Behandlung', time: '14:00', status: 'Neu', statusColor: 'text-amber-600 bg-amber-50' },
                      { initials: 'LM', name: 'Lisa M.', service: 'Styling', time: '16:30', status: 'Bestätigt', statusColor: 'text-emerald-600 bg-emerald-50' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
                            {a.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{a.name}</p>
                            <p className="text-xs text-zinc-400">{a.service} · {a.time} Uhr</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.statusColor}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="border-t border-zinc-100 py-14">
          <p className="text-center text-xs tracking-widest uppercase text-zinc-400">
            Vertraut von Studios in ganz Deutschland
          </p>
        </section>

        {/* Metrics */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-16 text-center">
            {metrics.map((m, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">{m.value}</div>
                <p className="mt-2 text-base text-zinc-900 font-medium">{m.label}</p>
                <p className="mt-1 text-sm text-zinc-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-20">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                Alles, was Ihr Salon braucht
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                Ein System statt zehn Tools. Entwickelt für Dienstleister,
                die keine Zeit für Verwaltung verschwenden wollen.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-14">
              {features.map((f, i) => (
                <div key={i} className="group">
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">{f.title}</h3>
                  <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Widget */}
        <section className="py-24 md:py-32 px-6 bg-zinc-50">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-zinc-400 mb-4">Online-Buchung</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                Kunden buchen. Sie schlafen.
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                Ihre Kunden sehen nur freie Slots, wählen den Service und buchen in Sekunden.
                Keine Anrufe, keine Wartezeiten, keine Doppelbuchungen.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Widget auf Ihrer Website einbetten',
                  'Eigene Arbeitszeiten pro Mitarbeiter',
                  'Warteliste bei vollen Tagen',
                  'Automatische Bestätigungs-E-Mail',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <span className="text-base text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Booking widget mockup */}
            <BrowserFrame url="ihr-salon.de/termin">
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <p className="text-base font-semibold text-zinc-900">Termin buchen</p>
                  <p className="text-sm text-zinc-400">Beauty Studio Hamburg</p>
                </div>
                {/* Service */}
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Service wählen</p>
                  <div className="border border-zinc-200 rounded-lg p-3 flex justify-between items-center bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Haarschnitt</p>
                      <p className="text-xs text-zinc-400">45 Min.</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">€35</span>
                  </div>
                </div>
                {/* Date */}
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Datum</p>
                  <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                    <p className="text-center text-xs font-medium text-zinc-700 mb-2">März 2026</p>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
                        <span key={d} className="text-zinc-400 py-1">{d}</span>
                      ))}
                      {[2,3,4,5,6,7,8].map(d => (
                        <span
                          key={d}
                          className={`py-1.5 rounded ${d === 5 ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:bg-zinc-100'}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Slots */}
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Uhrzeit</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['09:00','10:30','14:00'].map((t, i) => (
                      <span
                        key={t}
                        className={`text-center text-sm py-2 rounded-lg border transition ${
                          i === 1
                            ? 'border-zinc-900 bg-zinc-900 text-white font-medium'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full py-3 bg-zinc-900 text-white text-center text-sm font-semibold rounded-lg">
                  Jetzt buchen
                </div>
              </div>
            </BrowserFrame>
          </div>
        </section>

        {/* No-Show-Killer */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual first on mobile, text first on desktop */}
            <div className="order-2 lg:order-1">
              <BrowserFrame url="app.jn-business.de/no-show-killer">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">No-Show-Killer</p>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full text-emerald-600 bg-emerald-50">Aktiv</span>
                  </div>
                  {/* Steps */}
                  {[
                    { num: '1', time: '48h vorher', title: 'SMS gesendet', detail: '"Hallo Anna! Ihr Termin ist übermorgen um 10:00. Antworten Sie JA zur Bestätigung."', color: 'border-l-zinc-300' },
                    { num: '2', time: '24h vorher', title: 'Keine Antwort', detail: 'Termin automatisch storniert. Platz wird freigegeben.', color: 'border-l-zinc-400' },
                    { num: '3', time: 'Sofort', title: 'Warteliste benachrichtigt', detail: '"Ein Termin ist frei geworden: Do 10:00 Uhr. Jetzt buchen!"', color: 'border-l-zinc-900' },
                  ].map((s, i) => (
                    <div key={i} className={`border-l-2 ${s.color} pl-4 py-2`}>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{s.time}</p>
                      <p className="text-sm font-medium text-zinc-900 mt-0.5">{s.title}</p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{s.detail}</p>
                    </div>
                  ))}
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { v: '0', l: 'No-Shows' },
                      { v: '€0', l: 'Verlust' },
                      { v: '0 %', l: 'Rate' },
                    ].map((x, i) => (
                      <div key={i} className="text-center rounded-lg border border-zinc-100 py-3">
                        <p className="text-lg font-bold text-zinc-900">{x.v}</p>
                        <p className="text-[11px] text-zinc-400">{x.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </BrowserFrame>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-sm tracking-widest uppercase text-zinc-400 mb-4">Einzigartig</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                No-Show-Killer
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                30 % aller Termine werden vergessen. Das kostet Studios
                durchschnittlich €544 pro Monat. Unser System stoppt das. Automatisch.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'SMS-Bestätigung 48 Stunden vorher',
                  'Automatische Stornierung bei Nichtreaktion',
                  'Warteliste rückt sofort nach',
                  'Optionale Gebührenabrechnung via Stripe',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <span className="text-base text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Marketing Autopilot */}
        <section className="py-24 md:py-32 px-6 bg-zinc-50">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-zinc-400 mb-4">Automatisiert</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                Marketing, das sich selbst steuert
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                Einmal einrichten, für immer profitieren. Das System kümmert sich
                um Ihre Kundenbeziehungen. Ohne dass Sie daran denken müssen.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Geburtstags-Gutscheine automatisch versenden',
                  'Inaktive Kunden nach 60 Tagen zurückholen',
                  'Google-Bewertungen 24h nach Termin anfragen',
                  'Empfehlungsprogramm vollautomatisch',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <span className="text-base text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <BrowserFrame url="app.jn-business.de/marketing">
              <div className="p-6 space-y-3">
                <p className="text-sm font-semibold text-zinc-900 mb-4">Aktive Kampagnen</p>
                {[
                  { title: 'Geburtstags-Rabatt', trigger: '7 Tage vorher', sent: '24 gesendet', rate: '68 % geöffnet' },
                  { title: 'Rückgewinnung', trigger: '60 Tage inaktiv', sent: '12 gesendet', rate: '42 % geöffnet' },
                  { title: 'Bewertungs-Anfrage', trigger: '24h nach Termin', sent: '89 gesendet', rate: '31 % bewertet' },
                  { title: 'Freunde werben', trigger: 'Nach 3. Besuch', sent: '18 gesendet', rate: '22 % geworben' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{c.title}</p>
                      <p className="text-xs text-zinc-400">{c.trigger}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-zinc-700">{c.sent}</p>
                      <p className="text-xs text-zinc-400">{c.rate}</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-4 text-center mt-2">
                  <p className="text-2xl font-bold text-zinc-900">+€4.026</p>
                  <p className="text-xs text-zinc-400 mt-1">geschätzter Zusatz-Umsatz diesen Monat</p>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mb-20">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                In drei Schritten startklar
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                Kein Onboarding-Marathon. Kein Technik-Studium.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-16">
              {[
                { num: '01', title: 'Account anlegen', desc: 'Registrieren, Firmenname eingeben, Öffnungszeiten setzen. In unter drei Minuten startklar.' },
                { num: '02', title: 'Services einrichten', desc: 'Dienstleistungen mit Preis und Dauer anlegen. Mitarbeiter zuweisen. Fertig.' },
                { num: '03', title: 'Buchungen empfangen', desc: 'Kunden buchen direkt. Sie verwalten alles im Dashboard mit Echtzeit-Kalender.' },
              ].map((s) => (
                <div key={s.num}>
                  <span className="text-sm font-mono text-zinc-300">{s.num}</span>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-Location */}
        <section className="py-24 md:py-32 px-6 bg-zinc-50">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <BrowserFrame url="app.jn-business.de/standorte">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-zinc-900">Alle Standorte</p>
                  <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-2 py-0.5">3 aktiv</span>
                </div>
                {[
                  { city: 'München', addr: 'Marienplatz 5', bookings: 47, revenue: '€3.2k', team: 5, badge: 'Top' },
                  { city: 'Berlin', addr: 'Friedrichstraße 123', bookings: 32, revenue: '€2.1k', team: 4, badge: null },
                  { city: 'Hamburg', addr: 'Ottenser Hauptstr. 45', bookings: 28, revenue: '€1.8k', team: 3, badge: null },
                ].map((loc, i) => (
                  <div key={i} className="rounded-lg border border-zinc-100 p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-700">
                          {loc.city[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{loc.city}</p>
                          <p className="text-xs text-zinc-400">{loc.addr}</p>
                        </div>
                      </div>
                      {loc.badge && (
                        <span className="text-[10px] font-medium text-zinc-500 border border-zinc-200 rounded-full px-2 py-0.5">{loc.badge}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-50 rounded py-1.5">
                        <p className="text-sm font-semibold text-zinc-900">{loc.bookings}</p>
                        <p className="text-[10px] text-zinc-400">Termine</p>
                      </div>
                      <div className="bg-zinc-50 rounded py-1.5">
                        <p className="text-sm font-semibold text-zinc-900">{loc.revenue}</p>
                        <p className="text-[10px] text-zinc-400">Umsatz</p>
                      </div>
                      <div className="bg-zinc-50 rounded py-1.5">
                        <p className="text-sm font-semibold text-zinc-900">{loc.team}</p>
                        <p className="text-[10px] text-zinc-400">Team</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </BrowserFrame>

            <div>
              <p className="text-sm tracking-widest uppercase text-zinc-400 mb-4">Skalierbar</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                Mehrere Standorte, ein Dashboard
              </h2>
              <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
                Ob 2 oder 20 Filialen. Verwalten Sie alle zentral.
                Jeder Standort behält eigene Preise, Teams und Öffnungszeiten.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Umsatz-Vergleich zwischen Standorten',
                  'Eigene Preise pro Filiale',
                  'Mitarbeiter standortübergreifend einsetzen',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <span className="text-base text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              Faire Preise, keine Überraschungen
            </h2>
            <p className="mt-4 text-lg text-zinc-500 max-w-xl mx-auto">
              Drei Pläne. Monatlich kündbar. Keine Provisionen pro Buchung.
            </p>
            <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
              {[
                { name: 'Starter', price: '€129', sub: '/Monat', items: ['5 Mitarbeiter', '100 Buchungen/Mo', 'No-Show-Killer Basic', 'E-Mail-Support'] },
                { name: 'Professional', price: '€249', sub: '/Monat', popular: true, items: ['Unbegrenzt Mitarbeiter', 'No-Show-Killer Full', 'Marketing-Autopilot', 'Branchen-Workflow'] },
                { name: 'Enterprise', price: '€599', sub: '/Monat', items: ['Alles unbegrenzt', 'Alle 8 Workflows', 'Multi-Location', '24/7 Priority-Support'] },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-2xl px-7 py-8 transition-colors ${
                    plan.popular ? 'ring-1 ring-zinc-900' : 'hover:bg-zinc-50'
                  }`}
                >
                  {plan.popular && (
                    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-900 mb-4">Beliebt</p>
                  )}
                  <p className="text-sm text-zinc-500">{plan.name}</p>
                  <p className="mt-1">
                    <span className="text-3xl font-bold text-zinc-900">{plan.price}</span>
                    <span className="text-sm text-zinc-400">{plan.sub}</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-zinc-600">
                        <span className="block w-1 h-1 rounded-full bg-zinc-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link
              to="/pricing"
              className="mt-12 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Alle Funktionen vergleichen
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-28 md:py-36 px-6 border-t border-zinc-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              Bereit, Ihr Studio zu digitalisieren?
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              Starten Sie kostenlos. Keine Kreditkarte, kein Risiko.
            </p>
            <Link
              to="/register"
              className="mt-10 inline-flex items-center justify-center px-8 py-4 bg-zinc-900 text-white text-base font-semibold rounded-full hover:bg-zinc-800 transition-colors"
            >
              Jetzt starten
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}

export default Home;
