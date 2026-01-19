import React from 'react';

const BookingWidget = ({ salonId }) => {
  const widgetCode = `<iframe src="https://yourapp.com/widget/${salonId}" width="100%" height="600px" style="border: none;"></iframe>`;

  return (
    <div className="booking-widget w-full max-w-full sm:max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-4 sm:p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Widget</p>
        <h2 className="text-2xl font-semibold text-gray-900">Buchungs-Widget</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Einbettungscode für deine Website. Auf allen Geräten responsiv und touch-optimiert.
      </p>
      <div className="space-y-3">
        <textarea
          readOnly
          value={widgetCode}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm leading-relaxed"
          style={{ fontSize: '16px', touchAction: 'manipulation' }}
        />
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(widgetCode)}
          className="w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition touch-manipulation"
        >
          Code kopieren
        </button>
      </div>
    </div>
  );
};

export default BookingWidget;
