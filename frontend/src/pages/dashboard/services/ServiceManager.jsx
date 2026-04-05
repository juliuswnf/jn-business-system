import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { serviceAPI } from '../../../utils/api';
import { useNotification } from '../../../hooks/useNotification';

const initialFormState = {
  name: '',
  description: '',
  duration: 45,
  price: 35,
  isActive: true
};

const toCurrency = (value) => new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
}).format(Number(value || 0));

const toActiveState = (service) => {
  if (typeof service?.isActive === 'boolean') {
    return service.isActive;
  }

  if (typeof service?.isAvailable === 'boolean') {
    return service.isAvailable;
  }

  if (typeof service?.active === 'boolean') {
    return service.active;
  }

  return service?.status !== 'inactive' && service?.status !== 'discontinued';
};

const mapFormToPayload = (formState) => {
  const isActive = Boolean(formState.isActive);

  return {
    name: formState.name.trim(),
    description: formState.description.trim(),
    duration: Number(formState.duration),
    price: Number(formState.price),
    isAvailable: isActive,
    status: isActive ? 'active' : 'inactive'
  };
};

export default function ServiceManager() {
  const { showNotification } = useNotification();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formState, setFormState] = useState(initialFormState);

  const durationOptions = useMemo(() => [15, 30, 45, 60, 75, 90, 120], []);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await serviceAPI.getAll();
      setServices(response?.data?.data || []);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Services konnten nicht geladen werden.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormState({
      name: service.name || '',
      description: service.description || '',
      duration: Number(service.duration || 45),
      price: Number(service.price || 0),
      isActive: toActiveState(service)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormState(initialFormState);
  };

  const submitService = async (event) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      showNotification('Bitte Name angeben.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = mapFormToPayload(formState);

      if (editingService?._id) {
        await serviceAPI.update(editingService._id, payload);
        showNotification('Service aktualisiert.', 'success');
      } else {
        await serviceAPI.create(payload);
        showNotification('Service erstellt.', 'success');
      }

      closeModal();
      await loadServices();
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Service konnte nicht gespeichert werden.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleServiceStatus = async (service) => {
    const nextIsActive = !toActiveState(service);

    try {
      await serviceAPI.update(service._id, {
        isAvailable: nextIsActive,
        status: nextIsActive ? 'active' : 'inactive'
      });

      setServices((prev) => prev.map((item) => (
        item._id === service._id
          ? { ...item, isAvailable: nextIsActive, status: nextIsActive ? 'active' : 'inactive' }
          : item
      )));

      showNotification(nextIsActive ? 'Service im Widget aktiviert.' : 'Service im Widget versteckt.', 'success');
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Status konnte nicht geändert werden.', 'error');
    }
  };

  const deleteService = async (serviceId) => {
    const confirmed = window.confirm('Möchtest du diesen Service wirklich löschen?');
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingId(serviceId);
      await serviceAPI.delete(serviceId);
      showNotification('Service gelöscht.', 'success');
      setServices((prev) => prev.filter((item) => item._id !== serviceId));
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Service konnte nicht gelöscht werden.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Dienstleistungen</h1>
          <p className="text-sm text-gray-500">Verwalte deine Services für interne Planung und das öffentliche Buchungs-Widget.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          <Plus className="h-4 w-4" />
          Neuer Service
        </button>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="font-medium text-gray-700">Noch keine Dienstleistungen angelegt.</p>
            <p className="mt-1 text-sm text-gray-500">Lege deinen ersten Service an, damit Kunden buchen können.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Dauer</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Preis</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Widget-Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((service) => {
                  const isActive = toActiveState(service);

                  return (
                    <tr key={service._id}>
                      <td className="px-3 py-2 text-gray-800">
                        <p className="font-medium">{service.name}</p>
                        {service.description ? <p className="text-xs text-gray-500">{service.description}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{Number(service.duration || 0)} Min</td>
                      <td className="px-3 py-2 text-gray-700">{toCurrency(service.price)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleServiceStatus(service)}
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? 'Aktiv im Widget' : 'Versteckt'}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteService(service._id)}
                            disabled={isDeletingId === service._id}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40" onClick={closeModal} aria-hidden="true" />

          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Service bearbeiten' : 'Neuer Service'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Modal schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4 p-4" onSubmit={submitService}>
              <div>
                <label htmlFor="service-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="service-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
                  placeholder="z. B. Fade Cut"
                  required
                />
              </div>

              <div>
                <label htmlFor="service-description" className="mb-1 block text-sm font-medium text-gray-700">Beschreibung (optional)</label>
                <textarea
                  id="service-description"
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
                  placeholder="Kurze Beschreibung für dein Team und die Kunden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="service-duration" className="mb-1 block text-sm font-medium text-gray-700">Dauer (Minuten)</label>
                  <select
                    id="service-duration"
                    value={formState.duration}
                    onChange={(event) => setFormState((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
                  >
                    {durationOptions.map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} Minuten</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="service-price" className="mb-1 block text-sm font-medium text-gray-700">Preis (€)</label>
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(event) => setFormState((prev) => ({ ...prev, price: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Aktiv im Widget
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
                >
                  {isSaving ? 'Speichert...' : editingService ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
