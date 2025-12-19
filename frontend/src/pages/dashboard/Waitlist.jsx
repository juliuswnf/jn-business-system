import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Clock, Users, Star, AlertCircle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [stats, setStats] = useState({ total: 0, highPriority: 0, mediumPriority: 0, lowPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, matched, expired
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch waitlist
  useEffect(() => {
    fetchWaitlist();
  }, [filter]);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const salonId = localStorage.getItem('salonId'); // Assuming salon context is stored

      const response = await axios.get(`${API_BASE}/waitlist/${salonId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter }
      });

      setWaitlist(response.data.waitlist || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching waitlist:', error);
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

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/waitlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Eintrag gelöscht');
      fetchWaitlist();
    } catch (error) {
      console.error('Error deleting waitlist entry:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Warteliste</h1>
          <p className="text-zinc-400 mt-1">
            Kunden, die auf freie Termine warten
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Kunde hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Users size={16} />
            <span className="text-sm">Gesamt</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertCircle size={16} />
            <span className="text-sm">Hohe Priorität</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.highPriority}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <Clock size={16} />
            <span className="text-sm">Mittlere Priorität</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.mediumPriority}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle size={16} />
            <span className="text-sm">Niedrige Priorität</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.lowPriority}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['active', 'matched', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
        <div className="text-center py-12 text-zinc-400">Laden...</div>
      ) : waitlist.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          Keine Einträge in der Warteliste
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Kunde</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Service</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Bevorzugte Zeit</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Priorität</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Erstellt</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {waitlist.map((entry) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-800/50 transition"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">
                        {entry.customerId?.firstName} {entry.customerId?.lastName}
                      </p>
                      <p className="text-xs text-zinc-400">{entry.customerId?.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {entry.preferredService?.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
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
                      <span className="text-blue-500">● Gematcht</span>
                    )}
                    {entry.status === 'expired' && (
                      <span className="text-zinc-500">● Abgelaufen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">
                    {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1 hover:bg-zinc-700 rounded transition"
                        title="Bearbeiten"
                      >
                        <Edit size={16} className="text-zinc-400" />
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
      )}

      {/* Add Form Modal (TODO: Implement) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Kunde zur Warteliste hinzufügen</h2>
            <p className="text-zinc-400 mb-4">Feature wird noch implementiert...</p>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg w-full"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
