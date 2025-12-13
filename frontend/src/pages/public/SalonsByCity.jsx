import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPinIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Stadt-spezifische Dienstleister Page - SEO optimiert
 * Dynamic Route: /salons/[city]
 * Beispiele: /salons/muenchen, /salons/berlin, /salons/hamburg
 */
const SalonsByCity = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // City name mapping (URL-friendly to display name)
  const cityNames = {
    'muenchen': 'München',
    'berlin': 'Berlin',
    'hamburg': 'Hamburg',
    'koeln': 'Köln',
    'frankfurt': 'Frankfurt',
    'stuttgart': 'Stuttgart',
    'duesseldorf': 'Düsseldorf',
    'dortmund': 'Dortmund',
    'essen': 'Essen',
    'leipzig': 'Leipzig',
    'bremen': 'Bremen',
    'dresden': 'Dresden',
    'hannover': 'Hannover',
    'nuernberg': 'Nürnberg'
  };

  const displayCityName = cityNames[city?.toLowerCase()] || city;

  useEffect(() => {
    fetchSalonsByCity();
  }, [city]);

  const fetchSalonsByCity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/public/salons/city/${displayCityName}`
      );
      const data = await response.json();

      if (data.success) {
        setSalons(data.salons);
      } else {
        setError('Keine Anbieter in dieser Stadt gefunden.');
      }
    } catch (err) {
      console.error('Error fetching salons:', err);
      setError('Fehler beim Laden der Anbieter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            to="/salons"
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Alle Anbieter
          </Link>

          <h1 className="text-4xl font-bold mb-4">
            Dienstleister in {displayCityName}
          </h1>
          <p className="text-xl text-indigo-100">
            Die besten Anbieter in {displayCityName} - Online Termin buchen
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">{error}</p>
            <Link
              to="/salons"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              Aktuell keine Anbieter in {displayCityName} verfügbar.
            </p>
            <Link
              to="/salons"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Andere Städte durchsuchen
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {salons.length} {salons.length === 1 ? 'Anbieter' : 'Anbieter'} in {displayCityName}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((salon) => (
                <div
                  key={salon._id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {salon.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-gray-600 mb-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {salon.address?.street && <div>{salon.address.street}</div>}
                      <div>
                        {salon.address?.zip} {salon.city || salon.address?.city}
                      </div>
                    </div>
                  </div>

                  {/* Service Count */}
                  {salon.serviceCount > 0 && (
                    <div className="text-sm text-gray-500 mb-4">
                      {salon.serviceCount} {salon.serviceCount === 1 ? 'Service' : 'Services'} verfügbar
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(`/s/${salon.slug}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Jetzt buchen
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SEO Content Section */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dienstleister {displayCityName} - Online Termin buchen
            </h2>
            <p className="text-gray-600 mb-4">
              Entdecke die besten Dienstleister in {displayCityName}. Buche deinen Termin 
              bequem online - 24/7 verfügbar mit sofortiger Bestätigung. Egal ob Beratung, 
              Behandlung, Training oder Wellness - finde den perfekten Anbieter in deiner Nähe.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Vorteile der Online-Buchung in {displayCityName}
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Sofortige Terminbestätigung ohne Wartezeit</li>
              <li>✓ Übersicht aller verfügbaren Termine</li>
              <li>✓ Einfache Verwaltung und Umbuchung</li>
              <li>✓ Top-bewertete Anbieter in {displayCityName}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonsByCity;
