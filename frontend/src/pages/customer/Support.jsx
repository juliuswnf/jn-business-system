import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'general' });
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  };

  // Fetch tickets
  const fetchTickets = async () => {
    setLoading(true);
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets || []);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Create new ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = getToken();
    if (!token) {
      setError('Bitte melden Sie sich an');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Ticket ${data.ticket.ticketNumber} wurde erstellt. Wir melden uns bald bei Ihnen.`);
        setNewTicket({ subject: '', description: '', category: 'general' });
        setShowNewTicket(false);
        fetchTickets();
      } else {
        setError(data.message || 'Fehler beim Erstellen des Tickets');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch ticket details
  const handleViewTicket = async (ticketId) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTicket(data.ticket);
        }
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  // Add reply to ticket
  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !selectedTicket) return;

    setSubmitting(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newReply })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTicket(data.ticket);
          setNewReply('');
        }
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket._id}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      open: { label: 'Offen', color: 'text-yellow-600 bg-yellow-100' },
      'in-progress': { label: 'In Bearbeitung', color: 'text-blue-600 bg-blue-100' },
      resolved: { label: 'GelÃ¶st', color: 'text-green-600 bg-green-100' },
      closed: { label: 'Geschlossen', color: 'text-gray-600 bg-gray-100' }
    };
    return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-100' };
  };

  // Get category display
  const getCategoryDisplay = (category) => {
    const categoryMap = {
      general: 'Allgemein',
      technical: 'Technisch',
      billing: 'Abrechnung',
      booking: 'Buchung',
      account: 'Konto',
      feedback: 'Feedback'
    };
    return categoryMap[category] || category;
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Support</h1>
            <p className="text-gray-400 mt-1">Haben Sie Fragen? Wir helfen Ihnen gerne.</p>
          </div>
          <button
            onClick={() => setShowNewTicket(!showNewTicket)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {showNewTicket ? 'Abbrechen' : 'Neues Ticket'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-300 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* New Ticket Form */}
        {showNewTicket && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Neues Support-Ticket erstellen</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="general">Allgemein</option>
                  <option value="technical">Technisches Problem</option>
                  <option value="billing">Abrechnung</option>
                  <option value="booking">Buchung</option>
                  <option value="account">Mein Konto</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Betreff</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Kurze Beschreibung Ihres Anliegens"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Beschreiben Sie Ihr Anliegen so detailliert wie mÃ¶glich..."
                  required
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  {submitting ? 'Wird gesendet...' : 'Ticket erstellen'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket Detail View */}
        {selectedTicket && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-400">{selectedTicket.ticketNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusDisplay(selectedTicket.status).color}`}>
                    {getStatusDisplay(selectedTicket.status).label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {getCategoryDisplay(selectedTicket.category)} â€¢ Erstellt am {formatDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Original Message */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Replies */}
            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium text-gray-400">Antworten</h3>
                {selectedTicket.replies.map((reply, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${reply.isStaff ? 'bg-blue-900/30 border border-blue-800' : 'bg-gray-800'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${reply.isStaff ? 'text-blue-400' : 'text-gray-300'}`}>
                        {reply.isStaff ? 'Support-Team' : 'Sie'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {selectedTicket.status !== 'closed' && (
              <form onSubmit={handleAddReply} className="space-y-4">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Ihre Antwort..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Ticket schlieÃŸen
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newReply.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    {submitting ? 'Wird gesendet...' : 'Antworten'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Meine Tickets</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">ðŸ“©</div>
              <p className="text-gray-400 mb-4">Keine Support-Tickets vorhanden</p>
              <button
                onClick={() => setShowNewTicket(true)}
                className="text-red-500 hover:text-red-400"
              >
                Erstellen Sie Ihr erstes Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div
                  key={ticket._id}
                  onClick={() => handleViewTicket(ticket._id)}
                  className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm text-gray-500">{ticket.ticketNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusDisplay(ticket.status).color}`}>
                          {getStatusDisplay(ticket.status).label}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{ticket.subject}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {getCategoryDisplay(ticket.category)} â€¢ {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link to="/customer/dashboard" className="text-gray-400 hover:text-white">
            â† ZurÃ¼ck zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Support;
