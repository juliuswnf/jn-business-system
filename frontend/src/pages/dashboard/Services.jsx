import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Clock, DollarSign } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { serviceAPI } from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

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
      captureError(error, { context: 'fetchServices' });
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
      captureError(error, { context: 'saveService' });
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
      captureError(error, { context: 'deleteService' });
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
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Services</h1>
          <p className="text-zinc-400">Verwalte deine angebotenen Dienstleistungen</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Service hinzufügen
        </button>
      </div>

      {/* Services Container */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden">
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="font-semibold text-zinc-900">Services verwalten</span>
          </div>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Keine Services vorhanden</h3>
              <p className="text-zinc-500 mb-6">Füge deinen ersten Service hinzu, um Buchungen zu ermöglichen.</p>
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition"
              >
                Ersten Service erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:border-cyan-500/30 transition"
                >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-zinc-900">{service.name}</h3>
                    {service.active === false && (
                      <span className="px-2 py-0.5 bg-zinc-50 text-zinc-400 text-xs rounded-full">Inaktiv</span>
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
                    className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="p-2 rounded-lg bg-zinc-50 hover:bg-red-500/20 text-zinc-400 hover:text-red-600 transition"
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none w-full max-w-md overflow-hidden">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {editingService ? 'Service bearbeiten' : 'Neuer Service'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-900 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  placeholder="z.B. Beratung Standard"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-900 mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  placeholder="Kurze Beschreibung des Services..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-900 mb-2">Dauer (Min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    min="5"
                    step="5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-900 mb-2">Preis (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
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
                    className="w-4 h-4 rounded border-zinc-200 bg-zinc-50 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-zinc-600">Service ist aktiv</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition flex items-center justify-center gap-2"
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
