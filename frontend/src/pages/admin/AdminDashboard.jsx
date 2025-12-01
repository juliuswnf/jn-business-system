import { useState, useEffect } from 'react';
import { CalendarIcon, UsersIcon, CogIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    todayBookings: 0,
    upcomingBookings: 0,
    totalCustomers: 0
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      // TODO: Implement stats endpoint
      // For now, mock data
      setStats({
        todayBookings: 5,
        upcomingBookings: 23,
        totalCustomers: 156
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-2">Willkommen, {user.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heute</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayBookings}</p>
              </div>
              <CalendarIcon className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bevorstehend</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingBookings}</p>
              </div>
              <CalendarIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kunden</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
              <CalendarIcon className="h-6 w-6 text-blue-600 mr-3" />
              <span className="font-medium">Termine verwalten</span>
            </button>

            <button className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors">
              <CogIcon className="h-6 w-6 text-green-600 mr-3" />
              <span className="font-medium">Services bearbeiten</span>
            </button>

            <button className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
              <UsersIcon className="h-6 w-6 text-purple-600 mr-3" />
              <span className="font-medium">Kunden ansehen</span>
            </button>

            <button className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-colors">
              <CodeBracketIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <span className="font-medium">Widget-Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
