import { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiScissors, FiChevronRight } from 'react-icons/fi';

/**
 * SalonSelector Component
 * Wiederverwendbare Komponente für Salon-Auswahl
 * Wird verwendet in:
 * - Customer Booking Flow
 * - Public Booking Pages
 * - Überall wo Salons ausgewählt werden müssen
 */
const SalonSelector = ({ onSelect, selectedSalonId = null, className = '' }) => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/public/salons?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.salons) {
          setSalons(data.salons);
        }
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchSalons = async (query) => {
    if (query.length < 2) {
      fetchSalons();
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/bookings/public/salons/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.salons) {
          setSalons(data.salons);
        }
      }
    } catch (error) {
      console.error('Error searching salons:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      searchSalons(query);
    } else if (query.length === 0) {
      fetchSalons();
    }
  };

  const filteredSalons = searchQuery.length >= 2 
    ? salons
    : salons;

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Salon suchen (Name, Stadt...)"
          className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:border-zinc-500 focus:outline-none transition"
        />
      </div>

      {/* Salon List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-4">Lade Salons...</p>
        </div>
      ) : filteredSalons.length === 0 ? (
        <div className="text-center py-12">
          <FiScissors className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-gray-400">Keine Salons gefunden</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery ? 'Versuche es mit einem anderen Suchbegriff' : 'Aktuell sind keine Salons verfügbar'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
          {filteredSalons.map((salon) => (
            <button
              key={salon._id}
              onClick={() => onSelect(salon)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition text-left ${
                selectedSalonId === salon._id
                  ? 'border-white bg-zinc-800'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{salon.name}</h3>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiMapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {salon.address?.street && `${salon.address.street}, `}
                      {salon.address?.zip} {salon.city || salon.address?.city}
                    </span>
                  </div>
                  
                  {/* Service Count */}
                  {salon.serviceCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiScissors className="w-4 h-4" />
                      <span>{salon.serviceCount} {salon.serviceCount === 1 ? 'Service' : 'Services'}</span>
                    </div>
                  )}
                </div>
                
                {/* Arrow Icon */}
                <FiChevronRight className={`w-5 h-5 flex-shrink-0 transition ${
                  selectedSalonId === salon._id ? 'text-white' : 'text-gray-400'
                }`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredSalons.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          {filteredSalons.length} {filteredSalons.length === 1 ? 'Salon' : 'Salons'} gefunden
        </div>
      )}
    </div>
  );
};

export default SalonSelector;
