import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../hooks/useNotification';
import { serviceAPI } from '../../utils/api';

export default function Services() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getAll();
      setServices(response.data.services || response.data.data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      showNotification('Error loading services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      setDeleting(serviceId);
      await serviceAPI.delete(serviceId);
      showNotification('Service deleted successfully', 'success');
      setServices(services.filter(s => s._id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      showNotification('Error deleting service', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const avgPrice = services.length > 0
    ? (services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length).toFixed(2)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Services</h1>
          <p className="text-slate-350 text-sm md:text-base">Manage your salon services and pricing</p>
        </div>
        <button
          onClick={() => navigate('/company/services/add')}
          className="px-6 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-95 transition whitespace-nowrap"
        >
          + Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Total Services</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{services.length}</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Avg Price</p>
          <p className="text-2xl md:text-3xl font-bold text-green-500">€{avgPrice}</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-800 p-4 rounded-lg">
          <p className="text-slate-350 text-xs md:text-sm mb-2">Most Booked</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-500">-</p>
        </div>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={null}
          title="No services yet"
          description="Create your first service to get started"
          action={{ label: 'Add Service', onClick: () => navigate('/company/services/add') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service) => (
            <div key={service._id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6 hover:border-zinc-700 transition">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-white truncate">{service.name}</h3>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">{service.category || 'Uncategorized'}</p>
                </div>
                <span className="text-xl md:text-2xl font-bold text-white whitespace-nowrap">€{service.price}</span>
              </div>

              <p className="text-slate-400 text-xs md:text-sm mb-4 line-clamp-2">{service.description || 'No description'}</p>

              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="text-xs bg-white/10 text-white px-2 md:px-3 py-1 rounded">
                  {service.duration || 0} min
                </span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 md:px-3 py-1 rounded">
                  {service.bookingCount || 0} Buchungen
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/company/services/${service._id}/edit`)}
                  className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm md:text-base transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  disabled={deleting === service._id}
                  className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm md:text-base transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting === service._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
