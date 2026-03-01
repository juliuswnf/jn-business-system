import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/api';

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
        `${API_URL}/bookings/public/salons?page=${pagination.page}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setSalons(data.salons);
        setFilteredSalons(data.salons);
        setPagination(data.pagination);
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* SEO Header */}
      <div className="bg-zinc-50 border-b border-zinc-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            Dienstleister in deiner Nähe
          </h1>
          <p className="text-xl text-zinc-600 mb-8">
            Entdecke Top-Anbieter und buche online deinen nächsten Termin
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Name oder Stadt eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white border border-zinc-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Salons Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-50 rounded-lg shadow-sm p-6 animate-pulse border border-zinc-200">
                <div className="h-6 bg-zinc-50 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-zinc-50 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-zinc-50 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-lg">
              Keine Anbieter gefunden. Versuche einen anderen Suchbegriff.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-zinc-600">
                {filteredSalons.length} {filteredSalons.length === 1 ? 'Anbieter' : 'Anbieter'} gefunden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalons.map((salon) => (
                <div
                  key={salon._id}
                  className="bg-zinc-50 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-zinc-200"
                >
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                    {salon.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-zinc-600 mb-3">
                    <MapPinIcon className="h-5 w-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {salon.address?.street && <div>{salon.address.street}</div>}
                      <div>
                        {salon.address?.zip} {salon.city || salon.address?.city}
                      </div>
                    </div>
                  </div>

                  {/* Service Count */}
                  {salon.serviceCount > 0 && (
                    <div className="text-sm text-zinc-600 mb-4">
                      {salon.serviceCount} {salon.serviceCount === 1 ? 'Service' : 'Services'} verfügbar
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(`/s/${salon.slug}`)}
                    className="w-full bg-white hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100"
                >
                  Zurück
                </button>
                <span className="px-4 py-2 text-zinc-600">
                  Seite {pagination.page} von {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* SEO Content Section */}
      <div className="bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">
              Online Termine bei Top-Dienstleistern buchen
            </h2>
            <p className="text-zinc-600 mb-4">
              Finde den perfekten Anbieter in deiner Stadt und buche deinen Termin bequem online -
              24/7 verfügbar, sofortige Bestätigung. Alle Unternehmen auf unserer Plattform bieten
              professionelle Services und moderne Buchungsmöglichkeiten.
            </p>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Warum online buchen?
            </h3>
            <ul className="space-y-2 text-zinc-600">
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
