import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { Package, Gem, Clock } from 'lucide-react';

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
      // ? SECURITY FIX: Use central api instance (already imported)
      // Get salonId from user profile instead of decoding token
      const profileRes = await api.get('/auth/profile');
      const salonId = profileRes.data.user?.salonId;
      
      if (!salonId) {
        toast.error('Kein Salon zugeordnet');
        setLoading(false);
        return;
      }

      // Fetch packages
      const packagesRes = await api.get(`/workflows/packages/${salonId}`);
      setPackages(packagesRes.data.data);

      // Fetch memberships
      const membershipsRes = await api.get(`/workflows/memberships/${salonId}`);
      setMemberships(membershipsRes.data.data);

      setLoading(false);
    } catch (error) {
      toast.error('Fehler beim Laden');
      setLoading(false);
    }
  };

  const handleCancelMembership = async (id, reason) => {
    if (!confirm('Membership wirklich kündigen?')) return;

    try {
      // ? SECURITY FIX: Use central api instance (already imported)
      await api.put(`/workflows/memberships/${id}/cancel`, { reason });
      toast.success('Membership gekündigt');
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Kündigen');
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Packages & Memberships</h1>
        <p className="text-zinc-500">Verwalte Packages und wiederkehrende Memberships</p>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden mb-6">
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-semibold text-zinc-900">Verwaltung</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'packages'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-cyan-500/30'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" /> Packages ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab('memberships')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'memberships'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:border-cyan-500/30'
              }`}
            >
              <Gem className="w-4 h-4 inline mr-2" /> Memberships ({memberships.length})
            </button>
          </div>
        </div>
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
      active: 'bg-green-500/20 text-green-600',
      expired: 'bg-red-500/20 text-red-600',
      completed: 'bg-gray-500/20 text-zinc-600',
      cancelled: 'bg-red-500/20 text-red-600'
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
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
              <h2 className="text-xl font-semibold text-zinc-900">
                Aktive Packages ({activePackages.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePackages.map((pkg) => (
                  <motion.div
                    key={pkg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-50 border border-green-500/50 rounded-lg p-6 hover:border-green-500/70 transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">{pkg.name}</h3>
                    <div className="text-sm text-zinc-500 mb-4">
                      {pkg.customerId?.firstName} {pkg.customerId?.lastName}
                      <br />
                      {pkg.customerId?.phone}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Credits:</span>
                        <span className="font-medium text-zinc-900">
                          {pkg.creditsRemaining}/{pkg.creditsTotal}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-50 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${((pkg.creditsTotal - pkg.creditsRemaining) / pkg.creditsTotal) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    {pkg.validUntil && (
                      <div className="text-sm text-zinc-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Gültig bis: {new Date(pkg.validUntil).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
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
                    <td className="px-6 py-4 text-sm text-zinc-500">
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
          <p className="text-zinc-400">Noch keine Packages vorhanden</p>
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
      basic: <Gem className="w-5 h-5 text-zinc-500" />,
      premium: <Gem className="w-5 h-5 text-cyan-400" />,
      vip: <Gem className="w-5 h-5 text-yellow-600" />,
      custom: <Gem className="w-5 h-5 text-green-600" />
    };
    return icons[plan] || <Gem className="w-5 h-5 text-zinc-500" />;
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
                  <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center">
                    {getPlanIcon(membership.plan)}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(membership.status)}`}>
                    {membership.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{membership.name}</h3>
                <div className="text-sm text-zinc-500 mb-4">
                  {membership.customerId?.firstName} {membership.customerId?.lastName}
                  <br />
                  {membership.customerId?.phone}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Preis:</span>
                    <span className="font-medium">{membership.priceMonthly}€/Monat</span>
                  </div>
                  {membership.creditsMonthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Credits:</span>
                      <span className="font-medium">
                        {membership.creditsUsedThisMonth}/{membership.creditsMonthly}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Nächste Abrechnung:</span>
                    <span className="font-medium">
                      {new Date(membership.nextBillingDate).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCancel(membership._id, 'User request')}
                  className="w-full bg-red-100 text-red-800 py-2 px-4 rounded-lg hover:bg-red-200 text-sm"
                >
                  Kündigen
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
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
                    <td className="px-6 py-4 text-sm text-zinc-500">
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
          <p className="text-zinc-400">Noch keine Memberships vorhanden</p>
        </div>
      )}
    </div>
  );
}
