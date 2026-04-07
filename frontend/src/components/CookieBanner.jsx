import { useState } from 'react';
import { Link } from 'react-router-dom';

// Consent is stored in module scope (in-memory only, resets on page reload)
let cookieConsentGiven = false;

export default function CookieBanner() {
  const [visible, setVisible] = useState(!cookieConsentGiven);

  if (!visible) return null;

  const handleAccept = () => {
    cookieConsentGiven = true;
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 border-t shadow-lg rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-700">
          Wir verwenden nur technisch notwendige Cookies. Keine Tracking-Cookies.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/datenschutz"
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition"
          >
            Mehr erfahren
          </Link>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
