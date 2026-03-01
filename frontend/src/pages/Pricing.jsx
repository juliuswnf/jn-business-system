import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfekt für kleine Betriebe',
    price: 129,
    yearlyPrice: 1290,
    yearlyMonthlyCost: 107.50,
    features: [
      { name: 'Mitarbeiter', value: '5', description: 'Bis zu 5 Mitarbeiter können das System nutzen' },
      { name: 'Standorte', value: '1', description: 'Für einen Unternehmens-Standort' },
      { name: 'Buchungen/Monat', value: '100', description: 'Bis zu 100 Termine pro Monat verwaltbar' },
      { name: 'Kunden', value: '200', description: 'Bis zu 200 Kundenkontakte speicherbar' },
      { name: 'Online-Buchung', included: true, description: 'Kunden buchen selbständig Termine über Ihre Webseite' },
      { name: 'Kalender & Terminverwaltung', included: true, description: 'Alle Termine übersichtlich im Kalender' },
      { name: 'E-Mail-Benachrichtigungen', included: true, description: 'Automatische E-Mails an Kunden bei Buchung' },
      { name: 'Automatische Erinnerungen', included: true, description: 'Kunden bekommen vor Terminen eine Erinnerungs-E-Mail' },
      { name: 'Automatische Erinnerungen (Basis)', included: true, description: 'Kunden bekommen E-Mails mit Terminbestätigung' },
      { name: 'Kundendatenbank (CRM)', included: true, description: 'Alle Kundendaten sicher an einem Ort gespeichert' },
      { name: 'Zahlungsabwicklung', included: true, description: 'Kunden können direkt online bezahlen' },
      { name: 'Basis-Reporting', included: true, description: 'Einfache Übersicht über Umsätze und Termine' },
      { name: 'Google-Bewertungen', included: true, description: 'Automatisch Kunden nach Bewertungen fragen' },
      { name: 'E-Mail-Support', included: true, description: 'Hilfe per E-Mail bei Fragen' },
    ],
    notIncluded: [
      'Nachrichten per SMS',
      'Automatisches Marketing',
      'Spezial-Funktionen für Ihre Branche',
      'Mehrere Standorte',
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal für wachsende Teams',
    price: 249,
    yearlyPrice: 2490,
    yearlyMonthlyCost: 207.50,
    popular: true,
    features: [
      { name: 'Mitarbeiter', value: '30', description: 'Bis zu 30 Mitarbeiter können das System nutzen' },
      { name: 'Standorte', value: '2', description: 'Für bis zu 2 Standorte' },
      { name: 'Buchungen/Monat', value: 'Unbegrenzt', description: 'Keine Begrenzung bei der Anzahl der Termine' },
      { name: 'Kunden', value: 'Unbegrenzt', description: 'Unbegrenzt viele Kundenkontakte speichern' },
      { name: 'Alles aus Starter', included: true, bold: true, description: 'Alle Funktionen vom Starter-Plan inklusive' },
      { name: 'Automatische Erinnerungen (Komplett)', included: true, highlight: true, description: 'Nachrichten 2 Tage vor Termin, automatische Absage nach 1 Tag, Warteliste' },
      { name: 'Automatisches Marketing (5 pro Monat)', included: true, highlight: true, description: 'Geburtstag, Rückholung, Bewertung, Mehrverkauf, Empfehlung - alles automatisch' },
      { name: 'BRANCHEN-WORKFLOW (1 aktiviert)', included: true, description: 'Tattoo Studio, Medical/Botox oder Wellness Spa Workflow' },
      { name: 'Erweiterte Auswertungen', included: true, description: 'Detaillierte Übersicht über Umsätze, vergessene Termine und Gewinn' },
      { name: 'Multi-Service Buchungen', included: true, description: 'Kunden können mehrere Behandlungen auf einmal buchen' },
      { name: 'Portfolio & Galerien', included: true, description: 'Vorher-Nachher Bilder Ihrer Arbeit zeigen' },
      { name: 'Custom Branding', included: true, description: 'Buchungsseite in Ihren Farben und mit Ihrem Logo' },
      { name: 'Service-Pakete & Memberships', included: true, description: 'Pakete (z.B. 10 Massagen) und monatliche Abos anbieten' },
      { name: 'Fortschrittsverfolgung', included: true, description: 'Behandlungsverläufe dokumentieren (z.B. bei Tattoos)' },
      { name: 'Ressourcenmanagement', included: true, description: 'Räume und Geräte planen (z.B. Massageräume)' },
      { name: 'Prioritäts-Support', included: true, description: 'Schnellere Hilfe bei Fragen und Problemen' },
    ],
    notIncluded: [
      'Alle 8 Branchen-Workflows (nur 1)',
      'Unlimited Marketing-Kampagnen (nur 5/Mo)',
      'Multi-Standort (max 2)',
      'White-Label',
      'API-Zugang',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Maximale Power & Features',
    price: 599,
    yearlyPrice: 5990,
    yearlyMonthlyCost: 499.17,
    badge: 'FULL POWER',
    features: [
      { name: 'Mitarbeiter', value: 'Unbegrenzt', description: 'Beliebig viele Mitarbeiter ohne Aufpreis' },
      { name: 'Standorte', value: 'Unbegrenzt', description: 'Beliebig viele Filialen gleichzeitig verwalten' },
      { name: 'Buchungen/Monat', value: 'Unbegrenzt', description: 'Keine Begrenzung bei der Anzahl der Termine' },
      { name: 'Kunden', value: 'Unbegrenzt', description: 'Unbegrenzt viele Kundenkontakte speichern' },
      { name: 'Alles aus Professional', included: true, bold: true, description: 'Alle Funktionen vom Professional-Plan inklusive' },
      { name: 'Automatische Erinnerungen (Komplett + Eigene Regeln)', included: true, highlight: true, description: 'Nachrichten, automatische Absage, Warteliste + eigene Regeln pro Service' },
      { name: 'Automatisches Marketing (Unbegrenzt)', included: true, highlight: true, description: 'Unbegrenzte Aktionen, verschiedene Versionen testen, Erfolg messen' },
      { name: 'ALLE 8 BRANCHEN-FUNKTIONEN', included: true, highlight: true, description: 'Tattoo, Medizin/Botox, Wellness, Frisör, Kosmetik, Nägel, Massage, Tier-Pflege' },
      { name: 'Multi-Standort Dashboard', included: true, description: 'Alle Standorte zentral verwalten mit einer Übersicht' },
      { name: 'White-Label Optionen', included: true, description: 'Komplett in Ihrem Design - kein JN Business System Logo sichtbar' },
      { name: 'Schnittstelle für Entwickler', included: true, description: 'Anbindung an Ihre eigene Software möglich' },
      { name: 'Webhook Integrationen', included: true, description: 'Automatische Benachrichtigungen an andere Programme' },
      { name: 'HIPAA Compliance', included: true, description: 'Medizinische Daten AES-256-GCM verschlüsselt' },
      { name: 'Audit-Logs', included: true, description: 'Nachvollziehen wer was wann geändert hat (90 Tage)' },
      { name: 'Dedizierter Account Manager', included: true, description: 'Persönlicher Ansprechpartner nur für Sie' },
      { name: 'Prioritäts-Support (24/7)', included: true, description: 'Hilfe rund um die Uhr - auch nachts und am Wochenende' },
    ],
  },
];

const faq = [
  {
    q: 'Gibt es eine Testphase?',
    a: 'Ja, Sie können jeden Plan 30 Tage kostenlos und unverbindlich testen. Keine Kreditkarte erforderlich.',
  },
  {
    q: 'Kann ich den Plan später wechseln?',
    a: 'Ja, Sie können jederzeit upgraden oder downgraden. Die Abrechnung wird automatisch angepasst.',
  },
  {
    q: 'Gibt es versteckte Kosten?',
    a: 'Nein. Der angezeigte Preis ist alles, was Sie zahlen. Keine Provisionen, keine Einrichtungsgebühren.',
  },
  {
    q: 'Wie funktioniert die Kündigung?',
    a: 'Sie können monatlich kündigen - ohne Mindestlaufzeit und ohne Kündigungsfrist.',
  },
  {
    q: 'Bekomme ich Hilfe bei der Einrichtung?',
    a: 'Ja, wir helfen Ihnen kostenlos bei der Einrichtung. Per Videocall oder E-Mail.',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Calculate savings for yearly billing
  const calculateSavings = (plan) => {
    const monthlyCost = plan.price * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  return (
    <>
      <SEO
        title="Preise - Faire Preise ohne versteckte Kosten"
        description="Starter ab €69/Monat, Professional €199/Monat, Enterprise €499/Monat. 30 Tage kostenlos testen. Keine Kreditkarte erforderlich."
        keywords="Preise, Buchungssystem Kosten, Business Software Preis, Unternehmenssoftware"
        url="/pricing"
      />
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Preise</h1>
          <p className="text-zinc-700 text-xl max-w-2xl mx-auto">
            Transparente Preise. Keine versteckten Kosten.
            <br />
            <span className="text-zinc-900 font-medium">Sie behalten 100% Ihrer Einnahmen.</span>
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={yearly ? 'text-zinc-700' : 'text-zinc-900 font-medium'}>
            Monatlich
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`w-14 h-7 rounded-full relative transition-colors ${
              yearly ? 'bg-zinc-700' : 'bg-zinc-300'
            }`}
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 bg-white border border-zinc-300 rounded-full absolute top-1 transition-all ${
                yearly ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={yearly ? 'text-zinc-900 font-medium' : 'text-zinc-700'}>
            Jährlich
          </span>
          {yearly && (
            <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-600 text-sm font-medium rounded-full">
              Spare bis zu €2.388
            </span>
          )}
        </div>

        {/* Enterprise Trial Banner */}
        <div className="max-w-4xl mx-auto mb-12 bg-zinc-50 border-2 border-white rounded-xl p-6 text-center shadow-none shadow-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-bold">14-Tage Enterprise Trial</h3>
          </div>
          <p className="text-zinc-700 mb-4">
            Teste alle Enterprise Features kostenlos - inkl. 50 Nachrichten. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register?trial=enterprise"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-bold rounded-lg hover:scale-105 transition-transform shadow-sm"
          >
            Jetzt Enterprise kostenlos testen
          </Link>
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-xl p-8 relative ${
                plan.popular
                  ? 'border-white bg-zinc-50 shadow-none scale-105'
                  : 'border-zinc-200 bg-zinc-50/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block text-xs font-bold bg-white text-black px-4 py-1.5 rounded-full">
                    BELIEBT
                  </span>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-4 right-4">
                  <span className="inline-block text-xs font-bold bg-white text-black px-4 py-1.5 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-zinc-700 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {yearly ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        €{plan.yearlyMonthlyCost.toFixed(0)}
                      </span>
                      <span className="text-zinc-700">/ Monat</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-2">
                      €{plan.yearlyPrice} jährlich (spare €{calculateSavings(plan)})
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">€{plan.price}</span>
                      <span className="text-zinc-700">/ Monat</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-2">
                      Monatlich kündbar
                    </p>
                  </>
                )}
              </div>

              <Link
                to={`/register?plan=${plan.id}${yearly ? '&billing=yearly' : ''}`}
                className={`block w-full py-4 rounded-lg text-center font-semibold transition mb-8 ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {plan.id === 'enterprise' ? 'Enterprise testen' : 'Jetzt starten'}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 text-sm ${
                      feature.highlight ? 'bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 -mx-2' : ''
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        feature.highlight ? 'text-blue-500' : 'text-blue-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <div className={feature.bold ? 'font-semibold text-zinc-900' : 'text-zinc-700'}>
                        {feature.name}
                        {feature.value && (
                          <span className="ml-1 text-zinc-900 font-medium">
                            ({feature.value})
                          </span>
                        )}
                        {feature.highlight && (
                          <span className="ml-2 text-xs text-blue-500 font-bold">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-zinc-600 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {plan.notIncluded && plan.notIncluded.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <p className="text-xs text-zinc-600 mb-2">Nicht enthalten:</p>
                  <ul className="space-y-2">
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SMS Callout */}
        <div className="max-w-4xl mx-auto mb-20 bg-zinc-50 border border-zinc-200 rounded-xl p-8 hover:border-white/30 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Nachrichten per SMS nur in Enterprise</h3>
              <p className="text-zinc-600 mb-4">
                Reduziere vergessene Termine um bis zu 60% mit automatischen Nachrichten 2 Stunden & 1 Tag vor Terminen.
                Inklusive 500 Nachrichten pro Monat (mehr bei größerem Team: +50 Nachrichten pro Mitarbeiter).
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">2h & 24h Erinnerungen</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Prioritäts-System</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Überschreitung möglich (€0.05 pro Nachricht)</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-zinc-700">Email-Fallback automatisch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Plans Include */}
        <div className="mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
            <h2 className="text-2xl font-bold mx-8">In allen Plänen enthalten</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Online-Buchung rund um die Uhr',
              'Automatische Termin-Erinnerungen',
              'Google-Bewertungen sammeln',
              'Kalender-Synchronisation',
              'Kundendatenbank',
              'DSGVO-konform',
              'Tägliche Backups',
              'Kostenlose Einrichtung',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="flex items-center justify-center mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
            <h2 className="text-2xl font-bold mx-8">Häufige Fragen</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          </div>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <div key={i} className="border border-zinc-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-zinc-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-zinc-700">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border border-zinc-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-2">Noch Fragen?</h2>
          <p className="text-zinc-700 text-sm mb-6">
            Schreiben Sie uns - wir antworten innerhalb von 24 Stunden.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:support@jn-business-system.de"
              className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 border border-zinc-300 rounded text-sm transition"
              aria-label="Support kontaktieren per E-Mail"
            >
              E-Mail schreiben
            </a>
            <Link
              to="/demo"
              className="px-5 py-2 bg-zinc-200 text-zinc-900 hover:bg-zinc-300 border border-zinc-300 rounded text-sm transition"
              aria-label="Demo-Video ansehen"
            >
              Demo ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
