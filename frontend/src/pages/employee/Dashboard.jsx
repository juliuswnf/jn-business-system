import React, { useState } from 'react';

export default function Dashboard() {
  const [employee] = useState({
    name: 'Sarah Johnson',
    role: 'Hair Stylist',
    rating: 4.9,
    totalBookings: 156,
    monthlyEarnings: 3240,
    upcomingBookings: 8,
  });

  const [upcomingBookings] = useState([
    { id: 1, customer: 'Emma Wilson', service: 'Haircut & Style', time: '2:00 PM', duration: '45 min', status: 'Confirmed' },
    { id: 2, customer: 'Lisa Anderson', service: 'Hair Color', time: '3:15 PM', duration: '120 min', status: 'Confirmed' },
    { id: 3, customer: 'Michelle Brown', service: 'Haircut', time: '4:45 PM', duration: '30 min', status: 'Pending' },
    { id: 4, customer: 'Jennifer Davis', service: 'Styling', time: '5:30 PM', duration: '45 min', status: 'Confirmed' },
  ]);

  const StatCard = ({ icon, label, value, color }) => (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-6 hover:border-purple-600 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`text-4xl p-4 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 sticky top-0 z-40 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, {employee.name}!</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-semibold">⭐ {employee.rating}/5.0</p>
              <p className="text-gray-400 text-sm">{employee.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard icon="📅" label="Upcoming Bookings" value={employee.upcomingBookings} color="bg-blue-900" />
          <StatCard icon="💰" label="Monthly Earnings" value={`$${employee.monthlyEarnings}`} color="bg-green-900" />
          <StatCard icon="📊" label="Total Bookings" value={employee.totalBookings} color="bg-purple-900" />
        </div>

        {/* Today's Bookings */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Today's Schedule</h2>
            <span className="px-3 py-1 rounded-full bg-blue-900 text-blue-200 text-sm font-semibold">
              {upcomingBookings.length} Bookings
            </span>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="p-4 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-100 transition border-l-4 border-purple-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{booking.customer}</p>
                    <p className="text-gray-400 text-sm">{booking.service}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                      <span>🕐 {booking.time}</span>
                      <span>⏱️ {booking.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.status === 'Confirmed' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {booking.status}
                    </span>
                    <div className="mt-2 space-x-1">
                      <button className="px-2 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800 transition">
                        Edit
                      </button>
                      <button className="px-2 py-1 text-sm bg-red-900 text-red-200 rounded hover:bg-red-800 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-purple-900 to-black border border-purple-800 p-6 hover:border-purple-600 transition">
            <h3 className="text-xl font-bold mb-3">📅 Manage Schedule</h3>
            <p className="text-gray-300 mb-4">Set your availability and time off</p>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition">
              Open Schedule
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-black border border-blue-800 p-6 hover:border-blue-600 transition">
            <h3 className="text-xl font-bold mb-3">💬 Messages</h3>
            <p className="text-gray-300 mb-4">View messages from customers</p>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
              View Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}