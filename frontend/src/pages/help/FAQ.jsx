import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * FAQ Page - Häufig gestellte Fragen
 * Erweitert mit echten Fragen von Salons
 */
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: 'Für Salonbesitzer',
      questions: [
        {
          question: 'Wie viel kostet JN Business System?',
          answer: 'Wir bieten verschiedene Pläne an: Starter (€29/Monat), Pro (€49/Monat) und Enterprise (€99/Monat). Jeder Plan enthält eine 14-tägige kostenlose Testphase ohne Kreditkarte.'
        },
        {
          question: 'Wie schnell kann ich starten?',
          answer: 'Nach der Registrierung dauert das Setup ca. 10-15 Minuten. Sie fügen Ihre Services hinzu, legen Öffnungszeiten fest und können sofort Buchungen empfangen. Kein technisches Wissen erforderlich.'
        },
        {
          question: 'Brauche ich eine Website?',
          answer: 'Nein! Sie erhalten automatisch eine eigene Buchungsseite (z.B. /s/ihr-salon-name), die Sie in Social Media teilen können. Optional können Sie auch unser Booking-Widget auf Ihrer bestehenden Website einbinden.'
        },
        {
          question: 'Wie werden meine Kunden benachrichtigt?',
          answer: 'Automatische E-Mail-Benachrichtigungen bei Buchungsbestätigung, 24h vor dem Termin als Erinnerung und nach dem Termin mit Bewertungsanfrage. Alles vollautomatisch.'
        },
        {
          question: 'Kann ich mehrere Mitarbeiter verwalten?',
          answer: 'Ja! Sie können beliebig viele Mitarbeiter hinzufügen. Jeder Mitarbeiter bekommt einen eigenen Login und kann seine Termine selbst verwalten. Perfekt für Teams.'
        },
        {
          question: 'Was passiert, wenn ein Kunde nicht erscheint?',
          answer: 'Sie können No-Show-Termine markieren und optional eine Stornogebühr in den Einstellungen aktivieren. Wir tracken No-Show-Raten für Sie.'
        },
        {
          question: 'Kann ich Online-Zahlungen empfangen?',
          answer: 'Ja, über Stripe-Integration. Kunden können bei der Buchung direkt bezahlen. Sie erhalten Ihr Geld automatisch ausgezahlt (Stripe-Gebühren: 1,5% + €0,25 pro Transaktion).'
        },
        {
          question: 'Wie funktioniert die Testphase?',
          answer: '14 Tage kostenlos, keine Kreditkarte erforderlich. Sie haben Zugriff auf alle Features. Nach der Testphase wählen Sie einen Plan oder Ihr Account wird pausiert (keine Löschung Ihrer Daten).'
        }
      ]
    },
    {
      category: 'Für Kunden',
      questions: [
        {
          question: 'Muss ich mich registrieren, um zu buchen?',
          answer: 'Nein, Buchungen sind auch als Gast möglich. Sie geben nur Name, E-Mail und Telefonnummer an. Für ein eigenes Kundenkonto können Sie sich optional registrieren.'
        },
        {
          question: 'Wie kann ich meinen Termin ändern oder stornieren?',
          answer: 'In der Bestätigungs-E-Mail finden Sie einen Link zum Verwalten Ihres Termins. Dort können Sie umbuchen oder stornieren. Bei Stornierung weniger als 24h vorher kann eine Gebühr anfallen.'
        },
        {
          question: 'Bekomme ich eine Erinnerung?',
          answer: 'Ja, Sie erhalten 24 Stunden vor Ihrem Termin eine Erinnerungs-E-Mail mit allen Details (Datum, Uhrzeit, Adresse, Service).'
        },
        {
          question: 'Kann ich mehrere Services gleichzeitig buchen?',
          answer: 'Das hängt vom Salon ab. Viele Salons erlauben es, mehrere Services zu kombinieren (z.B. Schnitt + Färben). Die Zeiten werden automatisch zusammengerechnet.'
        },
        {
          question: 'Wie sicher sind meine Daten?',
          answer: 'Sehr sicher! Alle Daten werden verschlüsselt übertragen (SSL/TLS). Wir speichern nur das Nötigste und geben niemals Daten an Dritte weiter. DSGVO-konform.'
        }
      ]
    },
    {
      category: 'Technisches',
      questions: [
        {
          question: 'Funktioniert es auf dem Smartphone?',
          answer: 'Ja! Das gesamte System ist für Mobile optimiert. Sowohl Salonbesitzer als auch Kunden können alles bequem vom Smartphone aus nutzen.'
        },
        {
          question: 'Welche Browser werden unterstützt?',
          answer: 'Alle modernen Browser: Chrome, Firefox, Safari, Edge. Auch auf Tablets und iPads funktioniert alles einwandfrei.'
        },
        {
          question: 'Gibt es eine App?',
          answer: 'Aktuell nicht, aber unsere Web-App ist als Progressive Web App (PWA) entwickelt und funktioniert wie eine native App. Sie können sie auf Ihrem Homescreen speichern.'
        },
        {
          question: 'Kann ich meine Daten exportieren?',
          answer: 'Ja, als CEO/Admin können Sie jederzeit Backups erstellen und Ihre Daten als CSV exportieren. Ihre Daten gehören Ihnen!'
        },
        {
          question: 'Was passiert bei einem Ausfall?',
          answer: 'Wir haben 99,9% Uptime-Garantie. Unser System läuft auf Railway.app mit automatischen Backups. Bei Problemen werden Sie sofort informiert.'
        }
      ]
    },
    {
      category: 'Abrechnung & Support',
      questions: [
        {
          question: 'Kann ich monatlich kündigen?',
          answer: 'Ja, monatliche Pläne sind jederzeit kündbar. Jahrespläne laufen automatisch aus, keine automatische Verlängerung. Keine versteckten Kosten.'
        },
        {
          question: 'Gibt es einen Mengenrabatt?',
          answer: 'Ja, bei mehr als 5 Salons (z.B. Ketten) bieten wir individuelle Enterprise-Konditionen. Kontaktieren Sie uns für ein Angebot.'
        },
        {
          question: 'Wie schnell ist der Support?',
          answer: 'Support-Anfragen werden binnen 24h beantwortet (werktags). Pro & Enterprise-Kunden haben Prioritäts-Support mit Antwortzeit unter 4h.'
        },
        {
          question: 'Gibt es Schulungen?',
          answer: 'Ja! Wir bieten kostenlose Onboarding-Calls (30min) für alle neuen Kunden an. Video-Tutorials sind im Dashboard verfügbar.'
        },
        {
          question: 'Was ist nicht im Preis enthalten?',
          answer: 'Der Plan-Preis ist all-inclusive. Einzige Extra-Kosten: Stripe-Gebühren bei Online-Zahlungen (1,5% + €0,25 pro Transaktion) - diese zahlt optional der Kunde.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Häufig gestellte Fragen
          </h1>
          <p className="text-xl text-gray-600">
            Alles, was Sie über JN Business System wissen müssen
          </p>
        </div>

        {/* FAQ Sections */}
        {faqs.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((faq, index) => {
                const globalIndex = `${sectionIndex}-${index}`;
                const isOpen = openIndex === globalIndex;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFAQ(globalIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-8">
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="bg-indigo-50 rounded-lg p-8 text-center mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Noch Fragen?
          </h3>
          <p className="text-gray-600 mb-6">
            Unser Support-Team hilft Ihnen gerne weiter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@jn-automation.de"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              E-Mail schreiben
            </a>
            <a
              href="/demo"
              className="bg-white hover:bg-gray-50 text-indigo-600 font-medium py-3 px-6 rounded-lg border-2 border-indigo-600 transition-colors"
            >
              Demo buchen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
