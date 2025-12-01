import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';

export default function Appointments() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with API
      // const response = await bookingAPI.getByDateRange({ startDate: selectedDate });
      // setAppointments(response.data.data);
      setLoading(false);
    } catch (error) {
      showNotification('Error loading appointments', 'error');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Appointments</h1>
          <p className="text-slate-350">Manage and track all appointments</p>
        </div>
        <button
          onClick={() => navigate('/company/appointments/new')}
          className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300"
        >
          + New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Today</p>
          <p className="text-3xl font-bold text-accent">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">This Week</p>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Completed</p>
          <p className="text-3xl font-bold text-blue-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Cancelled</p>
          <p className="text-3xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-accent/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-accent/20 flex gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-accent text-primary'
                  : 'bg-primary/50 text-slate-350 hover:text-white'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-accent text-primary'
                  : 'bg-primary/50 text-slate-350 hover:text-white'
              }`}
            >
              📅 Calendar
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white"
          />
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-350">
                      No appointments
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="border-t border-accent/10 hover:bg-accent/5 transition">
                      <td className="px-6 py-4 text-white">{apt.customerName}</td>
                      <td className="px-6 py-4 text-slate-350">{apt.serviceName}</td>
                      <td className="px-6 py-4 text-white">{apt.time}</td>
                      <td className="px-6 py-4 text-slate-350">{apt.employeeName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent capitalize">
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
          <div className="p-6 text-center text-slate-350">
            📅 Calendar view coming soon
          </div>
        )}
      </div>
    </div>
  );
}
