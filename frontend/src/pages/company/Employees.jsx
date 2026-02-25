import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../hooks/useNotification';
import { employeeAPI } from '../../utils/api';

export default function Employees() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll();
      setEmployees(response.data.employees || response.data.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      showNotification('Error loading employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    
    try {
      setDeleting(employeeId);
      await employeeAPI.delete(employeeId);
      showNotification('Employee removed successfully', 'success');
      setEmployees(employees.filter(e => e._id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification('Error removing employee', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeCount = employees.filter(e => e.status === 'active').length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Employees</h1>
          <p className="text-slate-350 text-sm md:text-base">Manage your staff members</p>
        </div>
        <button
          onClick={() => navigate('/company/employees/invite')}
          className="px-6 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-95 transition flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> Invite Employee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Total Employees</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Active</p>
          <p className="text-2xl md:text-3xl font-bold text-green-500">{activeCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Avg Rating</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-500">★ 0.0</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No employees yet"
          description="Invite your first employee to get started"
          action={{ label: 'Invite Employee', onClick: () => navigate('/company/employees/invite') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {employees.map((employee) => (
            <div key={employee._id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6 hover:border-zinc-700 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
                  {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-white truncate">{employee.name}</h3>
                  <p className="text-slate-400 text-xs md:text-sm truncate">{employee.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-xs md:text-sm">
                <p className="text-slate-400">
                  Role: <span className="text-white font-semibold capitalize">{employee.role}</span>
                </p>
                <p className="text-slate-400">
                  Status: <span className="text-green-400 font-semibold capitalize">{employee.status}</span>
                </p>
                <p className="text-slate-400 truncate">
                  Phone: <span className="text-white">{employee.phone || 'N/A'}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/company/employees/${employee._id}`)}
                  className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm md:text-base transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(employee._id)}
                  disabled={deleting === employee._id}
                  className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm md:text-base transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> {deleting === employee._id ? '...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
