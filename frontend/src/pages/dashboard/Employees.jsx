import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Trash2, Users, Send } from 'lucide-react';
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
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.employees || res.data.data || []);
      }
    } catch (error) {
      captureError(error, { context: 'fetchEmployees' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      const res = await api.post('/employees/invite', formData);
      if (res.data.success) {
        // Add pending employee to list immediately
        setEmployees((prev) => [...prev, res.data.employee]);
        setInviteSent(true);
      }
    } catch (error) {
      captureError(error, { context: 'inviteEmployee' });
      setInviteError(
        error.response?.data?.message || 'Einladung konnte nicht gesendet werden'
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setInviteSent(false);
    setInviteError('');
    setFormData({ name: '', email: '', phone: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (error) {
      captureError(error, { context: 'deleteEmployee' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Mitarbeiter</h1>
          <p className="text-gray-600">Verwalten Sie Ihr Team</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          Mitarbeiter einladen
        </button>
      </div>

      {/* Employees Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold text-gray-900">Mitarbeiter verwalten</span>
          </div>
        </div>
        <div className="p-6">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Mitarbeiter</h3>
              <p className="text-gray-500 mb-6">Laden Sie Ihren ersten Mitarbeiter ein</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
              >
                Mitarbeiter einladen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 font-semibold">
                      {employee.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{employee.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        employee.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {employee.isActive ? 'Aktiv' : 'Einladung ausstehend'}
                    </span>
                    <button
                      onClick={() => handleDelete(employee._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
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

      {/* Invite Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Mitarbeiter einladen</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>

            {inviteSent ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✉️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Einladung gesendet!</h3>
                <p className="text-gray-600 text-sm mb-1">
                  <strong>{formData.name}</strong> erhält eine E-Mail mit dem Aktivierungslink.
                </p>
                <p className="text-gray-500 text-sm mb-6">Der Link ist 24 Stunden gültig.</p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Max Mustermann"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="max@meinbetrieb.de"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 123 456789"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Der Mitarbeiter erhält eine E-Mail mit einem Einladungslink (24h gültig), um sein Passwort selbst einzurichten.
                  Er kann sich danach nur über <strong>/login/employee</strong> einloggen.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <Send size={16} />
                    {inviteLoading ? 'Wird gesendet…' : 'Einladen'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
