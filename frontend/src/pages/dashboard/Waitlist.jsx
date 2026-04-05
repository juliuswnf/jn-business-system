import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Clock, Users, Star, AlertCircle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [stats, setStats] = useState({ total: 0, highPriority: 0, mediumPriority: 0, lowPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, matched, expired
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ preferredDate: '', preferredTime: '', notes: '' });

  // Fetch waitlist
  useEffect(() => {
    fetchWaitlist();
  }, [filter]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      // Try both keys for user data (jnUser is standard, user is fallback)
      const userStr = localStorage.getItem('jnUser') || localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const salonId = user.salonId;

      if (!salonId) {
        toast.error('Kein Salon zugeordnet');
        setLoading(false);
        return;
      }

      const response = await api.get(`/waitlist/${salonId}`, {
        params: { status: filter }
      });

      setWaitlist(response.data.waitlist || []);
      setStats(response.data.stats || {});
    } catch (error) {
      toast.error('Fehler beim Laden der Warteliste');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score > 80) return 'text-red-500 bg-red-500/10';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getPriorityLabel = (score) => {
    if (score > 80) return 'Hoch';
    if (score >= 50) return 'Mittel';
    return 'Niedrig';
  };

  const handleEditOpen = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      preferredDate: entry.preferredDate ? entry.preferredDate.split('T')[0] : '',
      preferredTime: entry.preferredTime || '',
      notes: entry.notes || ''
    });
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    try {
      await api.put(`/waitlist/${editingEntry._id}`, editForm);
      toast.success('Eintrag aktualisiert');
      setEditingEntry(null);
      fetchWaitlist();
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;

    try {
      await api.delete(`/waitlist/${id}`);

      toast.success('Eintrag gelöscht');
      fetchWaitlist();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Warteliste</h1>
          <p className="text-gray-400 mt-1">
            Kunden, die auf freie Termine warten
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gray-900 hover:bg-gray-900 text-white px-4 py-2 rounded-xl transition"
        >
          + Kunde hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Users size={16} />
            <span className="text-sm">Gesamt</span>
          </div>
          <p className="text-xl font-semibold tracking-tight text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertCircle size={16} />
            <span className="text-sm">Hohe Priorität</span>
          </div>
          <p className="text-xl font-semibold tracking-tight text-red-500">{stats.highPriority}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <Clock size={16} />
            <span className="text-sm">Mittlere Priorität</span>
          </div>
          <p className="text-xl font-semibold tracking-tight text-yellow-500">{stats.mediumPriority}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle size={16} />
            <span className="text-sm">Niedrige Priorität</span>
          </div>
          <p className="text-xl font-semibold tracking-tight text-green-500">{stats.lowPriority}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['active', 'matched', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl transition ${
              filter === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {status === 'active' && 'Aktiv'}
            {status === 'matched' && 'Gematcht'}
            {status === 'expired' && 'Abgelaufen'}
          </button>
        ))}
      </div>

      {/* Waitlist Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : waitlist.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Keine Einträge in der Warteliste
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200">
          <div className="overflow-x-auto rounded-xl">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Kunde</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Service</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Bevorzugte Zeit</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Priorität</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Erstellt</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {waitlist.map((entry) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-100/50 transition"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900 font-medium">
                        {entry.customerId?.firstName} {entry.customerId?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{entry.customerId?.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {entry.preferredService?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {entry.preferredDate && new Date(entry.preferredDate).toLocaleDateString('de-DE')}
                    {entry.preferredTime && ` um ${entry.preferredTime}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(entry.priorityScore)}`}>
                      <Star size={12} />
                      {entry.priorityScore} - {getPriorityLabel(entry.priorityScore)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === 'active' && (
                      <span className="text-green-500">● Aktiv</span>
                    )}
                    {entry.status === 'matched' && (
                      <span className="text-gray-600">● Gematcht</span>
                    )}
                    {entry.status === 'expired' && (
                      <span className="text-gray-500">● Abgelaufen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditOpen(entry)}
                        className="p-1 hover:bg-gray-100 rounded transition"
                        title="Bearbeiten"
                      >
                        <Edit size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 hover:bg-red-500/20 rounded transition"
                        title="Löschen"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Eintrag bearbeiten</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bevorzugtes Datum</label>
                <input
                  type="date"
                  value={editForm.preferredDate}
                  onChange={e => setEditForm(f => ({ ...f, preferredDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bevorzugte Uhrzeit</label>
                <input
                  type="time"
                  value={editForm.preferredTime}
                  onChange={e => setEditForm(f => ({ ...f, preferredTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSave}
                className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal (TODO: Implement) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-gray-50 p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kunde zur Warteliste hinzufügen</h2>
            <p className="text-gray-400 mb-4">Feature wird noch implementiert...</p>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-50 hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-xl w-full"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
