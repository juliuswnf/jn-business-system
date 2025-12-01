import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';

export default function Employees() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with API
      // const response = await employeeAPI.getAll();
      // setEmployees(response.data.data);
      setLoading(false);
    } catch (error) {
      showNotification('Error loading employees', 'error');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Employees</h1>
          <p className="text-slate-350">Manage your staff members</p>
        </div>
        <button
          onClick={() => navigate('/company/employees/invite')}
          className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300"
        >
          + Invite Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Employees</p>
          <p className="text-3xl font-bold text-accent">{employees.length}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Avg Revenue/Month</p>
          <p className="text-3xl font-bold text-green-500">€0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Avg Rating</p>
          <p className="text-3xl font-bold text-yellow-500">★ 0.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-350">
            No employees yet. Invite your first employee!
          </div>
        ) : (
          employees.map((employee) => (
            <div key={employee._id} className="bg-secondary/50 border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-slate-350 text-sm">{employee.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <p className="text-slate-350">
                  <span className="text-accent font-semibold">{employee.bookingCount || 0}</span> Bookings
                </p>
                <p className="text-slate-350">
                  <span className="text-accent font-semibold">€{employee.revenue?.toLocaleString() || 0}</span> Revenue
                </p>
                <p className="text-slate-350">
                  Rating: <span className="text-yellow-500 font-semibold">★ {employee.rating || 0}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/company/employees/${employee._id}`)}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition"
                >
                  View
                </button>
                <button
                  onClick={() => navigate(`/company/employees/${employee._id}/edit`)}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
