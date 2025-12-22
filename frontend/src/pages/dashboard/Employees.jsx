import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Trash2, Edit, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Employees Dashboard - Mitarbeiter verwalten
 * Route: /dashboard/employees
 */
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee'
  });

  const getToken = () => localStorage.getItem('jnAuthToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      // Error handled by UI state
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setEmployees([...employees, data.data]);
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '', role: 'employee' });
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(employees.filter(e => e._id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mitarbeiter</h1>
          <p className="text-gray-300">Verwalten Sie Ihr Team</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition"
        >
          <Plus size={20} />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {/* Employees Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold text-white">Mitarbeiter verwalten</span>
          </div>
        </div>
        <div className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Keine Mitarbeiter</h3>
              <p className="text-gray-400 mb-6">Fügen Sie Ihren ersten Mitarbeiter hinzu</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition"
              >
                Mitarbeiter hinzufügen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-cyan-500/30 transition"
                >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold">
                  {employee.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div>
                  <h3 className="font-medium text-white">{employee.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {employee.email}
                    </span>
                    {employee.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {employee.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                  {employee.isActive !== false ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => handleDelete(employee._id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Neuer Mitarbeiter</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-zinc-800 rounded-lg text-gray-300 hover:bg-zinc-800 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

