import { useState, useEffect } from 'react';
import { BuildingStorefrontIcon, UsersIcon, CurrencyEuroIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/api';

const CEODashboard = () => {
  const [stats, setStats] = useState({
    totalSalons: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCEOStats();
  }, []);

  const fetchCEOStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ceo/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching CEO stats:', error);
      // Mock data for development
      setStats({
        totalSalons: 12,
        totalUsers: 384,
        monthlyRevenue: 4580,
        activeSubscriptions: 11
      });
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
                <p className="text-sm text-gray-400">Total Salons</p>
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
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">System Management</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
              <BuildingStorefrontIcon className="h-6 w-6 text-blue-500 mr-3" />
              <span className="font-medium text-white">Manage Salons</span>
            </button>

            <button className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-green-500 transition-colors">
              <UsersIcon className="h-6 w-6 text-green-500 mr-3" />
              <span className="font-medium text-white">User Management</span>
            </button>

            <button className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-yellow-500 transition-colors">
              <CurrencyEuroIcon className="h-6 w-6 text-yellow-500 mr-3" />
              <span className="font-medium text-white">Billing & Subscriptions</span>
            </button>

            <button className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors">
              <ChartBarIcon className="h-6 w-6 text-purple-500 mr-3" />
              <span className="font-medium text-white">Analytics & Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;
