import React from 'react';
import SEO from '../../components/SEO';

export default function Impressum() {
  return (
    <div className="py-16 px-4">
      <SEO
        title="Impressum - JN Business System"
        description="Impressum und Anbieterkennzeichnung von JN Business System gemäß § 5 TMG."
        url="/impressum"
      />
      <div className="max-w-3xl mx-auto text-left">
        <h1 className="text-3xl font-semibold mb-10">Impressum</h1>

        {/* § 5 TMG */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Angaben gemäß § 5 TMG</h2>
          <p className="text-gray-700 leading-relaxed">
            JN Business System<br />
            Inhaber: Julius <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[NACHNAME HIER EINTRAGEN]</span><br />
            <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[STRASSE UND HAUSNUMMER HIER EINTRAGEN]</span><br />
            <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[PLZ ORT HIER EINTRAGEN]</span>
          </p>
        </section>

        {/* Kontakt */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontakt</h2>
          <p className="text-gray-700 leading-relaxed">
            Telefon: <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[TELEFONNUMMER HIER EINTRAGEN]</span><br />
            E-Mail: <a href="mailto:support@jn-business-system.de" className="text-blue-600 hover:underline">support@jn-business-system.de</a>
          </p>
        </section>

        {/* Verantwortlich */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p className="text-gray-700 leading-relaxed">
            Julius <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[NACHNAME HIER EINTRAGEN]</span><br />
            <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[STRASSE UND HAUSNUMMER HIER EINTRAGEN]</span><br />
            <span className="bg-yellow-100 text-yellow-800 px-1 rounded">[PLZ ORT HIER EINTRAGEN]</span>
          </p>
        </section>

        {/* Haftungsausschluss */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Haftungsausschluss</h2>

          <h3 className="text-base font-medium text-gray-800 mb-2">Haftung für Inhalte</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
            diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten
            Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden
            wir diese Inhalte umgehend entfernen.
          </p>

          <h3 className="text-base font-medium text-gray-800 mb-2">Haftung für Links</h3>
          <p className="text-gray-700 leading-relaxed">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
            Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der
            verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
            zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
            entfernen.
          </p>
        </section>

        {/* Urheberrecht */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Urheberrecht</h2>
          <p className="text-gray-700 leading-relaxed">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
            nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf
            dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter
            beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie
            trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
            entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
            Inhalte umgehend entfernen.
          </p>
        </section>

        <p className="text-xs text-gray-400 mt-10">Stand: April 2026</p>
      </div>
    </div>
  );
}

