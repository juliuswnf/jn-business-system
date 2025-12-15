import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [overview, setOverview] = useState({ revenue: 0, pending: 0, refunded: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, [filter, dateRange, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [transRes, overviewRes] = await Promise.all([
        ceoAPI.getTransactions({ status: filter, dateRange, page, limit: 20 }),
        ceoAPI.getPaymentOverview(dateRange)
      ]);
      
      if (transRes.data?.success) {
        setTransactions(transRes.data.transactions || []);
        setTotalPages(transRes.data.totalPages || 1);
      } else {
        setTransactions([]);
      }
      if (overviewRes.data?.success) {
        setOverview(overviewRes.data.overview || { revenue: 0, pending: 0, refunded: 0, transactions: 0 });
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      // Only show error for server errors
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Zahlungen', 'error');
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const processRefund = async () => {
    if (!selectedTransaction || !refundAmount) return;
    
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedTransaction.amount) {
      showMessage('Ungültiger Erstattungsbetrag', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await ceoAPI.processRefund(selectedTransaction._id, {
        amount,
        reason: refundReason
      });
      if (res.data?.success) {
        showMessage('Erstattung erfolgreich verarbeitet', 'success');
        setShowRefundModal(false);
        setSelectedTransaction(null);
        setRefundAmount('');
        setRefundReason('');
        fetchPayments();
      }
    } catch (err) {
      console.error('Error processing refund:', err);
      showMessage('Fehler bei der Erstattung', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
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
      succeeded: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400',
      refunded: 'bg-purple-500/20 text-purple-400',
      partially_refunded: 'bg-orange-500/20 text-orange-400'
    };
    const labels = {
      succeeded: 'Erfolgreich',
      pending: 'Ausstehend',
      failed: 'Fehlgeschlagen',
      refunded: 'Erstattet',
      partially_refunded: 'Teilweise erstattet'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>{labels[status] || status}</span>;
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/ceo/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Zahlungen & Stripe</h1>
                <p className="text-xs text-gray-500">Transaktionen & Erstattungen</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                <option value="7d">Letzte 7 Tage</option>
                <option value="30d">Letzte 30 Tage</option>
                <option value="90d">Letzte 90 Tage</option>
                <option value="365d">Letztes Jahr</option>
              </select>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'bg-green-500/20 border border-green-500/50 text-green-400'}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Umsatz</p>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(overview.revenue)}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Ausstehend</p>
            <p className="text-3xl font-bold text-yellow-400">{formatCurrency(overview.pending)}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Erstattet</p>
            <p className="text-3xl font-bold text-purple-400">{formatCurrency(overview.refunded)}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Transaktionen</p>
            <p className="text-3xl font-bold text-white">{overview.transactions}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Alle' },
            { key: 'succeeded', label: 'Erfolgreich' },
            { key: 'pending', label: 'Ausstehend' },
            { key: 'refunded', label: 'Erstattet' },
            { key: 'failed', label: 'Fehlgeschlagen' }
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1); }} className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${filter === key ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Transaktionen</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p>Keine Transaktionen gefunden</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="p-4">Datum</th>
                      <th className="p-4">Kunde</th>
                      <th className="p-4">Beschreibung</th>
                      <th className="p-4">Betrag</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transactions.map((trans) => (
                      <tr key={trans._id} className="hover:bg-gray-800/30 transition">
                        <td className="p-4 text-gray-400 text-sm">{formatDate(trans.createdAt)}</td>
                        <td className="p-4">
                          <p className="text-white">{trans.customerName || trans.customerEmail || 'Unbekannt'}</p>
                          <p className="text-gray-500 text-xs">{trans.salonName || ''}</p>
                        </td>
                        <td className="p-4 text-gray-400">{trans.description || 'Subscription'}</td>
                        <td className="p-4 font-medium text-white">{formatCurrency(trans.amount)}</td>
                        <td className="p-4">{getStatusBadge(trans.status)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedTransaction(trans)} className="p-1.5 text-gray-400 hover:text-white transition" title="Details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {trans.status === 'succeeded' && (
                              <button onClick={() => { setSelectedTransaction(trans); setShowRefundModal(true); }} className="p-1.5 text-purple-400 hover:text-purple-300 transition" title="Erstatten">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-800 flex justify-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">
                    ←
                  </button>
                  <span className="px-4 py-1 text-gray-400">Seite {page} von {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && !showRefundModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-white">Transaktionsdetails</h3>
              <button onClick={() => setSelectedTransaction(null)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Betrag</span>
                <span className="text-white font-bold">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Status</span>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Kunde</span>
                <span className="text-white">{selectedTransaction.customerEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Datum</span>
                <span className="text-white">{formatDate(selectedTransaction.createdAt)}</span>
              </div>
              {selectedTransaction.stripePaymentId && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Stripe ID</span>
                  <span className="text-white font-mono text-sm">{selectedTransaction.stripePaymentId}</span>
                </div>
              )}
              {selectedTransaction.refundedAmount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Erstattet</span>
                  <span className="text-purple-400">{formatCurrency(selectedTransaction.refundedAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedTransaction(null)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
                Schließen
              </button>
              {selectedTransaction.status === 'succeeded' && (
                <button onClick={() => setShowRefundModal(true)} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                  Erstatten
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-6">Erstattung verarbeiten</h3>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-sm">Originalbetrag</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(selectedTransaction.amount)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Erstattungsbetrag</label>
                <input type="number" step="0.01" max={selectedTransaction.amount} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder={`Max. ${selectedTransaction.amount}€`} />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Grund (optional)</label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none" rows={3} placeholder="Grund für die Erstattung..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRefundModal(false); setRefundAmount(''); setRefundReason(''); }} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
                Abbrechen
              </button>
              <button onClick={processRefund} disabled={processing || !refundAmount} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50">
                {processing ? 'Verarbeite...' : 'Erstatten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
