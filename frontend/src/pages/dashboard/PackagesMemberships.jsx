import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function PackagesMemberships() {
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'memberships'
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const salonId = JSON.parse(atob(token.split('.')[1])).salonId;
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch packages
      const packagesRes = await axios.get(
        `${API_URL}/api/workflows/packages/${salonId}`,
        { headers }
      );
      setPackages(packagesRes.data.data);

      // Fetch memberships
      const membershipsRes = await axios.get(
        `${API_URL}/api/workflows/memberships/${salonId}`,
        { headers }
      );
      setMemberships(membershipsRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
      setLoading(false);
    }
  };

  const handleCancelMembership = async (id, reason) => {
    if (!confirm('Membership wirklich kÃ¼ndigen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/workflows/memberships/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Membership gekÃ¼ndigt');
      fetchData();
    } catch (error) {
      console.error('Error cancelling membership:', error);
      toast.error('Fehler beim KÃ¼ndigen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Packages & Memberships</h1>
        <p className="text-gray-600">Verwalte Packages und wiederkehrende Memberships</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'packages'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ðŸŽ Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'memberships'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ðŸ’Ž Memberships ({memberships.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'packages' ? (
        <PackagesTab packages={packages} />
      ) : (
        <MembershipsTab memberships={memberships} onCancel={handleCancelMembership} />
      )}
    </div>
  );
}

function PackagesTab({ packages }) {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.active;
  };

  const activePackages = packages.filter(p => p.status === 'active');
  const inactivePackages = packages.filter(p => p.status !== 'active');

  return (
    <div>
      {/* Active Packages */}
      {activePackages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Aktive Packages ({activePackages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePackages.map((pkg) => (
              <motion.div
                key={pkg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-green-500 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">ðŸŽ</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pkg.status)}`}>
                    {pkg.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  {pkg.customerId?.firstName} {pkg.customerId?.lastName}
                  <br />
                  {pkg.customerId?.phone}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Credits:</span>
                    <span className="font-medium">
                      {pkg.creditsRemaining}/{pkg.creditsTotal}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${((pkg.creditsTotal - pkg.creditsRemaining) / pkg.creditsTotal) * 100}%`
                      }}
                    />
                  </div>
                </div>
                {pkg.validUntil && (
                  <div className="text-sm text-gray-600">
                    â° GÃ¼ltig bis: {new Date(pkg.validUntil).toLocaleDateString('de-DE')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Packages */}
      {inactivePackages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Inaktive Packages ({inactivePackages.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inactivePackages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{pkg.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pkg.customerId?.firstName} {pkg.customerId?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.creditsRemaining}/{pkg.creditsTotal}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {packages.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">Noch keine Packages vorhanden</p>
        </div>
      )}
    </div>
  );
}

function MembershipsTab({ memberships, onCancel }) {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.active;
  };

  const getPlanIcon = (plan) => {
    const icons = {
      basic: 'ðŸ¥‰',
      premium: 'ðŸ¥ˆ',
      vip: 'ðŸ¥‡',
      custom: 'ðŸ’Ž'
    };
    return icons[plan] || 'ðŸ’Ž';
  };

  const activeMemberships = memberships.filter(m => m.status === 'active');
  const inactiveMemberships = memberships.filter(m => m.status !== 'active');

  return (
    <div>
      {/* Active Memberships */}
      {activeMemberships.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Aktive Memberships ({activeMemberships.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMemberships.map((membership) => (
              <motion.div
                key={membership._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-green-500 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{getPlanIcon(membership.plan)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(membership.status)}`}>
                    {membership.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{membership.name}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  {membership.customerId?.firstName} {membership.customerId?.lastName}
                  <br />
                  {membership.customerId?.phone}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Preis:</span>
                    <span className="font-medium">{membership.priceMonthly}â‚¬/Monat</span>
                  </div>
                  {membership.creditsMonthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credits:</span>
                      <span className="font-medium">
                        {membership.creditsUsedThisMonth}/{membership.creditsMonthly}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">NÃ¤chste Abrechnung:</span>
                    <span className="font-medium">
                      {new Date(membership.nextBillingDate).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCancel(membership._id, 'User request')}
                  className="w-full bg-red-100 text-red-800 py-2 px-4 rounded-lg hover:bg-red-200 text-sm"
                >
                  KÃ¼ndigen
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Memberships */}
      {inactiveMemberships.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Inaktive Memberships ({inactiveMemberships.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inactiveMemberships.map((membership) => (
                  <tr key={membership._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{membership.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {membership.customerId?.firstName} {membership.customerId?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getPlanIcon(membership.plan)} {membership.plan}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(membership.status)}`}>
                        {membership.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {memberships.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">Noch keine Memberships vorhanden</p>
        </div>
      )}
    </div>
  );
}
