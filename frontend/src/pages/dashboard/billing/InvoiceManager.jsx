import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const sepaMandates = [
  { id: 'm1', customer: 'Anna Müller', iban: 'DE12 •••• •••• •••• 1234', since: '2025-11-10' },
  { id: 'm2', customer: 'Lukas Schneider', iban: 'DE78 •••• •••• •••• 9831', since: '2026-01-04' },
  { id: 'm3', customer: 'Sarah Wagner', iban: 'DE44 •••• •••• •••• 5572', since: '2026-02-16' }
];

const invoices = [
  { id: 'INV-2026-031', date: '2026-03-03', customer: 'Anna Müller', amount: '280,00 €' },
  { id: 'INV-2026-024', date: '2026-03-01', customer: 'Lukas Schneider', amount: '150,00 €' },
  { id: 'INV-2026-012', date: '2026-02-24', customer: 'Sarah Wagner', amount: '320,00 €' }
];

export default function InvoiceManager() {
  const [activeTab, setActiveTab] = useState('mandates');

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">SEPA & Rechnungen</h1>
        <p className="text-sm text-gray-500">Enterprise-Modul für Lastschriftmandate und Rechnungsprozesse.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Offene Rechnungen</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">1.250 €</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Erfolgreiche SEPA-Einzüge diesen Monat</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">4.800 €</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('mandates')}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
              activeTab === 'mandates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            SEPA-Mandate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
              activeTab === 'invoices' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Rechnungen schreiben
          </button>
        </div>

        {activeTab === 'mandates' ? (
          <div className="space-y-3">
            {sepaMandates.map((mandate) => (
              <div key={mandate.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{mandate.customer}</p>
                <p className="text-sm text-gray-600">{mandate.iban}</p>
                <p className="mt-1 text-xs text-gray-500">Aktiv seit {mandate.since}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toast('Rechnungserstellung wird in Kürze verfügbar sein.', { icon: '📋' })}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              Neue Rechnung erstellen
            </button>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Rechnung</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Datum</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Kunde</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Betrag</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-3 py-2 text-gray-700">{invoice.id}</td>
                      <td className="px-3 py-2 text-gray-700">{invoice.date}</td>
                      <td className="px-3 py-2 text-gray-700">{invoice.customer}</td>
                      <td className="px-3 py-2 text-gray-700">{invoice.amount}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toast('PDF-Download wird in Kürze verfügbar sein.', { icon: '📄' })}
                          className="text-xs font-medium text-gray-700 underline hover:text-gray-900"
                        >
                          PDF herunterladen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
