import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MultiLocationDashboard() {
  const { showNotification } = useNotification();
  const [locations, setLocations] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', email: '', businessType: 'hair-salon' });
  const [adding, setAdding] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLocations(data.locations);
        setUpgradeRequired(false);
      } else if (data.upgradeRequired) {
        setUpgradeRequired(true);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch consolidated dashboard
  const fetchDashboard = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/locations/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDashboard(data.dashboard);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchDashboard();
  }, []);

  // Add new location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocation)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Standort hinzugefügt', 'success');
        setShowAddModal(false);
        setNewLocation({ name: '', email: '', businessType: 'hair-salon' });
        fetchLocations();
        fetchDashboard();
      } else {
        showNotification(data.error || 'Fehler', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler', 'error');
    } finally {
      setAdding(false);
    }
  };

  // Switch location
  const handleSwitchLocation = async (salonId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/locations/${salonId}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Store selected location in localStorage
        localStorage.setItem('activeLocationId', salonId);
        showNotification(data.message, 'success');
        // Reload to update context
        window.location.reload();
      }
    } catch (error) {
      showNotification('Fehler beim Wechseln', 'error');
    }
  };

  // Remove location
  const handleRemoveLocation = async (salonId, name) => {
    if (!confirm(`Möchten Sie "${name}" wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/locations/${salonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('Standort entfernt', 'success');
        fetchLocations();
        fetchDashboard();
      } else {
        showNotification(data.error || 'Fehler', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler', 'error');
    }
  };

  const businessTypes = [
    { value: 'hair-salon', label: 'Friseur' },
    { value: 'beauty-salon', label: 'Beauty-Studio' },
    { value: 'spa-wellness', label: 'Spa & Wellness' },
    { value: 'tattoo-piercing', label: 'Tattoo & Piercing' },
    { value: 'nail-salon', label: 'Nagelstudio' },
    { value: 'barbershop', label: 'Barbershop' },
    { value: 'massage-therapy', label: 'Massage-Praxis' },
    { value: 'physiotherapy', label: 'Physiotherapie' },
    { value: 'personal-training', label: 'Personal Training' },
    { value: 'yoga-studio', label: 'Yoga-Studio' },
    { value: 'medical-aesthetics', label: 'Medizinische Ästhetik' },
    { value: 'other', label: 'Sonstiges' }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (upgradeRequired) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Multi-Location</h1>
          <p className="text-gray-400 mb-6">
            Verwalten Sie bis zu 5 Standorte von einem Dashboard aus.
            Diese Funktion ist exklusiv für Enterprise-Kunden.
          </p>
          <Link
            to="/pricing"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Zu Enterprise upgraden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Multi-Location Dashboard</h1>
          <p className="text-gray-400">Alle Ihre Standorte auf einen Blick</p>
        </div>
        {locations.length < 5 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            + Standort hinzufügen
          </button>
        )}
      </div>

      {/* Consolidated Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Standorte</p>
            <p className="text-3xl font-bold text-white">{dashboard.overview.locationCount}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Termine heute</p>
            <p className="text-3xl font-bold text-blue-500">{dashboard.overview.todayBookings}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Buchungen diesen Monat</p>
            <p className="text-3xl font-bold text-green-500">{dashboard.overview.monthlyBookings}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Umsatz diesen Monat</p>
            <p className="text-3xl font-bold text-purple-500">€{dashboard.overview.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {locations.map(location => {
          const locationData = dashboard?.byLocation?.find(l => l.salonId === location.id);
          return (
            <div key={location.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{location.name}</h3>
                      {location.isPrimary && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Haupt</span>
                      )}
                    </div>
                    {location.address?.city && (
                      <p className="text-sm text-gray-400">{location.address.city}</p>
                    )}
                  </div>
                  <span className={`w-3 h-3 rounded-full ${location.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                </div>

                {locationData && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{locationData.bookings}</p>
                      <p className="text-xs text-gray-500">Buchungen</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">€{locationData.revenue}</p>
                      <p className="text-xs text-gray-500">Umsatz</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSwitchLocation(location.id)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition"
                  >
                    Öffnen
                  </button>
                  {!location.isPrimary && (
                    <button
                      onClick={() => handleRemoveLocation(location.id, location.name)}
                      className="text-red-500 hover:text-red-400 p-2"
                      title="Entfernen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Location Card */}
        {locations.length < 5 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-gray-600 transition"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-gray-400">Standort hinzufügen</p>
            <p className="text-xs text-gray-500 mt-1">{5 - locations.length} verfügbar</p>
          </button>
        )}
      </div>

      {/* Performance Comparison */}
      {dashboard?.byLocation && dashboard.byLocation.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Standort-Vergleich</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Standort</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Buchungen</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Abgeschlossen</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Storniert</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.byLocation.map((loc, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-3 px-4 text-white font-medium">{loc.name}</td>
                    <td className="py-3 px-4 text-right text-white">{loc.bookings}</td>
                    <td className="py-3 px-4 text-right text-green-400">{loc.completed}</td>
                    <td className="py-3 px-4 text-right text-red-400">{loc.cancelled}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">€{loc.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Neuen Standort hinzufügen</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  required
                  placeholder="z.B. Standort Mitte"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">E-Mail</label>
                <input
                  type="email"
                  value={newLocation.email}
                  onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
                  required
                  placeholder="standort-mitte@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Geschäftsart</label>
                <select
                  value={newLocation.businessType}
                  onChange={(e) => setNewLocation({ ...newLocation, businessType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
                >
                  {adding ? 'Wird erstellt...' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
