import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Plus, Trash2, Settings } from 'lucide-react';
import { captureError } from '../../utils/errorTracking';

/**
 * Resource Scheduler Component
 * For Spa/Wellness centers to book rooms and equipment
 */
export default function ResourceScheduler() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, [selectedDate]);

  const fetchResources = async () => {
    try {
      // ? SECURITY FIX: Use central api instance instead of fetch
      const { api } = await import('../../utils/api');
      const response = await api.get('/resources');
      const data = response.data;
      if (data.success) {
        setResources(data.resources);
        if (data.resources.length > 0 && !selectedResource) {
          setSelectedResource(data.resources[0]._id);
        }
      }
    } catch (error) {
      captureError(error, { context: 'fetchResources' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedDate) return;

    try {
      // ? SECURITY FIX: Use central api instance instead of fetch
      const { api } = await import('../../utils/api');
      const response = await api.get(`/resources/bookings?date=${selectedDate}`);
      const data = response.data;
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      captureError(error, { context: 'fetchBookings' });
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      // ? SECURITY FIX: Use central api instance instead of fetch
      const { api } = await import('../../utils/api');
      const response = await api.post('/resources/bookings', {
        resourceId: formData.get('resourceId'),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        purpose: formData.get('purpose'),
        notes: formData.get('notes')
      });

      if (response.data.success) {
        setShowAddModal(false);
        fetchBookings();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      captureError(error, { context: 'createResourceBooking' });
      alert('Failed to create booking');
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      // ? SECURITY FIX: Use central api instance instead of fetch
      const { api } = await import('../../utils/api');
      const response = await api.post(`/resources/${selectedResource}/maintenance`, {
        scheduledDate: formData.get('scheduledDate'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        maintenanceType: formData.get('maintenanceType'),
        description: formData.get('description')
      });

      if (response.data.success) {
        setShowMaintenanceModal(false);
        fetchResources();
        fetchBookings();
      }
    } catch (error) {
      captureError(error, { context: 'scheduleMaintenance' });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;

    try {
      // ? SECURITY FIX: Use central api instance instead of fetch
      const { api } = await import('../../utils/api');
      const response = await api.delete(`/resources/bookings/${bookingId}`);

      if (response.data.success) {
        fetchBookings();
      }
    } catch (error) {
      captureError(error, { context: 'cancelResourceBooking' });
    }
  };

  const getResourceBookings = (resourceId) => {
    return bookings.filter(b => b.resourceId === resourceId);
  };

  const isTimeSlotAvailable = (resourceId, startTime, endTime) => {
    const resourceBookings = getResourceBookings(resourceId);
    
    return !resourceBookings.some(booking => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
  };

  const getResourceUtilization = (resourceId) => {
    const resourceBookings = getResourceBookings(resourceId);
    if (resourceBookings.length === 0) return 0;

    const totalMinutes = resourceBookings.reduce((acc, booking) => {
      const start = new Date(`2000-01-01T${booking.startTime}`);
      const end = new Date(`2000-01-01T${booking.endTime}`);
      return acc + (end - start) / 60000;
    }, 0);

    const businessHours = 10 * 60; // 10 hours per day
    return Math.round((totalMinutes / businessHours) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Resource Scheduler
          </h1>
          <p className="text-gray-600 mt-2">Manage rooms, equipment, and facility bookings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Schedule Maintenance
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-zinc-900 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Book Resource
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {resources.map((resource) => {
          const resourceBookings = getResourceBookings(resource._id);
          const utilization = getResourceUtilization(resource._id);
          
          return (
            <div
              key={resource._id}
              className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                selectedResource === resource._id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedResource(resource._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                  <p className="text-sm text-gray-600">{resource.type}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  resource.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : resource.status === 'in_use'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {resource.status.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium text-gray-900">{resource.capacity} people</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bookings Today</span>
                  <span className="font-medium text-gray-900">{resourceBookings.length}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-medium text-gray-900">{utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        utilization < 50
                          ? 'bg-green-500'
                          : utilization < 80
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${utilization}%` }}
                    ></div>
                  </div>
                </div>

                {resource.features && resource.features.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {resource.features.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{resource.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline View */}
      {selectedResource && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Bookings for {resources.find(r => r._id === selectedResource)?.name}
          </h2>

          <div className="space-y-3">
            {getResourceBookings(selectedResource).length === 0 ? (
              <div className="py-12 text-center text-zinc-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                <p>No bookings for this resource on {selectedDate}</p>
              </div>
            ) : (
              getResourceBookings(selectedResource)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {booking.type === 'maintenance' ? (
                          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            <Settings className="w-3 h-3" />
                            Maintenance
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Booking
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.purpose}</p>
                          {booking.notes && (
                            <p className="text-xs text-gray-600">{booking.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel booking"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-none max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Book Resource</h3>
            
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource
                </label>
                <select
                  name="resourceId"
                  required
                  defaultValue={selectedResource}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {resources.map((resource) => (
                    <option key={resource._id} value={resource._id}>
                      {resource.name} ({resource.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  name="purpose"
                  required
                  placeholder="e.g., Massage therapy session"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional information..."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-zinc-900 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-none max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Schedule Maintenance</h3>
            
            <form onSubmit={handleScheduleMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Type
                </label>
                <select
                  name="maintenanceType"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="routine">Routine Maintenance</option>
                  <option value="deep_clean">Deep Cleaning</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="equipment_service">Equipment Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the maintenance work..."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-zinc-900 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
