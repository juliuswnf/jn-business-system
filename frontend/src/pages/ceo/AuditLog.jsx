import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, highRisk: 0, categories: {} });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: 'all', riskLevel: 'all' });
  const [dateRange, setDateRange] = useState('7d');
  const [selectedLog, setSelectedLog] = useState(null);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditData();
  }, [filter, dateRange, page]);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes, alertsRes] = await Promise.all([
        ceoAPI.getAuditLogs({
          category: filter.category !== 'all' ? filter.category : undefined,
          riskLevel: filter.riskLevel !== 'all' ? filter.riskLevel : undefined,
          dateRange,
          page,
          limit: 50
        }),
        ceoAPI.getAuditStats(dateRange),
        ceoAPI.getSecurityAlerts()
      ]);

      if (logsRes.data?.success) {
        setLogs(logsRes.data.logs || []);
        setTotalPages(logsRes.data.totalPages || 1);
      } else {
        setLogs([]);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats || { total: 0, today: 0, highRisk: 0, categories: {} });
      }
      if (alertsRes.data?.success) {
        setAlerts(alertsRes.data.alerts || []);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching audit data:', err);
      // Only show error for server errors
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Audit-Daten', 'error');
      }
      setLogs([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const exportLogs = async () => {
    try {
      const res = await ceoAPI.exportAuditLogs({
        category: filter.category !== 'all' ? filter.category : undefined,
        dateRange,
        format: 'csv'
      });
      
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage('Export erfolgreich', 'success');
    } catch (err) {
      console.error('Error exporting logs:', err);
      showMessage('Fehler beim Export', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getRiskBadge = (level) => {
    const styles = {
      low: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'bg-red-500/20 text-red-400'
    };
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      critical: 'Kritisch'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[level] || 'bg-gray-500/20 text-gray-400'}`}>{labels[level] || level}</span>;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      auth: '🔐',
      user: '👤',
      payment: '💳',
      admin: '⚙️',
      system: '🖥️',
      data: '📊',
      security: '🛡️'
    };
    return icons[category] || '📝';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      auth: 'Authentifizierung',
      user: 'Benutzer',
      payment: 'Zahlungen',
      admin: 'Administration',
      system: 'System',
      data: 'Daten',
      security: 'Sicherheit'
    };
    return labels[category] || category;
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Security Audit Log</h1>
                <p className="text-xs text-gray-500">Sicherheitsprotokolle</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                <option value="1d">Heute</option>
                <option value="7d">Letzte 7 Tage</option>
                <option value="30d">Letzte 30 Tage</option>
                <option value="90d">Letzte 90 Tage</option>
              </select>
              <button onClick={exportLogs} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
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

        {/* Security Alerts */}
        {alerts?.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-red-400 font-medium">{alert.title}</p>
                    <p className="text-red-300/70 text-sm">{alert.description}</p>
                  </div>
                </div>
                <span className="text-red-400/50 text-sm">{formatDate(alert.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Gesamt Events</p>
            <p className="text-3xl font-bold text-white">{(stats?.total || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Heute</p>
            <p className="text-3xl font-bold text-cyan-400">{(stats?.today || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Hohes Risiko</p>
            <p className="text-3xl font-bold text-red-400">{stats?.highRisk || 0}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Aktive Alerts</p>
            <p className="text-3xl font-bold text-orange-400">{alerts?.length || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Kategorie</label>
            <select value={filter.category} onChange={(e) => { setFilter({...filter, category: e.target.value}); setPage(1); }} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm min-w-[150px]">
              <option value="all">Alle Kategorien</option>
              <option value="auth">Authentifizierung</option>
              <option value="user">Benutzer</option>
              <option value="payment">Zahlungen</option>
              <option value="admin">Administration</option>
              <option value="system">System</option>
              <option value="security">Sicherheit</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Risikostufe</label>
            <select value={filter.riskLevel} onChange={(e) => { setFilter({...filter, riskLevel: e.target.value}); setPage(1); }} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm min-w-[150px]">
              <option value="all">Alle Stufen</option>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="font-semibold text-white">Audit Logs</h3>
            <span className="text-gray-500 text-sm">{logs?.length || 0} Einträge</span>
          </div>
          
          {!logs || logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p>Keine Audit-Logs gefunden</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="p-4">Zeitstempel</th>
                      <th className="p-4">Kategorie</th>
                      <th className="p-4">Aktion</th>
                      <th className="p-4">Benutzer</th>
                      <th className="p-4">IP</th>
                      <th className="p-4">Risiko</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(logs || []).map((log) => (
                      <tr key={log._id} className="hover:bg-gray-800/30 transition">
                        <td className="p-4 text-gray-400 text-sm whitespace-nowrap">{formatDate(log.createdAt)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2">
                            <span>{getCategoryIcon(log.category)}</span>
                            <span className="text-white text-sm">{getCategoryLabel(log.category)}</span>
                          </span>
                        </td>
                        <td className="p-4 text-white">{log.action}</td>
                        <td className="p-4">
                          <p className="text-white text-sm">{log.userName || log.userEmail || '-'}</p>
                          <p className="text-gray-500 text-xs">{log.userId?.slice(-8) || ''}</p>
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-sm">{log.ipAddress || '-'}</td>
                        <td className="p-4">{getRiskBadge(log.riskLevel || 'low')}</td>
                        <td className="p-4">
                          <button onClick={() => setSelectedLog(log)} className="p-1.5 text-gray-400 hover:text-white transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedLog.action}</h3>
                <p className="text-gray-500">{formatDate(selectedLog.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-xs mb-1">Kategorie</p>
                <p className="text-white">{getCategoryIcon(selectedLog.category)} {getCategoryLabel(selectedLog.category)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-xs mb-1">Risikostufe</p>
                {getRiskBadge(selectedLog.riskLevel || 'low')}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Benutzer</span>
                <span className="text-white">{selectedLog.userName || selectedLog.userEmail || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Benutzer ID</span>
                <span className="text-white font-mono">{selectedLog.userId || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">IP-Adresse</span>
                <span className="text-white font-mono">{selectedLog.ipAddress || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">User Agent</span>
                <span className="text-white text-xs break-all">{selectedLog.userAgent || '-'}</span>
              </div>
              {selectedLog.details && (
                <div className="py-2">
                  <p className="text-gray-400 mb-2">Details</p>
                  <pre className="bg-gray-800 rounded-lg p-4 text-gray-300 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button onClick={() => setSelectedLog(null)} className="w-full mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
