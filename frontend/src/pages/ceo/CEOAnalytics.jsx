import React from 'react';

const CEOAnalytics = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CEO Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">$45,230</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Active Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">1,234</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Growth Rate</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">+23.5%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOAnalytics;
