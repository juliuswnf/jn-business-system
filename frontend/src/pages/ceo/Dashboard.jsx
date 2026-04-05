import React, { useState } from 'react';
import { FiDollarSign, FiUsers, FiCalendar, FiActivity, FiBarChart, FiClock } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats] = useState({
    totalRevenue: 125400,
    activeCustomers: 2840,
    totalBookings: 8921,
    teamMembers: 45,
    conversionRate: 6.2,
    avgRevenuePerBooking: 14.05,
  });

  const [chartData] = useState([
    { month: 'Jan', revenue: 8200, bookings: 320, expenses: 2400 },
    { month: 'Feb', revenue: 9400, bookings: 410, expenses: 2210 },
    { month: 'Mar', revenue: 11200, bookings: 520, expenses: 2290 },
    { month: 'Apr', revenue: 13400, bookings: 640, expenses: 2000 },
    { month: 'May', revenue: 15600, bookings: 780, expenses: 2181 },
    { month: 'Jun', revenue: 18200, bookings: 920, expenses: 2500 },
  ]);

  const [pieData] = useState([
    { name: 'Haarschnitte', value: 35 },
    { name: 'Färbungen', value: 25 },
    { name: 'Behandlungen', value: 20 },
    { name: 'Extensions', value: 15 },
    { name: 'Sonstiges', value: 5 },
  ]);

  const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

  const StatCard = ({ icon, label, value, trend }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-[13px] text-gray-400 font-medium mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  const customTooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #f3f4f6',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    fontSize: '13px',
    color: '#374151'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Geschäftsübersicht</h1>
          <p className="text-sm text-gray-400 mt-1">Ihre Kennzahlen im Überblick</p>
        </div>
        <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          Bericht exportieren
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<FiDollarSign size={17} />}
          label="Umsatz gesamt"
          value={stats.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          trend={12.5}
        />
        <StatCard
          icon={<FiUsers size={17} />}
          label="Aktive Kunden"
          value={stats.activeCustomers.toLocaleString('de-DE')}
          trend={8.3}
        />
        <StatCard
          icon={<FiCalendar size={17} />}
          label="Buchungen gesamt"
          value={stats.totalBookings.toLocaleString('de-DE')}
          trend={15.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue & Bookings */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Umsatz & Buchungen</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#d1d5db" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#d1d5db" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: '#f9fafb' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
              <Bar dataKey="revenue" name="Umsatz (€)" fill="#111827" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" name="Buchungen" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Leistungsverteilung</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-medium text-gray-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Umsatzentwicklung</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" stroke="#d1d5db" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#d1d5db" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
            <Line type="monotone" dataKey="revenue" name="Umsatz" stroke="#111827" strokeWidth={2} dot={{ fill: '#111827', r: 3 }} />
            <Line type="monotone" dataKey="expenses" name="Ausgaben" stroke="#d1d5db" strokeWidth={2} dot={{ fill: '#d1d5db', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Stats + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-4 content-start">
          <StatCard
            icon={<FiActivity size={17} />}
            label="Teamgröße"
            value={stats.teamMembers}
            trend={5}
          />
          <StatCard
            icon={<FiBarChart size={17} />}
            label="Ø pro Buchung"
            value={stats.avgRevenuePerBooking.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            trend={3.5}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Letzte Aktivitäten</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { action: 'Neue Buchung erhalten', time: 'vor 2 Std.', icon: <FiCalendar size={13} /> },
              { action: 'Zahlung verbucht — 450 €', time: 'vor 4 Std.', icon: <FiDollarSign size={13} /> },
              { action: 'Neukunde registriert', time: 'vor 6 Std.', icon: <FiUsers size={13} /> },
              { action: 'Schicht geplant', time: 'vor 1 Tag', icon: <FiClock size={13} /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{item.icon}</span>
                  <p className="text-[13px] text-gray-700">{item.action}</p>
                </div>
                <span className="text-[12px] text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

        </div>

        {/* Revenue Trend Line Chart */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-black border border-gray-200 p-6 mb-12">
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
            icon={<FiBarChart className="text-xl text-gray-900" />} 
            label="Ø Umsatz pro Buchung"
            value={stats.avgRevenuePerBooking.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            trend={3.5}
            color="bg-gray-900"
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-white to-black border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Neue Buchung erhalten', time: 'vor 2 Stunden', icon: <FiCalendar /> },
              { action: 'Zahlung verbucht — 450 €', time: 'vor 4 Stunden', icon: <FiDollarSign /> },
              { action: 'Neukunde registriert', time: 'vor 6 Stunden', icon: <FiUsers /> },
              { action: 'Schicht geplant (Mitarbeiter)', time: 'vor 1 Tag', icon: <FiClock /> },
              { action: 'Bewertung veröffentlicht — 5 Sterne', time: 'vor 2 Tagen', icon: <FiBarChart /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 bg-opacity-50 hover:bg-opacity-100 transition">
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{item.icon}</span>
                  <p className="text-gray-900">{item.action}</p>
                </div>
                <span className="text-gray-500 text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
