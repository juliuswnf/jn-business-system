import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

export default function Customers() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await api.get(`/crm/customers?${params}`);

      if (res.data.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (error) {
      showNotification('Fehler beim Laden der Kunden', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showNotification]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const res = await api.get('/crm/stats');

      if (res.data.success) {
        const data = res.data;
        setStats(data.stats);
      }
    } catch (error) {
      captureError(error, { context: 'fetchStats' });
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  // Fetch customer details
  const handleViewCustomer = async (email) => {
    setSelectedCustomer(email);
    setLoadingDetails(true);

    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const res = await api.get(`/crm/customers/${encodeURIComponent(email)}`);

      if (res.data.success) {
        const data = res.data;
        setCustomerDetails(data.customer);
        }
    } catch (error) {
      showNotification('Fehler beim Laden der Kundendetails', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Get tier badge
  const getTierBadge = (tier) => {
    const badges = {
      vip: { label: 'VIP', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      gold: { label: 'Gold', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      regular: { label: 'Stammkunde', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      new: { label: 'Neu', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    };
    return badges[tier] || badges.new;
  };

  if (loading && customers.length === 0) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Kunden</h1>
          <p className="text-gray-200">Verwalten Sie Ihre Kunden und deren Buchungen</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-gray-200 text-sm mb-2">Gesamt Kunden</p>
          <p className="text-3xl font-bold text-white">{stats?.totalCustomers || customers.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-gray-200 text-sm mb-2">Neu diesen Monat</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-green-500">{stats?.newThisMonth || 0}</p>
            {stats?.customerGrowth !== undefined && (
              <span className={`text-sm ${stats.customerGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.customerGrowth >= 0 ? '+' : ''}{stats.customerGrowth}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-gray-200 text-sm mb-2">Durchschn. Kundenwert</p>
          <p className="text-3xl font-bold text-blue-500">€{stats?.avgLifetimeValue || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <p className="text-gray-200 text-sm mb-2">VIP Kunden</p>
          <p className="text-3xl font-bold text-purple-500">{stats?.tiers?.vip || 0}</p>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && customerDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white">{customerDetails.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getTierBadge(customerDetails.tier).color}`}>
                    {getTierBadge(customerDetails.tier).label}
                  </span>
                </div>
                <p className="text-gray-200">{customerDetails.email}</p>
                {customerDetails.phone && <p className="text-gray-200">{customerDetails.phone}</p>}
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerDetails(null); }} className="text-gray-200 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-8 flex justify-center"><LoadingSpinner /></div>
            ) : (
              <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{customerDetails.stats.totalBookings}</p>
                    <p className="text-sm text-gray-200">Buchungen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">€{customerDetails.stats.totalSpent}</p>
                    <p className="text-sm text-gray-200">Gesamtumsatz</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">€{customerDetails.stats.averageSpent}</p>
                    <p className="text-sm text-gray-200">Pro Besuch</p>
                  </div>
                </div>

                {/* Favorite Services */}
                {customerDetails.favoriteServices?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-200 mb-2">Lieblingsleistungen</h3>
                    <div className="flex flex-wrap gap-2">
                      {customerDetails.favoriteServices.map((s, i) => (
                        <span key={i} className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                          {s.name} ({s.count}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Bookings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-200 mb-2">Letzte Buchungen</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerDetails.bookings?.slice(0, 10).map((b, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{b.service}</p>
                          <p className="text-sm text-gray-200">
                            {new Date(b.date).toLocaleDateString('de-DE')}
                            {b.employee && ` • ${b.employee}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">€{b.price}</p>
                          <p className={`text-xs ${b.status === 'completed' ? 'text-green-400' : b.status === 'cancelled' ? 'text-red-400' : 'text-gray-200'}`}>
                            {b.status === 'completed' ? 'Abgeschlossen' : b.status === 'cancelled' ? 'Abgesagt' : b.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <input
            type="text"
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Kunde</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Kontakt</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Buchungen</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Umsatz</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-200">
                    {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-200">
                        Seit {new Date(customer.firstBooking).toLocaleDateString('de-DE')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{customer.email}</p>
                      {customer.phone && <p className="text-sm text-gray-200">{customer.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{customer.bookingCount}</p>
                      <p className="text-xs text-gray-500">
                        {customer.completedBookings} abgeschlossen
                      </p>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">€{customer.totalSpent?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getTierBadge(customer.tier).color}`}>
                        {getTierBadge(customer.tier).label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewCustomer(customer.email)}
                        className="text-red-500 hover:text-red-400 text-sm font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
