import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPinIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * /salons Landing Page - SEO-optimierte Dienstleister-Übersicht
 * Marketplace Discovery für alle aktiven Unternehmen
 */
const Salons = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  // Fetch salons from API
  useEffect(() => {
    fetchSalons();
  }, [pagination.page]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/public/salons?page=${pagination.page}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setSalons(data.salons);
        setFilteredSalons(data.salons);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSalons(salons);
    } else {
      const filtered = salons.filter(salon =>
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalons(filtered);
    }
  }, [searchQuery, salons]);

  // Get unique cities for quick filters
  const cities = [...new Set(salons.map(s => s.city || s.address?.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* SEO Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            Dienstleister in deiner Nähe
          </h1>
          <p className="text-xl text-indigo-100 mb-8">
            Entdecke Top-Anbieter und buche online deinen nächsten Termin
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Name oder Stadt eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* City Quick Filters */}
      {cities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                Beliebte Städte:
              </span>
              {cities.slice(0, 8).map(city => (
                <Link
                  key={city}
                  to={`/salons/${city.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Salons Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Keine Anbieter gefunden. Versuche einen anderen Suchbegriff.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredSalons.length} {filteredSalons.length === 1 ? 'Anbieter' : 'Anbieter'} gefunden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalons.map((salon) => (
                <div
                  key={salon._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {salon.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 mb-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {salon.address?.street && <div>{salon.address.street}</div>}
                      <div>
                        {salon.address?.zip} {salon.city || salon.address?.city}
                      </div>
                    </div>
                  </div>

                  {/* Service Count */}
                  {salon.serviceCount > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Zurück
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Seite {pagination.page} von {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* SEO Content Section */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Online Termine bei Top-Dienstleistern buchen
            </h2>
            <p className="text-gray-600 mb-4">
              Finde den perfekten Anbieter in deiner Stadt und buche deinen Termin bequem online - 
              24/7 verfügbar, sofortige Bestätigung. Alle Unternehmen auf unserer Plattform bieten 
              professionelle Services und moderne Buchungsmöglichkeiten.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Warum online buchen?
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Sofortige Terminbestätigung</li>
              <li>✓ Keine Wartezeiten am Telefon</li>
              <li>✓ Übersicht aller verfügbaren Zeiten</li>
              <li>✓ Einfache Verwaltung deiner Termine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salons;
