import React, { useMemo, useState } from 'react';

const recipientOptions = [
  'Alle Kunden',
  'Kunden der letzten 30 Tage',
  'No-Shows'
];

const initialCampaigns = [
  {
    id: 'sms-1',
    date: '2026-03-04 10:20',
    preview: 'Erinnerung: Dein Termin ist morgen um 14:00 Uhr. Bis bald!',
    recipients: 68,
    status: 'Gesendet'
  },
  {
    id: 'sms-2',
    date: '2026-03-02 16:40',
    preview: 'Letzter freier Slot heute um 18:30 Uhr – jetzt buchen.',
    recipients: 34,
    status: 'Gesendet'
  },
  {
    id: 'sms-3',
    date: '2026-02-28 09:10',
    preview: 'Wir vermissen dich! Buche jetzt deinen nächsten Termin.',
    recipients: 52,
    status: 'Geplant'
  }
];

export default function SmsManager() {
  const [recipientGroup, setRecipientGroup] = useState(recipientOptions[0]);
  const [message, setMessage] = useState('');
  const [campaigns] = useState(initialCampaigns);

  const maxChars = 160;
  const charsLeft = maxChars - message.length;

  const usageLabel = useMemo(() => {
    const used = 500 - 420;
    return `${used}/500 versendet`;
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">SMS-Versand</h1>
        <p className="text-sm text-gray-500">Enterprise-Modul für Kampagnen und Erinnerungen per SMS.</p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">Verbleibende SMS diesen Monat</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-2xl font-semibold tracking-tight text-gray-900">420</p>
          <p className="text-sm text-gray-500">{usageLabel}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Neue SMS-Kampagne</h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="sms-recipients" className="mb-1 block text-sm font-medium text-gray-700">
              Empfänger
            </label>
            <select
              id="sms-recipients"
              value={recipientGroup}
              onChange={(event) => setRecipientGroup(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
            >
              {recipientOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sms-message" className="mb-1 block text-sm font-medium text-gray-700">
              Nachricht
            </label>
            <textarea
              id="sms-message"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, maxChars))}
              rows={4}
              maxLength={maxChars}
              placeholder="Schreibe deine SMS-Nachricht..."
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
            />
            <p className={`mt-1 text-xs ${charsLeft < 20 ? 'text-amber-600' : 'text-gray-500'}`}>
              {message.length}/{maxChars} Zeichen
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            SMS Senden
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Letzte SMS-Kampagnen</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Datum</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Text-Vorschau</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Empfänger</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-3 py-2 text-gray-700">{campaign.date}</td>
                  <td className="px-3 py-2 text-gray-700">{campaign.preview}</td>
                  <td className="px-3 py-2 text-gray-700">{campaign.recipients}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
