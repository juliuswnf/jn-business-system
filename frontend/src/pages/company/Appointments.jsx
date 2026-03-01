import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../hooks/useNotification';
import { bookingAPI } from '../../utils/api';

export default function Appointments() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ todayBookings: 0, thisWeek: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getByDateRange({ startDate: selectedDate, limit: 50 });
      setAppointments(response.data.bookings || response.data.data || []);
    } catch (error) {
      showNotification('Error loading appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await bookingAPI.getStats();
      if (response.data.stats) {
        setStats({
          todayBookings: response.data.stats.todayBookings || 0,
          thisWeek: response.data.stats.upcomingBookings || 0,
          completed: response.data.stats.completedBookings || 0,
          cancelled: response.data.stats.cancelledBookings || 0
        });
      }
    } catch (error) {
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Appointments</h1>
          <p className="text-zinc-400 text-sm md:text-base">Manage and track all appointments</p>
        </div>
        <button
          onClick={() => navigate('/company/appointments/new')}
          className="px-6 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-95 transition whitespace-nowrap"
        >
          + New Appointment
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-8">
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Today</p>
          <p className="text-2xl md:text-3xl font-bold text-zinc-900">{stats.todayBookings}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">This Week</p>
          <p className="text-2xl md:text-3xl font-bold text-green-500">{stats.thisWeek}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Completed</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-500">{stats.completed}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Cancelled</p>
          <p className="text-2xl md:text-3xl font-bold text-red-500">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base ${
                viewMode === 'list'
                  ? 'bg-white text-black'
                  : 'bg-zinc-50 text-slate-300 hover:text-zinc-900'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base ${
                viewMode === 'calendar'
                  ? 'bg-white text-black'
                  : 'bg-zinc-50 text-slate-300 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-white/20 w-full sm:w-auto"
          />
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Customer</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden sm:table-cell">Service</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Time</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden md:table-cell">Employee</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Status</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden lg:table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 md:px-6 py-8 text-center text-zinc-400">
                      No appointments
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="border-t border-zinc-200 hover:bg-zinc-100/50 transition">
                      <td className="px-3 md:px-6 py-3 md:py-4 text-zinc-900 text-sm md:text-base">{apt.customerName || 'N/A'}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-slate-300 hidden sm:table-cell text-sm">{apt.serviceId?.name || 'N/A'}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-zinc-900 text-sm md:text-base">{new Date(apt.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-slate-300 hidden md:table-cell text-sm">{apt.employeeId?.name || 'Unassigned'}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className="px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 capitalize">
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                        <button
                          onClick={() => navigate(`/company/appointments/${apt._id}`)}
                          className="text-zinc-900 hover:text-zinc-900/80 text-sm font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-400">
            Kalenderansicht kommt bald
          </div>
        )}
      </div>
    </div>
  );
}

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Appointments</h1>
          <p className="text-zinc-400">Manage and track all appointments</p>
        </div>
        <button
          onClick={() => navigate('/company/appointments/new')}
          className="px-6 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition duration-300"
        >
          + New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Today</p>
          <p className="text-3xl font-bold text-accent">0</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">This Week</p>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Completed</p>
          <p className="text-3xl font-bold text-blue-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Cancelled</p>
          <p className="text-3xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-zinc-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-400 hover:text-zinc-900'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Kalender
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900"
          />
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-zinc-400">
                      No appointments
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="border-t border-zinc-200 hover:bg-zinc-50 transition">
                      <td className="px-6 py-4 text-zinc-900">{apt.customerName}</td>
                      <td className="px-6 py-4 text-zinc-400">{apt.serviceName}</td>
                      <td className="px-6 py-4 text-zinc-900">{apt.time}</td>
                      <td className="px-6 py-4 text-zinc-400">{apt.employeeName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 capitalize">
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/company/appointments/${apt._id}`)}
                          className="text-accent hover:text-accent-light text-sm font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-400">
            Kalenderansicht kommt bald
          </div>
        )}
      </div>
    </div>
  );
}
