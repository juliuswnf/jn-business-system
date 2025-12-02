import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { serviceAPI } from '../../utils/api';

export default function Services() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getAll();
      setServices(response.data.services || response.data.data || []);
    } catch (error) {
      showNotification('Error loading services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await serviceAPI.delete(serviceId);
        showNotification('Service deleted', 'success');
        fetchServices();
      } catch (error) {
        showNotification('Error deleting service', 'error');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  const avgPrice = services.length > 0
    ? (services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length).toFixed(2)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
          <p className="text-slate-350">Manage your salon services and pricing</p>
        </div>
        <button
          onClick={() => navigate('/company/services/add')}
          className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300"
        >
          + Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Services</p>
          <p className="text-3xl font-bold text-accent">{services.length}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Avg Price</p>
          <p className="text-3xl font-bold text-green-500">€{avgPrice}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Most Booked</p>
          <p className="text-3xl font-bold text-blue-500">-</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-350">
            No services yet. Create your first service!
          </div>
        ) : (
          services.map((service) => (
            <div key={service._id} className="bg-secondary/50 border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                  <p className="text-slate-350 text-sm mt-1">{service.category || 'Uncategorized'}</p>
                </div>
                <span className="text-2xl font-bold text-accent">€{service.price}</span>
              </div>

              <p className="text-slate-350 text-sm mb-4">{service.description || 'No description'}</p>

              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded">
                  ⏱ {service.duration || 0} min
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded">
                  📅 {service.bookingCount || 0} bookings
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/company/services/${service._id}/edit`)}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
          <p className="text-slate-350">Manage your salon services and pricing</p>
        </div>
        <button
          onClick={() => navigate('/company/services/add')}
          className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300"
        >
          + Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Services</p>
          <p className="text-3xl font-bold text-accent">{services.length}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Avg Price</p>
          <p className="text-3xl font-bold text-green-500">€0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Most Booked</p>
          <p className="text-3xl font-bold text-blue-500">-</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-350">
            No services yet. Create your first service!
          </div>
        ) : (
          services.map((service) => (
            <div key={service._id} className="bg-secondary/50 border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                  <p className="text-slate-350 text-sm mt-1">{service.category}</p>
                </div>
                <span className="text-2xl font-bold text-accent">€{service.price}</span>
              </div>

              <p className="text-slate-350 text-sm mb-4">{service.description}</p>

              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded">
                  ⏱ {service.duration} min
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded">
                  📅 {service.bookingCount || 0} bookings
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/company/services/${service._id}/edit`)}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
