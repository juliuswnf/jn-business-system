import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiCalendar, FiActivity, FiBarChart, FiClock } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * CEO Dashboard - Geschäftübersicht
 */
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 125400,
    activeCustomers: 2840,
    totalBookings: 8921,
    teamMembers: 45,
    conversionRate: 6.2,
    avgRevenuePerBooking: 14.05,
  });

  const [chartData, setChartData] = useState([
    { month: 'Jan', revenue: 8200, bookings: 320, expenses: 2400 },
    { month: 'Feb', revenue: 9400, bookings: 410, expenses: 2210 },
    { month: 'Mar', revenue: 11200, bookings: 520, expenses: 2290 },
    { month: 'Apr', revenue: 13400, bookings: 640, expenses: 2000 },
    { month: 'May', revenue: 15600, bookings: 780, expenses: 2181 },
    { month: 'Jun', revenue: 18200, bookings: 920, expenses: 2500 },
  ]);

  const [pieData, setPieData] = useState([
    { name: 'Haircuts', value: 35 },
    { name: 'Coloring', value: 25 },
    { name: 'Treatments', value: 20 },
    { name: 'Extensions', value: 15 },
    { name: 'Others', value: 5 },
  ]);

  const COLORS = ['#a855f7', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];

  const StatCard = ({ icon, label, value, trend, color }) => (
    <div className="rounded-2xl bg-gradient-to-br from-white to-black border border-zinc-200 p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`text-2xl p-3 rounded-lg ${color} bg-opacity-20`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-sm font-semibold px-2 py-1 rounded ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-zinc-500 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 sticky top-0 z-40 bg-white bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Geschäftsübersicht</h1>
            <p className="text-zinc-500 text-sm">Willkommen zurück — Ihre Kennzahlen im Überblick.</p>
          </div>
          <button className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:opacity-95 transition shadow-md">
            Bericht exportieren
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<FiDollarSign className="text-xl text-purple-400" />} 
            label="Umsatz gesamt"
            value={stats.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            trend={12.5}
            color="bg-purple-900"
          />
          <StatCard 
            icon={<FiUsers className="text-xl text-pink-400" />} 
            label="Aktive Kund:innen"
            value={stats.activeCustomers.toLocaleString('de-DE')}
            trend={8.3}
            color="bg-pink-900"
          />
          <StatCard 
            icon={<FiCalendar className="text-xl text-blue-400" />} 
            label="Anzahl Buchungen"
            value={stats.totalBookings.toLocaleString('de-DE')}
            trend={15.2}
            color="bg-blue-900"
          />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Revenue & Bookings Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white to-black border border-zinc-200 p-6">
            <h2 className="text-xl font-bold mb-6">Revenue & Bookings Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#a855f7" />
                <Bar dataKey="bookings" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Service Distribution Pie Chart */}
          <div className="rounded-2xl bg-gradient-to-br from-white to-black border border-zinc-200 p-6">
            <h2 className="text-xl font-bold mb-6">Verteilung nach Leistung</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-zinc-500">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-black border border-zinc-200 p-6 mb-12">
          <h2 className="text-xl font-bold mb-6">Umsatzentwicklung</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <StatCard 
            icon={<FiActivity className="text-xl text-orange-400" />} 
            label="Teamgröße"
            value={stats.teamMembers}
            trend={5}
            color="bg-orange-900"
          />
          <StatCard 
            icon={<FiBarChart className="text-xl text-cyan-400" />} 
            label="Ø Umsatz pro Buchung"
            value={stats.avgRevenuePerBooking.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            trend={3.5}
            color="bg-cyan-900"
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-white to-black border border-zinc-200 p-6">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Neue Buchung erhalten', time: 'vor 2 Stunden', icon: <FiCalendar /> },
              { action: 'Zahlung verbucht — 450 €', time: 'vor 4 Stunden', icon: <FiDollarSign /> },
              { action: 'Neukunde registriert', time: 'vor 6 Stunden', icon: <FiUsers /> },
              { action: 'Schicht geplant (Mitarbeiter)', time: 'vor 1 Tag', icon: <FiClock /> },
              { action: 'Bewertung veröffentlicht — 5 Sterne', time: 'vor 2 Tagen', icon: <FiBarChart /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 bg-opacity-50 hover:bg-opacity-100 transition">
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{item.icon}</span>
                  <p className="text-zinc-900">{item.action}</p>
                </div>
                <span className="text-zinc-500 text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
