import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Clock, DollarSign } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { serviceAPI } from '../../utils/api';

export default function Services() {
  const { showNotification } = useNotification();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getAll();
      const servicesList = response.data?.data || response.data || [];
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      showNotification('Fehler beim Laden der Services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      active: true
    });
    setEditingService(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (service) => {
    setFormData({
      name: service.name || '',
      description: service.description || '',
      duration: service.duration || 30,
      price: service.price || 0,
      active: service.active !== false
    });
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleClose = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification('Bitte geben Sie einen Namen ein', 'error');
      return;
    }

    try {
      if (editingService) {
        await serviceAPI.update(editingService._id, formData);
        showNotification('Service aktualisiert', 'success');
      } else {
        await serviceAPI.create(formData);
        showNotification('Service hinzugefügt', 'success');
      }
      handleClose();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      showNotification('Fehler beim Speichern', 'error');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Möchten Sie diesen Service wirklich löschen?')) return;
    
    try {
      await serviceAPI.delete(serviceId);
      showNotification('Service gelöscht', 'success');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      showNotification('Fehler beim Löschen', 'error');
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
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Services</h1>
          <p className="text-zinc-400">Verwalte deine angebotenen Dienstleistungen</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition"
        >
          <Plus className="w-5 h-5" />
          Service hinzufügen
        </button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Keine Services vorhanden</h3>
          <p className="text-zinc-400 mb-6">Füge deinen ersten Service hinzu, um Buchungen zu ermöglichen.</p>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition"
          >
            Ersten Service erstellen
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    {service.active === false && (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">Inaktiv</span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-zinc-400 text-sm mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      {service.duration} Min
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                      {service.price}€
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {editingService ? 'Service bearbeiten' : 'Neuer Service'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none"
                  placeholder="z.B. Beratung Standard"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none"
                  placeholder="Kurze Beschreibung des Services..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Dauer (Min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none"
                    min="5"
                    step="5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Preis (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-white focus:ring-0"
                  />
                  <span className="text-sm text-zinc-300">Service ist aktiv</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingService ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
