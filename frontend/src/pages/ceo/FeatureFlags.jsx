import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const FeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [message, setMessage] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [newFlag, setNewFlag] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    targetType: 'all',
    targetValue: ''
  });

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await ceoAPI.getFeatureFlags();
      if (res.data?.success) {
        setFlags(res.data.flags || []);
      } else {
        setFlags([]);
      }
    } catch (err) {
      // Only show error for server errors
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Feature Flags', 'error');
      }
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleFlag = async (flagId) => {
    setToggling(flagId);
    try {
      const res = await ceoAPI.toggleFlag(flagId);
      if (res.data?.success) {
        setFlags(flags.map(f => f._id === flagId ? { ...f, enabled: res.data.flag.enabled } : f));
        showMessage(`Feature ${res.data.flag.enabled ? 'aktiviert' : 'deaktiviert'}`, 'success');
      }
    } catch (err) {
      showMessage('Fehler beim Umschalten', 'error');
    } finally {
      setToggling(null);
    }
  };

  const createFlag = async () => {
    if (!newFlag.key || !newFlag.name) {
      showMessage('Key und Name sind erforderlich', 'error');
      return;
    }

    // Validate key format
    if (!/^[a-z_]+$/.test(newFlag.key)) {
      showMessage('Key darf nur Kleinbuchstaben und Unterstriche enthalten', 'error');
      return;
    }

    try {
      const res = await ceoAPI.createFlag(newFlag);
      if (res.data?.success) {
        showMessage('Feature Flag erstellt', 'success');
        setShowCreateModal(false);
        setNewFlag({ key: '', name: '', description: '', enabled: false, targetType: 'all', targetValue: '' });
        fetchFlags();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Fehler beim Erstellen', 'error');
    }
  };

  const updateFlag = async () => {
    if (!selectedFlag) return;

    try {
      const res = await ceoAPI.updateFlag(selectedFlag._id, {
        name: selectedFlag.name,
        description: selectedFlag.description,
        targetType: selectedFlag.targetType,
        targetValue: selectedFlag.targetValue
      });
      if (res.data?.success) {
        showMessage('Feature Flag aktualisiert', 'success');
        setSelectedFlag(null);
        fetchFlags();
      }
    } catch (err) {
      showMessage('Fehler beim Aktualisieren', 'error');
    }
  };

  const deleteFlag = async (flagId) => {
    if (!confirm('Feature Flag wirklich löschen?')) return;

    try {
      const res = await ceoAPI.deleteFlag(flagId);
      if (res.data?.success) {
        showMessage('Feature Flag gelöscht', 'success');
        fetchFlags();
      }
    } catch (err) {
      showMessage('Fehler beim Löschen', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getTargetLabel = (type) => {
    const labels = {
      all: 'Alle Benutzer',
      percentage: 'Prozentsatz',
      salon_ids: 'Spezifische Unternehmen',
      beta_users: 'Beta-Benutzer'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const enabledCount = flags.filter(f => f.enabled).length;
  const disabledCount = flags.filter(f => !f.enabled).length;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/ceo/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Feature Flags</h1>
                <p className="text-xs text-zinc-400">Feature-Verwaltung</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neues Flag
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Gesamt Flags</p>
            <p className="text-3xl font-bold text-zinc-900">{flags.length}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Aktiviert</p>
            <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Deaktiviert</p>
            <p className="text-3xl font-bold text-zinc-500">{disabledCount}</p>
          </div>
        </div>

        {/* Flags List */}
        <div className="bg-white/50 border border-zinc-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-900">Alle Feature Flags</h3>
          </div>
          
          {flags.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <p>Noch keine Feature Flags vorhanden</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 px-4 py-2 bg-yellow-500 text-zinc-900 rounded-lg hover:bg-yellow-600 transition">
                Erstes Flag erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {flags.map((flag) => (
                <div key={flag._id} className="p-4 hover:bg-zinc-100/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button onClick={() => toggleFlag(flag._id)} disabled={toggling === flag._id} className={`relative w-14 h-8 rounded-full transition-colors ${flag.enabled ? 'bg-green-500' : 'bg-zinc-300'}`}>
                        {toggling === flag._id ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all ${flag.enabled ? 'left-7' : 'left-1'}`}></div>
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-zinc-900 font-medium">{flag.name}</h4>
                          <code className="px-2 py-0.5 bg-zinc-50 rounded text-xs text-cyan-400">{flag.key}</code>
                        </div>
                        <p className="text-zinc-400 text-sm">{flag.description || 'Keine Beschreibung'}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400">
                          <span>Target: {getTargetLabel(flag.targetType)}</span>
                          {flag.targetType === 'percentage' && <span>({flag.targetValue}%)</span>}
                          <span>Erstellt: {formatDate(flag.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedFlag(flag)} className="p-2 text-zinc-500 hover:text-zinc-900 transition" title="Bearbeiten">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteFlag(flag._id)} className="p-2 text-red-600 hover:text-red-600 transition" title="Löschen">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Example */}
        <div className="mt-8 bg-white/50 border border-zinc-200 rounded-xl p-6">
          <h3 className="text-zinc-900 font-semibold mb-4">Verwendung im Code</h3>
          <pre className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600 overflow-x-auto">
{`// Backend-Verwendung
const FeatureFlag = require('./models/FeatureFlag');

async function isFeatureEnabled(key, userId) {
  const flag = await FeatureFlag.findOne({ key });
  if (!flag || !flag.enabled) return false;
  
  if (flag.targetType === 'percentage') {
    // Prozentsatz-basiertes Rollout
    return Math.random() * 100 < flag.targetValue;
  }
  
  if (flag.targetType === 'salon_ids') {
    return flag.targetValue.includes(userId);
  }
  
  return true; // targetType === 'all'
}

// Beispielaufruf
if (await isFeatureEnabled('new_dashboard', salonId)) {
  // Neues Dashboard anzeigen
}`}
          </pre>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Neues Feature Flag erstellen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Key (snake_case)</label>
                <input type="text" value={newFlag.key} onChange={(e) => setNewFlag({...newFlag, key: e.target.value.toLowerCase().replace(/[^a-z_]/g, '')})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono" placeholder="z.B. new_booking_flow" />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Name</label>
                <input type="text" value={newFlag.name} onChange={(e) => setNewFlag({...newFlag, name: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" placeholder="z.B. Neuer Buchungsablauf" />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Beschreibung</label>
                <textarea value={newFlag.description} onChange={(e) => setNewFlag({...newFlag, description: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 resize-none" rows={2} placeholder="Optionale Beschreibung..." />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Target-Typ</label>
                <select value={newFlag.targetType} onChange={(e) => setNewFlag({...newFlag, targetType: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">
                  <option value="all">Alle Benutzer</option>
                  <option value="percentage">Prozentsatz</option>
                  <option value="salon_ids">Spezifische Unternehmen</option>
                  <option value="beta_users">Beta-Benutzer</option>
                </select>
              </div>
              {newFlag.targetType === 'percentage' && (
                <div>
                  <label className="block text-zinc-500 text-sm mb-2">Prozentsatz (%)</label>
                  <input type="number" min="0" max="100" value={newFlag.targetValue} onChange={(e) => setNewFlag({...newFlag, targetValue: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" placeholder="z.B. 10" />
                </div>
              )}
              {newFlag.targetType === 'salon_ids' && (
                <div>
                  <label className="block text-zinc-500 text-sm mb-2">Unternehmens-IDs (kommagetrennt)</label>
                  <input type="text" value={newFlag.targetValue} onChange={(e) => setNewFlag({...newFlag, targetValue: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" placeholder="id1, id2, id3" />
                </div>
              )}
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={newFlag.enabled} onChange={(e) => setNewFlag({...newFlag, enabled: e.target.checked})} className="w-5 h-5 rounded" />
                <span className="text-zinc-900">Sofort aktivieren</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition">Abbrechen</button>
              <button onClick={createFlag} className="flex-1 px-4 py-2 bg-yellow-500 text-zinc-900 rounded-lg hover:bg-yellow-600 transition">Erstellen</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Flag bearbeiten</h3>
            <p className="text-zinc-400 text-sm mb-6"><code className="text-cyan-400">{selectedFlag.key}</code></p>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Name</label>
                <input type="text" value={selectedFlag.name} onChange={(e) => setSelectedFlag({...selectedFlag, name: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Beschreibung</label>
                <textarea value={selectedFlag.description || ''} onChange={(e) => setSelectedFlag({...selectedFlag, description: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 resize-none" rows={2} />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Target-Typ</label>
                <select value={selectedFlag.targetType} onChange={(e) => setSelectedFlag({...selectedFlag, targetType: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">
                  <option value="all">Alle Benutzer</option>
                  <option value="percentage">Prozentsatz</option>
                  <option value="salon_ids">Spezifische Unternehmen</option>
                  <option value="beta_users">Beta-Benutzer</option>
                </select>
              </div>
              {selectedFlag.targetType === 'percentage' && (
                <div>
                  <label className="block text-zinc-500 text-sm mb-2">Prozentsatz (%)</label>
                  <input type="number" min="0" max="100" value={selectedFlag.targetValue} onChange={(e) => setSelectedFlag({...selectedFlag, targetValue: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" />
                </div>
              )}
              {selectedFlag.targetType === 'salon_ids' && (
                <div>
                  <label className="block text-zinc-500 text-sm mb-2">Unternehmens-IDs (kommagetrennt)</label>
                  <input type="text" value={selectedFlag.targetValue} onChange={(e) => setSelectedFlag({...selectedFlag, targetValue: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedFlag(null)} className="flex-1 px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition">Abbrechen</button>
              <button onClick={updateFlag} className="flex-1 px-4 py-2 bg-yellow-500 text-zinc-900 rounded-lg hover:bg-yellow-600 transition">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlags;
