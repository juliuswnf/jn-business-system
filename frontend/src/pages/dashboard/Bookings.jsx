import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

/**
 * Bookings Page with SMS Confirmation Integration
 *
 * Features:
 * - Display all bookings with filters
 * - Send SMS confirmation button (48-96h window)
 * - Confirmation status badges
 * - Real-time updates via Socket.IO
 * - Bulk actions
 */

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingConfirmation, setSendingConfirmation] = useState({});

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load bookings on mount and filter change
  useEffect(() => {
    loadBookings();
  }, [statusFilter, dateFilter, page]);

  // Socket.IO real-time updates
  useEffect(() => {
    // TODO: Add Socket.IO connection when available
    // socket.on('booking:confirmed', handleBookingConfirmed);
    // return () => socket.off('booking:confirmed');
  }, []);

  /**
   * Load bookings from API with filters
   */
  const loadBookings = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      // Date filters
      const now = new Date();
      if (dateFilter === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0));
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.startDate = today.toISOString();
        params.endDate = tomorrow.toISOString();
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now.setHours(0, 0, 0, 0));
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        params.startDate = weekStart.toISOString();
        params.endDate = weekEnd.toISOString();
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params.startDate = monthStart.toISOString();
        params.endDate = monthEnd.toISOString();
      }

      const response = await api.get('/bookings', { params });

      if (response.data.success) {
        // Bookings API already includes confirmation data (see bookingController.js)
        // No need to make separate confirmation requests
        setBookings(response.data.bookings || []);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  };


  /**
   * Send SMS confirmation for a booking
   */
  const sendSMSConfirmation = async (booking) => {
    try {
      setSendingConfirmation(prev => ({ ...prev, [booking._id]: true }));

      const response = await api.post(`/confirmations/${booking._id}`);

      if (response.data.success) {
        toast.success(`SMS-Bestätigung gesendet an ${booking.customerPhone}`);

        // Update booking in state
        setBookings(prev => prev.map(b =>
          b._id === booking._id
            ? {
                ...b,
                confirmation: {
                  status: 'pending',
                  reminderSentAt: new Date(),
                  confirmationDeadline: response.data.confirmation.confirmationDeadline
                }
              }
            : b
        ));
      }
    } catch (error) {
      console.error('Error sending SMS confirmation:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Senden der SMS';
      toast.error(errorMessage);
    } finally {
      setSendingConfirmation(prev => ({ ...prev, [booking._id]: false }));
    }
  };

  /**
   * Check if SMS confirmation button should be shown
   */
  const shouldShowSMSButton = (booking) => {
    // Only for confirmed bookings
    if (booking.status !== 'confirmed') return false;

    // Don't show if confirmation already exists
    if (booking.confirmation) return false;

    // Check if booking is in 48-96h window
    const now = new Date();
    const bookingDate = new Date(booking.bookingDate);
    const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);

    return hoursUntil >= 48 && hoursUntil <= 96;
  };

  /**
   * Get confirmation status badge
   */
  const getConfirmationBadge = (booking) => {
    if (!booking.confirmation) {
      // Check if SMS should be sent
      if (shouldShowSMSButton(booking)) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            Bestätigung ausstehend
          </span>
        );
      }
      return null;
    }

    const badges = {
      pending: {
        color: 'yellow',
        icon: <Clock className="w-3 h-3" />,
        text: 'Warte auf Bestätigung',
        bg: 'bg-yellow-500/20',
        textColor: 'text-yellow-400'
      },
      confirmed: {
        color: 'green',
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Bestätigt',
        bg: 'bg-green-500/20',
        textColor: 'text-green-400'
      },
      expired: {
        color: 'red',
        icon: <XCircle className="w-3 h-3" />,
        text: 'Abgelaufen',
        bg: 'bg-red-500/20',
        textColor: 'text-red-400'
      },
      auto_cancelled: {
        color: 'gray',
        icon: <XCircle className="w-3 h-3" />,
        text: 'Auto-storniert',
        bg: 'bg-gray-500/20',
        textColor: 'text-gray-300'
      }
    };

    const badge = badges[booking.confirmation.status] || badges.pending;

    return (
      <div className="group relative">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.textColor}`}>
          {badge.icon}
          {badge.text}
        </span>

        {/* Tooltip with details */}
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
          <div className="bg-zinc-800 text-white text-xs rounded px-3 py-2 shadow-lg border border-zinc-700 whitespace-nowrap">
            {booking.confirmation.reminderSentAt && (
              <div>Gesendet: {new Date(booking.confirmation.reminderSentAt).toLocaleString('de-DE')}</div>
            )}
            {booking.confirmation.confirmedAt && (
              <div>Bestätigt: {new Date(booking.confirmation.confirmedAt).toLocaleString('de-DE')}</div>
            )}
            {booking.confirmation.confirmationDeadline && (
              <div>Läuft ab: {new Date(booking.confirmation.confirmationDeadline).toLocaleString('de-DE')}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Get booking status badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Ausstehend', bg: 'bg-yellow-500/20', textColor: 'text-yellow-400' },
      confirmed: { text: 'Bestätigt', bg: 'bg-green-500/20', textColor: 'text-green-400' },
      completed: { text: 'Abgeschlossen', bg: 'bg-blue-500/20', textColor: 'text-blue-400' },
      cancelled: { text: 'Storniert', bg: 'bg-red-500/20', textColor: 'text-red-400' },
      no_show: { text: 'Nicht erschienen', bg: 'bg-orange-500/20', textColor: 'text-orange-400' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.textColor}`}>
        {badge.text}
      </span>
    );
  };

  /**
   * Filter bookings by search query
   */
  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      booking.customerName?.toLowerCase().includes(query) ||
      booking.customerEmail?.toLowerCase().includes(query) ||
      booking.customerPhone?.toLowerCase().includes(query) ||
      booking.serviceId?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Buchungen</h1>
          <p className="text-zinc-400 mt-1">
            {total} Buchungen insgesamt
          </p>
        </div>

        <button
          onClick={loadBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Aktualisieren</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-gray-400" />
            <span className="font-semibold text-white">Filter</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-sm sm:text-base"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestätigt</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
              <option value="no_show">Nicht erschienen</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="all">Alle Termine</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
            </select>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 text-white rounded-lg transition"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gray-400" />
            <span className="font-semibold text-white">Buchungen</span>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400">Keine Buchungen gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[800px]">
                <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Service
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Termin
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Bestätigung
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <AnimatePresence>
                  {filteredBookings.map((booking) => (
                    <motion.tr
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-zinc-800/30 transition"
                    >
                      {/* Customer */}
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate text-sm sm:text-base">
                              {booking.customerName || 'Unbekannt'}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-zinc-400">
                              <Phone className="w-3 h-3" />
                              <span className="truncate">{booking.customerPhone || 'N/A'}</span>
                            </div>
                            {booking.customerEmail && (
                              <div className="hidden sm:flex items-center gap-2 mt-1 text-sm text-zinc-400">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{booking.customerEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Service - Hidden on mobile */}
                      <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                        <div className="text-white font-medium">
                          {booking.serviceId?.name || 'N/A'}
                        </div>
                        {booking.serviceId?.duration && (
                          <div className="text-sm text-zinc-400 mt-1">
                            {booking.serviceId.duration} Min
                          </div>
                        )}
                      </td>

                      {/* Date/Time */}
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-sm">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
                          <span className="truncate">{new Date(booking.bookingDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-zinc-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.bookingDate).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 sm:px-6 py-4">
                        {getStatusBadge(booking.status)}
                      </td>

                      {/* Confirmation Status - Hidden on mobile */}
                      <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                        {getConfirmationBadge(booking)}
                      </td>

                      {/* Actions */}
                      <td className="px-3 sm:px-6 py-4">
                        {shouldShowSMSButton(booking) && (
                          <button
                            onClick={() => sendSMSConfirmation(booking)}
                            disabled={sendingConfirmation[booking._id]}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingConfirmation[booking._id] ? (
                              <>
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                <span className="hidden sm:inline">Sende...</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">SMS senden</span>
                              </>
                            )}
                          </button>
                        )}

                        {booking.confirmation?.status === 'pending' && (
                          <div className="text-xs text-zinc-500">
                            SMS gesendet
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-400">
            Seite {page} von {totalPages}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

