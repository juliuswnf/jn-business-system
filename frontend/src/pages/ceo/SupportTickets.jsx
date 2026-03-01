import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ceoAPI.getTickets(filter !== 'all' ? { status: filter } : {});
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
        calculateStats(res.data.tickets || []);
      } else {
        setTickets([]);
        calculateStats([]);
      }
    } catch (err) {
      // Only show error for server errors
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Tickets', 'error');
      }
      setTickets([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ticketList) => {
    setStats({
      total: ticketList.length,
      open: ticketList.filter(t => t.status === 'open').length,
      pending: ticketList.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      resolved: ticketList.filter(t => t.status === 'resolved' || t.status === 'closed').length
    });
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    
    setSending(true);
    try {
      const res = await ceoAPI.replyToTicket(selectedTicket._id, { message: replyText });
      if (res.data?.success) {
        showMessage('Antwort gesendet', 'success');
        setReplyText('');
        // Update ticket with new message
        setSelectedTicket(res.data.ticket);
        fetchTickets();
      }
    } catch (err) {
      showMessage('Fehler beim Senden', 'error');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      const res = await ceoAPI.updateTicketStatus(ticketId, status);
      if (res.data?.success) {
        showMessage('Status aktualisiert', 'success');
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status });
        }
        fetchTickets();
      }
    } catch (err) {
      showMessage('Fehler beim Aktualisieren', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-red-500/20 text-red-600',
      in_progress: 'bg-yellow-500/20 text-yellow-600',
      pending: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-600',
      closed: 'bg-gray-500/20 text-zinc-500'
    };
    const labels = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      pending: 'Wartet',
      resolved: 'Gelöst',
      closed: 'Geschlossen'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-zinc-500'}`}>{labels[status] || status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-500/20 text-zinc-500',
      medium: 'bg-blue-500/20 text-blue-400',
      high: 'bg-orange-500/20 text-orange-400',
      urgent: 'bg-red-500/20 text-red-600'
    };
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      urgent: 'Dringend'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority] || 'bg-gray-500/20 text-zinc-500'}`}>{labels[priority] || priority}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/ceo/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Support Tickets</h1>
                <p className="text-xs text-zinc-400">Kundenanfragen verwalten</p>
              </div>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 border border-red-500/50 text-red-600' : 'bg-green-500/20 border border-green-500/50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Gesamt Tickets</p>
            <p className="text-3xl font-bold text-zinc-900">{stats.total}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Offen</p>
            <p className="text-3xl font-bold text-red-600">{stats.open}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">In Bearbeitung</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Gelöst</p>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Alle' },
            { key: 'open', label: 'Offen' },
            { key: 'in_progress', label: 'In Bearbeitung' },
            { key: 'resolved', label: 'Gelöst' },
            { key: 'closed', label: 'Geschlossen' }
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${filter === key ? 'bg-orange-500 text-white' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white/50 border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">Tickets ({tickets.length})</h3>
            </div>
            
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>Keine Tickets gefunden</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 max-h-[600px] overflow-y-auto">
                {tickets.map((ticket) => (
                  <button key={ticket._id} onClick={() => setSelectedTicket(ticket)} className={`w-full text-left p-4 hover:bg-zinc-100/50 transition ${selectedTicket?._id === ticket._id ? 'bg-zinc-50/70' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-zinc-900 font-medium line-clamp-1">{ticket.subject}</span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{ticket.messages?.[0]?.content || ticket.description}</p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(ticket.status)}
                      <span className="text-zinc-500 text-xs">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2 bg-white/50 border border-zinc-200 rounded-xl overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-zinc-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">{selectedTicket.subject}</h3>
                      <p className="text-zinc-400 text-sm">#{selectedTicket.ticketNumber || selectedTicket._id.slice(-6)} • {selectedTicket.customerEmail || selectedTicket.salonName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedTicket.messages?.length > 0 ? (
                    selectedTicket.messages.map((msg, idx) => (
                      <div key={idx} className={`p-4 rounded-lg ${msg.sender === 'support' || msg.sender === 'ceo' ? 'bg-cyan-500/10 border border-cyan-500/20 ml-8' : 'bg-zinc-50 mr-8'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-zinc-900">{msg.sender === 'support' || msg.sender === 'ceo' ? 'Support Team' : selectedTicket.customerName || 'Kunde'}</span>
                          <span className="text-xs text-zinc-400">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-zinc-600 text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <p className="text-zinc-600">{selectedTicket.description || 'Keine Nachricht'}</p>
                    </div>
                  )}
                </div>

                {/* Reply Section */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t border-zinc-200">
                    <div className="flex gap-2 mb-4">
                      <select onChange={(e) => updateStatus(selectedTicket._id, e.target.value)} value={selectedTicket.status} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm">
                        <option value="open">Offen</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="pending">Wartet auf Kunde</option>
                        <option value="resolved">Gelöst</option>
                        <option value="closed">Geschlossen</option>
                      </select>
                    </div>
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Antwort schreiben..." className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 resize-none" rows={3} />
                    <button onClick={sendReply} disabled={sending || !replyText.trim()} className="mt-3 px-6 py-2 bg-cyan-500 text-zinc-900 rounded-lg hover:bg-cyan-600 transition disabled:opacity-50 flex items-center gap-2">
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sende...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Antworten
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-zinc-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p>Wählen Sie ein Ticket aus der Liste</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
