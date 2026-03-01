import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, totalSize: 0 });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchSchedule();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await ceoAPI.getAllBackups();
      if (res.data?.success) {
        setBackups(res.data.backups || []);
        setStats(res.data.stats || { total: 0, completed: 0, totalSize: 0 });
      } else {
        // No data yet, but not an error
        setBackups([]);
        setStats({ total: 0, completed: 0, totalSize: 0 });
      }
    } catch (err) {
      // Only show error for server errors, not 404 (no data)
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Backups', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await ceoAPI.getBackupSchedule();
      if (res.data?.success) {
        setSchedule(res.data.schedule);
      }
    } catch (err) {
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await ceoAPI.createBackup({
        name: `Manual_Backup_${new Date().toISOString().split('T')[0]}`,
        type: 'manual'
      });
      if (res.data?.success) {
        showMessage('Backup wird erstellt...', 'success');
        // Poll for updates
        setTimeout(fetchBackups, 2000);
        setTimeout(fetchBackups, 5000);
        setTimeout(fetchBackups, 10000);
      } else {
        showMessage(res.data?.message || 'Unbekannter Fehler', 'error');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Fehler beim Erstellen des Backups';
      showMessage(errorMsg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (!confirm('⚠️ ACHTUNG: Dies wird alle aktuellen Daten mit dem Backup überschreiben!\n\nSind Sie absolut sicher?')) {
      return;
    }
    
    setRestoring(backupId);
    try {
      const res = await ceoAPI.restoreBackup(backupId, { confirm: true });
      if (res.data?.success) {
        showMessage('Backup-Wiederherstellung gestartet', 'success');
      }
    } catch (err) {
      showMessage('Fehler bei der Wiederherstellung', 'error');
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('Backup wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    
    try {
      const res = await ceoAPI.deleteBackup(backupId);
      if (res.data?.success) {
        showMessage('Backup gelöscht', 'success');
        fetchBackups();
      }
    } catch (err) {
      showMessage('Fehler beim Löschen', 'error');
    }
  };

  const downloadBackup = async (backupId, name) => {
    try {
      const res = await ceoAPI.downloadBackup(backupId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showMessage('Fehler beim Download', 'error');
    }
  };

  const updateSchedule = async (newSchedule) => {
    try {
      const res = await ceoAPI.updateBackupSchedule(newSchedule);
      if (res.data?.success) {
        setSchedule(res.data.schedule);
        setShowScheduleModal(false);
        showMessage('Backup-Zeitplan aktualisiert', 'success');
      }
    } catch (err) {
      showMessage('Fehler beim Speichern des Zeitplans', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-600',
      in_progress: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-600',
      failed: 'bg-red-500/20 text-red-600'
    };
    const labels = {
      completed: 'Abgeschlossen',
      in_progress: 'In Bearbeitung',
      pending: 'Ausstehend',
      failed: 'Fehlgeschlagen'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-zinc-500'}`}>{labels[status] || status}</span>;
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
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Datenbank Backups</h1>
                <p className="text-xs text-zinc-400">Sicherung & Wiederherstellung</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowScheduleModal(true)} className="px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Zeitplan
              </button>
              <button onClick={createBackup} disabled={creating} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Erstelle...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Backup erstellen
                  </>
                )}
              </button>
              <UserMenu />
            </div>
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
            <p className="text-zinc-400 text-sm mb-1">Gesamt Backups</p>
            <p className="text-3xl font-bold text-zinc-900">{stats.total}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Erfolgreich</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Speicherverbrauch</p>
            <p className="text-3xl font-bold text-cyan-400">{formatSize(stats.totalSize)}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Nächstes Backup</p>
            <p className="text-xl font-bold text-zinc-900">{schedule?.enabled ? schedule.time : 'Deaktiviert'}</p>
          </div>
        </div>

        {/* Backup List */}
        <div className="bg-white/50 border border-zinc-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-900">Alle Backups</h3>
          </div>
          
          {backups.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p>Noch keine Backups vorhanden</p>
              <button onClick={createBackup} className="mt-4 px-4 py-2 bg-cyan-500 text-zinc-900 rounded-lg hover:bg-cyan-600 transition">
                Erstes Backup erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {backups.map((backup) => (
                <div key={backup._id} className="p-4 hover:bg-zinc-100/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backup.type === 'manual' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                        {backup.type === 'manual' ? (
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-zinc-900 font-medium">{backup.name}</p>
                        <p className="text-zinc-400 text-sm">
                          {formatDate(backup.createdAt)} • {backup.sizeFormatted || formatSize(backup.size)}
                          {backup.duration && ` • ${backup.duration}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(backup.status)}
                      <div className="flex items-center gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <button onClick={() => downloadBackup(backup._id, backup.name)} className="p-2 text-zinc-500 hover:text-zinc-900 transition" title="Download">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button onClick={() => restoreBackup(backup._id)} disabled={restoring === backup._id} className="p-2 text-yellow-600 hover:text-yellow-600 transition disabled:opacity-50" title="Wiederherstellen">
                              {restoring === backup._id ? (
                                <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteBackup(backup._id)} className="p-2 text-red-600 hover:text-red-600 transition" title="Löschen">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {backup.collections && backup.collections.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {backup.collections.map((col, idx) => (
                        <span key={idx} className="px-2 py-1 bg-zinc-50 rounded text-xs text-zinc-500">
                          {col.name}: {col.documentCount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Backup-Zeitplan</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={schedule?.enabled} onChange={(e) => setSchedule({...schedule, enabled: e.target.checked})} className="w-5 h-5 rounded" />
                <span className="text-zinc-900">Automatische Backups aktiviert</span>
              </label>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Häufigkeit</label>
                <select value={schedule?.frequency || 'daily'} onChange={(e) => setSchedule({...schedule, frequency: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Uhrzeit</label>
                <input type="time" value={schedule?.time || '03:00'} onChange={(e) => setSchedule({...schedule, time: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition">Abbrechen</button>
              <button onClick={() => updateSchedule(schedule)} className="flex-1 px-4 py-2 bg-cyan-500 text-zinc-900 rounded-lg hover:bg-cyan-600 transition">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backups;
