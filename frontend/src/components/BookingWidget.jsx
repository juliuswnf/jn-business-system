import React from 'react';

const BookingWidget = ({ salonId }) => {
  const widgetCode = `<iframe src="https://yourapp.com/widget/${salonId}" width="100%" height="600px" style="border: none;"></iframe>`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Buchungs-Widget</h2>
      <div className="space-y-4">
        <textarea
          readOnly
          value={widgetCode}
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
        />
        <button
          onClick={() => navigator.clipboard.writeText(widgetCode)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Code kopieren
        </button>
      </div>
    </div>
  );
};

export default BookingWidget;