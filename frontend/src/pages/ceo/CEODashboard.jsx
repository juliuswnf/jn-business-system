import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BuildingStorefrontIcon, UsersIcon, CurrencyEuroIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ceoAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const CEODashboard = () => {
  const [stats, setStats] = useState({
    totalSalons: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  });
  const [atRiskStudios, setAtRiskStudios] = useState([]);
  const [atRiskSummary, setAtRiskSummary] = useState({ total: 0, highRisk: 0 });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { error } = useNotification();

  useEffect(() => {
    fetchCEOStats();
    fetchAtRiskStudios();
  }, []);

  const fetchCEOStats = async () => {
    try {
      const data = await ceoAPI.getStats();
      setStats(data.stats || stats);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching CEO stats:', err);
      // Mock data for development
      setStats({
        totalSalons: 12,
        totalUsers: 384,
        monthlyRevenue: 4580,
        activeSubscriptions: 11
      });
    }
  };

  const fetchAtRiskStudios = async () => {
    try {
      const res = await ceoAPI.getAtRiskStudios();
      if (res.data?.success) {
        setAtRiskStudios(res.data.studios?.slice(0, 5) || []);
        setAtRiskSummary(res.data.summary || { total: 0, highRisk: 0 });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching at-risk studios:', err);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">CEO Dashboard</h1>
          <p className="text-gray-400 mt-2">System Overview - {user.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unternehmen</p>
                <p className="text-3xl font-bold text-white">{stats.totalSalons}</p>
              </div>
              <BuildingStorefrontIcon className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">€{stats.monthlyRevenue}</p>
              </div>
              <CurrencyEuroIcon className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Subs</p>
                <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* At-Risk Studios Alert */}
          {atRiskSummary.total > 0 && (
            <div className="bg-gradient-to-br from-red-900/30 to-gray-800 rounded-lg p-6 border border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  Churn-Risiko Studios
                </h2>
                <Link 
                  to="/ceo/analytics"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Alle anzeigen →
                </Link>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="bg-red-500/20 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold text-red-400">{atRiskSummary.highRisk}</p>
                  <p className="text-xs text-red-300">Hohes Risiko</p>
                </div>
                <div className="bg-yellow-500/20 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold text-yellow-400">{atRiskSummary.total - atRiskSummary.highRisk}</p>
                  <p className="text-xs text-yellow-300">Beobachten</p>
                </div>
              </div>

              <div className="space-y-2">
                {atRiskStudios.map((studio) => (
                  <div 
                    key={studio.id} 
                    className={`p-3 rounded-lg border ${getRiskColor(studio.riskLevel)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{studio.name}</p>
                        <p className="text-xs opacity-75">{studio.riskFactors?.join(' • ')}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-black/30">
                        Score: {studio.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Management Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">System Management</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/ceo/companies" className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
                <BuildingStorefrontIcon className="h-6 w-6 text-blue-500 mr-3" />
                <span className="font-medium text-white">Unternehmen</span>
              </Link>

              <Link to="/ceo/users" className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-green-500 transition-colors">
                <UsersIcon className="h-6 w-6 text-green-500 mr-3" />
                <span className="font-medium text-white">Users</span>
              </Link>

              <Link to="/ceo/payments" className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-yellow-500 transition-colors">
                <CurrencyEuroIcon className="h-6 w-6 text-yellow-500 mr-3" />
                <span className="font-medium text-white">Billing</span>
              </Link>

              <Link to="/ceo/analytics" className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors">
                <ChartBarIcon className="h-6 w-6 text-purple-500 mr-3" />
                <span className="font-medium text-white">Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;
