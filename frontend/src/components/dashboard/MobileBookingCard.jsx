import { useState } from 'react';
import {
  ClockIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

export default function MobileBookingCard({ booking, onUpdate }) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPast = new Date(booking.bookingDate) < new Date();
  const canMarkNoShow = booking.status === 'confirmed' && isPast && booking.paymentMethodId;
  const canComplete = booking.status === 'confirmed' && isPast;

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'no-show') {
        await api.patch(`/bookings/${booking._id}/no-show`);
      } else if (action === 'completed') {
        await api.patch(`/bookings/${booking._id}/status`, { status: 'completed' });
      }
      onUpdate?.();
    } catch (error) {
      alert(error.response?.data?.message || 'Fehler bei der Aktion');
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{booking.customerName}</h3>
            <p className="text-sm text-zinc-400 truncate">{booking.serviceName || booking.serviceId?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusVariant(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
            {(canMarkNoShow || canComplete) && (
              <button
                onClick={() => setShowActions(prev => !prev)}
                className="p-1.5 rounded touch-manipulation hover:bg-gray-100"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 text-zinc-500" />
          <span>
            {new Date(booking.bookingDate).toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit'
            })}{' '}
            um {new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="w-4 h-4 text-zinc-500" />
          <span className="truncate">{booking.customerPhone || 'Keine Nummer'}</span>
        </div>
        {booking.paymentMethodId && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCardIcon className="w-4 h-4 text-zinc-500" />
            <span>No-Show Schutz aktiv</span>
          </div>
        )}
      </div>
      {showActions && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
          {canMarkNoShow && (
            <button
              onClick={() => handleAction('no-show')}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-orange-600 border border-orange-300 bg-white hover:bg-orange-50 transition"
            >
              <XMarkIcon className="w-4 h-4" />
              {loading ? 'Verarbeite...' : 'Als No-Show markieren'}
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => handleAction('completed')}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-green-700 border border-green-200 bg-white hover:bg-green-50 transition"
            >
              <CheckIcon className="w-4 h-4" />
              {loading ? 'Verarbeite...' : 'Abschließen'}
            </button>
          )}
          {!canMarkNoShow && !canComplete && (
            <p className="text-xs text-zinc-400">Keine Schnellaktionen verfügbar.</p>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    confirmed: 'Bestätigt',
    pending: 'Ausstehend',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    no_show: 'No-Show'
  };
  return labels[status] || status;
}

function getStatusVariant(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'no_show':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

