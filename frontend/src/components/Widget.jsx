import { useState } from 'react';
import BookingFlow from './BookingFlow';

const Widget = ({ salonSlug }) => {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Termin buchen</h2>
      
      {!showBooking ? (
        <button
          onClick={() => setShowBooking(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Jetzt buchen
        </button>
      ) : (
        <div>
          <button
            onClick={() => setShowBooking(false)}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Zurück
          </button>
          <BookingFlow />
        </div>
      )}
    </div>
  );
};

export default Widget;
