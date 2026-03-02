import React from 'react';
import { Link } from 'react-router-dom';

export default function AGB() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 py-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="text-zinc-300 hover:text-zinc-900 text-sm mb-4 inline-block" aria-label="Zurück zur Startseite">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          <p className="text-zinc-700">
            Stand: Dezember 2024 | JN Business System
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">

          {/* §1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§1 Geltungsbereich</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen
                JN Business System (nachfolgend "Anbieter") und dem Kunden (nachfolgend "Kunde")
                über die Nutzung der Online-Buchungssoftware.
              </p>
              <p>
                (2) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn,
                der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
              </p>
            </div>
          </section>

          {/* §2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§2 Vertragsgegenstand</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Gegenstand des Vertrages ist die Bereitstellung der JN Business System
                Buchungssoftware als Software-as-a-Service (SaaS) zur Online-Terminbuchung
                für Salons, Studios und Dienstleistungsbetriebe.
              </p>
              <p>
                (2) Der Funktionsumfang richtet sich nach dem vom Kunden gewählten Tarif
                (Starter, Professional, Enterprise).
              </p>
            </div>
          </section>

          {/* §3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§3 Kostenlose Testphase</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Jeder Neukunde erhält eine <strong className="text-zinc-900">kostenlose 30-tägige Testphase</strong>
                mit vollem Funktionsumfang des gewählten Tarifs.
              </p>
              <p>
                (2) Während der Testphase ist keine Zahlungsmethode erforderlich.
              </p>
              <p>
                (3) Nach Ablauf der Testphase endet der Zugang automatisch, es sei denn,
                der Kunde entscheidet sich für ein kostenpflichtiges Abonnement.
              </p>
            </div>
          </section>

          {/* §4 - GELD-ZURÜCK-GARANTIE */}
          <section className="mb-10 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              §4 Geld-zurück-Garantie (30 Tage)
            </h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) <strong className="text-zinc-900">Garantie:</strong> Der Kunde hat das Recht,
                innerhalb von <strong className="text-zinc-900">30 Tagen nach der ersten Zahlung</strong>
                ohne Angabe von Gründen vom Vertrag zurückzutreten und eine vollständige
                Rückerstattung zu erhalten.
              </p>
              <p>
                (2) <strong className="text-zinc-900">Beantragung:</strong> Die Rückerstattung kann
                per E-Mail an <a href="mailto:support@jn-business-system.de" className="text-zinc-300 hover:text-zinc-900 hover:underline">
                support@jn-business-system.de</a> beantragt werden.
              </p>
              <p>
                (3) <strong className="text-zinc-900">Bearbeitung:</strong> Die Rückerstattung erfolgt
                innerhalb von 14 Werktagen auf das ursprüngliche Zahlungsmittel.
              </p>
              <p>
                (4) <strong className="text-zinc-900">Umfang:</strong> Erstattet wird der volle Betrag
                der ersten Monatsgebühr. Bei Jahreszahlung wird der anteilige Monatsbetrag erstattet.
              </p>
              <p>
                (5) Diese Garantie gilt zusätzlich zu Ihrem gesetzlichen Widerrufsrecht.
              </p>
            </div>
          </section>

          {/* §5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§5 Preise und Zahlungsbedingungen</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Die aktuellen Preise sind auf der Website unter
                <Link to="/pricing" className="text-zinc-300 hover:text-zinc-900 hover:underline ml-1">/pricing</Link> einsehbar.
              </p>
              <p>
                (2) Alle Preise verstehen sich netto zzgl. der gesetzlichen Mehrwertsteuer.
              </p>
              <p>
                (3) Die Zahlung erfolgt monatlich oder jährlich im Voraus per SEPA-Lastschrift,
                Kreditkarte oder Sofortüberweisung.
              </p>
              <p>
                (4) Bei Zahlungsverzug behält sich der Anbieter vor, den Zugang zur Software
                vorübergehend zu sperren.
              </p>
            </div>
          </section>

          {/* §6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§6 Vertragslaufzeit und Kündigung</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) <strong className="text-zinc-900">Monatliche Zahlung:</strong> Der Vertrag verlängert
                sich automatisch um einen weiteren Monat, wenn er nicht vor Ablauf des Abrechnungszeitraums
                gekündigt wird. <strong className="text-zinc-900">Keine Mindestlaufzeit.</strong>
              </p>
              <p>
                (2) <strong className="text-zinc-900">Jährliche Zahlung:</strong> Der Vertrag verlängert
                sich automatisch um ein weiteres Jahr. Kündigung bis 30 Tage vor Ablauf möglich.
              </p>
              <p>
                (3) Die Kündigung kann jederzeit im Kontrollpanel oder per E-Mail an
                <a href="mailto:support@jn-business-system.de" className="text-zinc-300 hover:text-zinc-900 hover:underline ml-1">
                support@jn-business-system.de</a> erfolgen.
              </p>
              <p>
                (4) Nach Kündigung hat der Kunde 30 Tage Zeit, seine Daten zu exportieren.
              </p>
            </div>
          </section>

          {/* §7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§7 Datenschutz</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Der Anbieter verarbeitet personenbezogene Daten gemäß der
                <Link to="/datenschutz" className="text-zinc-300 hover:text-zinc-900 hover:underline ml-1">Datenschutzerklärung</Link>
                und im Einklang mit der DSGVO.
              </p>
              <p>
                (2) Die Daten werden auf Servern in Deutschland (Frankfurt) gespeichert.
              </p>
              <p>
                (3) Ein Auftragsverarbeitungsvertrag (AVV) kann auf Anfrage bereitgestellt werden.
              </p>
            </div>
          </section>

          {/* §8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§8 Verfügbarkeit</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Der Anbieter strebt eine Verfügbarkeit von 99,5% pro Jahr an.
              </p>
              <p>
                (2) Geplante Wartungsarbeiten werden mindestens 48 Stunden im Voraus angekündigt.
              </p>
              <p>
                (3) Bei Ausfällen von mehr als 24 Stunden erfolgt eine anteilige Gutschrift.
              </p>
            </div>
          </section>

          {/* §9 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§9 Haftung</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
              </p>
              <p>
                (2) Der Anbieter haftet nicht für entgangenen Gewinn, Datenverlust oder
                mittelbare Schäden, soweit gesetzlich zulässig.
              </p>
              <p>
                (3) Die Haftung ist auf die in den letzten 12 Monaten gezahlten Gebühren begrenzt.
              </p>
            </div>
          </section>

          {/* §10 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§10 Widerrufsrecht</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen
                den Vertrag zu widerrufen.
              </p>
              <p>
                (2) Der Widerruf ist zu richten an:<br />
                <span className="text-zinc-900">
                  JN Business System<br />
                  E-Mail: support@jn-business-system.de
                </span>
              </p>
              <p>
                (3) Mit Beginn der Nutzung der Software während der Widerrufsfrist erklärt
                sich der Kunde damit einverstanden, dass der Anbieter vor Ablauf der
                Widerrufsfrist mit der Vertragserfüllung beginnt.
              </p>
            </div>
          </section>

          {/* §11 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">§11 Schlussbestimmungen</h2>
            <div className="text-zinc-600 space-y-3">
              <p>
                (1) Es gilt das Recht der Bundesrepublik Deutschland.
              </p>
              <p>
                (2) Gerichtsstand für alle Streitigkeiten ist, soweit gesetzlich zulässig,
                der Sitz des Anbieters.
              </p>
              <p>
                (3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit
                der übrigen Bestimmungen unberührt.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mt-12 pt-8 border-t border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Kontakt</h2>
            <div className="text-zinc-600">
              <p>
                Bei Fragen zu diesen AGB wenden Sie sich bitte an:<br />
                <a href="mailto:support@jn-business-system.de" className="text-zinc-300 hover:text-zinc-900 hover:underline">
                  support@jn-business-system.de
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
