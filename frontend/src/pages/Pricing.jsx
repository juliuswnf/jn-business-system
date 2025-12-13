import { useState } from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfekt für kleine Betriebe',
    price: 69,
    yearlyPrice: 690,
    yearlyMonthlyCost: 57.50,
    features: [
      { name: 'Mitarbeiter', value: '3', description: 'Bis zu 3 Mitarbeiter können das System nutzen' },
      { name: 'Standorte', value: '1', description: 'Für einen Salon-Standort' },
      { name: 'Buchungen/Monat', value: '200', description: 'Bis zu 200 Termine pro Monat verwaltbar' },
      { name: 'Kunden', value: '500', description: 'Bis zu 500 Kundenkontakte speicherbar' },
      { name: 'Online-Buchung', included: true, description: 'Kunden buchen selbständig Termine über Ihre Webseite' },
      { name: 'Kalender & Terminverwaltung', included: true, description: 'Alle Termine übersichtlich im Kalender' },
      { name: 'E-Mail-Benachrichtigungen', included: true, description: 'Automatische E-Mails an Kunden bei Buchung' },
      { name: 'Automatische Erinnerungen', included: true, description: 'Kunden bekommen vor Terminen eine Erinnerungs-E-Mail' },
      { name: 'Kundendatenbank (CRM)', included: true, description: 'Alle Kundendaten sicher an einem Ort gespeichert' },
      { name: 'Zahlungsabwicklung', included: true, description: 'Kunden können direkt online bezahlen' },
      { name: 'Basis-Reporting', included: true, description: 'Einfache Übersicht über Umsätze und Termine' },
      { name: 'Google-Bewertungen', included: true, description: 'Automatisch Kunden nach Bewertungen fragen' },
      { name: 'E-Mail-Support', included: true, description: 'Hilfe per E-Mail bei Fragen' },
    ],
    notIncluded: [
      'SMS-Benachrichtigungen',
      'Marketing-Automation',
      'Portfolio/Galerie',
      'Multi-Standort',
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal für wachsende Teams',
    price: 169,
    yearlyPrice: 1690,
    yearlyMonthlyCost: 140.83,
    popular: true,
    features: [
      { name: 'Mitarbeiter', value: '10', description: 'Bis zu 10 Mitarbeiter können gleichzeitig arbeiten' },
      { name: 'Standorte', value: '1', description: 'Für einen Salon-Standort' },
      { name: 'Buchungen/Monat', value: '1.000', description: 'Bis zu 1.000 Termine pro Monat - ideal für größere Salons' },
      { name: 'Kunden', value: '2.500', description: 'Bis zu 2.500 Kundenkontakte - mehr Stammkunden verwalten' },
      { name: 'Alles aus Starter', included: true, bold: true, description: 'Alle Funktionen vom Starter-Plan inklusive' },
      { name: 'Marketing-Automation', included: true, description: 'Automatische E-Mails für Geburtstage und Rückkehr-Erinnerungen' },
      { name: 'Erweiterte Analytics', included: true, description: 'Detaillierte Auswertungen zu Umsätzen und beliebten Services' },
      { name: 'Multi-Service Buchungen', included: true, description: 'Kunden können mehrere Behandlungen auf einmal buchen' },
      { name: 'Portfolio & Galerien', included: true, description: 'Vorher-Nachher Bilder Ihrer Arbeit zeigen' },
      { name: 'Custom Branding', included: true, description: 'Buchungsseite in Ihren Farben und mit Ihrem Logo' },
      { name: 'Service-Pakete', included: true, description: 'Kombinationen aus mehreren Leistungen anbieten' },
      { name: 'Fortschrittsverfolgung', included: true, description: 'Behandlungsverläufe dokumentieren (z.B. bei Tattoos)' },
      { name: 'Ressourcenmanagement', included: true, description: 'Räume und Geräte planen (z.B. Massageräume)' },
      { name: 'Prioritäts-Support', included: true, description: 'Schnellere Hilfe bei Fragen und Problemen' },
    ],
    notIncluded: [
      'SMS-Benachrichtigungen (nur Enterprise)',
      'Multi-Standort',
      'White-Label',
      'API-Zugang',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Maximale Power & Features',
    price: 399,
    yearlyPrice: 3990,
    yearlyMonthlyCost: 332.50,
    badge: 'SMS INCLUDED',
    features: [
      { name: 'Mitarbeiter', value: 'Unbegrenzt', description: 'Beliebig viele Mitarbeiter ohne Aufpreis' },
      { name: 'Standorte', value: '5', description: 'Bis zu 5 Filialen gleichzeitig verwalten' },
      { name: 'Buchungen/Monat', value: 'Unbegrenzt', description: 'Keine Begrenzung bei der Anzahl der Termine' },
      { name: 'Kunden', value: 'Unbegrenzt', description: 'Unbegrenzt viele Kundenkontakte speichern' },
      { name: 'Alles aus Professional', included: true, bold: true, description: 'Alle Funktionen vom Professional-Plan inklusive' },
      { name: 'SMS-Benachrichtigungen', value: '500/Monat', included: true, highlight: true, description: 'SMS-Erinnerungen direkt aufs Handy - verhindert vergessene Termine' },
      { name: 'Multi-Standort Support', included: true, description: 'Mehrere Salons zentral verwalten mit einer Übersicht' },
      { name: 'White-Label Optionen', included: true, description: 'Komplett in Ihrem Design - kein JN Automation Logo sichtbar' },
      { name: 'REST API-Zugang', included: true, description: 'Anbindung an Ihre eigene Software möglich' },
      { name: 'Webhook Integrationen', included: true, description: 'Automatische Benachrichtigungen an andere Programme' },
      { name: 'HIPAA Compliance', included: true, description: 'Medizinische Daten nach höchstem Standard geschützt' },
      { name: 'Audit-Logs', included: true, description: 'Nachvollziehen wer was wann geändert hat' },
      { name: 'Dedizierter Account Manager', included: true, description: 'Persönlicher Ansprechpartner nur für Sie' },
      { name: 'SEPA & Rechnung als Zahlungsart', included: true, description: 'Kunden können per Lastschrift oder auf Rechnung zahlen' },
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Preise</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Transparente Preise. Keine versteckten Kosten.
            <br />
            <span className="text-white font-medium">Sie behalten 100% Ihrer Einnahmen.</span>
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={yearly ? 'text-gray-500' : 'text-white font-medium'}>
            Monatlich
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`w-14 h-7 rounded-full relative transition-colors ${
              yearly ? 'bg-white' : 'bg-zinc-700'
            }`}
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 bg-black rounded-full absolute top-1 transition-all ${
                yearly ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={yearly ? 'text-white font-medium' : 'text-gray-500'}>
            Jährlich
          </span>
          {yearly && (
            <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
              Spare bis zu €2.388
            </span>
          )}
        </div>

        {/* Enterprise Trial Banner */}
        <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-bold">14-Tage Enterprise Trial</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Teste alle Enterprise Features kostenlos - inkl. 50 SMS. Keine Kreditkarte erforderlich.
          </p>
          <Link
            to="/register?trial=enterprise"
            className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition"
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
                  ? 'border-white bg-zinc-900 shadow-2xl scale-105'
                  : 'border-zinc-800 bg-zinc-900/50'
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
                  <span className="inline-block text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {yearly ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        €{plan.yearlyMonthlyCost.toFixed(0)}
                      </span>
                      <span className="text-gray-400">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      €{plan.yearlyPrice} jährlich (spare €{calculateSavings(plan)})
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">€{plan.price}</span>
                      <span className="text-gray-400">/ Monat</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
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
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                {plan.id === 'enterprise' ? 'Enterprise testen' : 'Jetzt starten'}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 text-sm ${
                      feature.highlight ? 'bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 -mx-2' : ''
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        feature.highlight ? 'text-purple-400' : 'text-green-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <div className={feature.bold ? 'font-semibold text-white' : 'text-gray-300'}>
                        {feature.name}
                        {feature.value && (
                          <span className="ml-1 text-white font-medium">
                            ({feature.value})
                          </span>
                        )}
                        {feature.highlight && (
                          <span className="ml-2 text-xs text-purple-400 font-medium">
                            NUR ENTERPRISE
                          </span>
                        )}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {plan.notIncluded && plan.notIncluded.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <p className="text-xs text-gray-500 mb-2">Nicht enthalten:</p>
                  <ul className="space-y-2">
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-500">
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
        <div className="max-w-4xl mx-auto mb-20 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">SMS-Benachrichtigungen nur in Enterprise</h3>
              <p className="text-gray-300 mb-4">
                Reduziere No-Shows um bis zu 60% mit automatischen SMS-Erinnerungen 2h & 24h vor Terminen.
                Inklusive 500 SMS pro Monat (skalierbar mit Team-Größe: +50 SMS pro Mitarbeiter).
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">2h & 24h Erinnerungen</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Prioritäts-System</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Überschreitung möglich (€0.05/SMS)</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Email-Fallback automatisch</span>
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
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
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
              <div key={i} className="border border-zinc-800 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium">{item.q}</span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-400">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border border-zinc-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-2">Noch Fragen?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Schreiben Sie uns - wir antworten innerhalb von 24 Stunden.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a 
              href="mailto:support@jn-automation.de"
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition"
            >
              E-Mail schreiben
            </a>
            <Link
              to="/demo"
              className="px-5 py-2 bg-white text-black hover:bg-gray-100 rounded text-sm transition"
            >
              Demo ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
