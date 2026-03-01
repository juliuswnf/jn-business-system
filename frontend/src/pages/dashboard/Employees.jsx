import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Trash2, Edit, Users } from 'lucide-react';
import { api } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data || []);
      }
    } catch (error) {
      captureError(error, { context: 'fetchEmployees' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        setEmployees([...employees, res.data.data]);
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '', role: 'employee' });
      }
    } catch (error) {
      captureError(error, { context: 'createEmployee' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    try {
      // ✅ FIX: Tokens are in HTTP-only cookies, sent automatically
      await api.delete(`/employees/${id}`);
      setEmployees(employees.filter(e => e._id !== id));
    } catch (error) {
      captureError(error, { context: 'deleteEmployee' });
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
          <h1 className="text-2xl font-bold text-zinc-900">Mitarbeiter</h1>
          <p className="text-zinc-600">Verwalten Sie Ihr Team</p>
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
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden">
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold text-zinc-900">Mitarbeiter verwalten</span>
          </div>
        </div>
        <div className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Keine Mitarbeiter</h3>
              <p className="text-zinc-500 mb-6">Fügen Sie Ihren ersten Mitarbeiter hinzu</p>
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
                  className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-lg hover:border-cyan-500/30 transition"
                >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-semibold">
                  {employee.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900">{employee.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-600">
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
                <span className="px-3 py-1 text-xs bg-green-500/20 text-green-600 rounded-full">
                  {employee.isActive !== false ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => handleDelete(employee._id)}
                  className="p-2 text-red-600 hover:bg-red-500/20 rounded-lg transition"
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
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none w-full max-w-md overflow-hidden">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Neuer Mitarbeiter</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-900 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-900 mb-2">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-900 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
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

