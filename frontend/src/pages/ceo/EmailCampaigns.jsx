import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserMenu from '../../components/common/UserMenu';
import { ceoAPI } from '../../utils/api';

const EmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, openRate: 0, clickRate: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [message, setMessage] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    template: '',
    recipients: 'all',
    scheduledAt: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await ceoAPI.getCampaigns();
      if (res.data?.success) {
        setCampaigns(res.data.campaigns || []);
        calculateStats(res.data.campaigns || []);
      } else {
        setCampaigns([]);
        calculateStats([]);
      }
    } catch (err) {
      // Only show error for server errors
      if (err.response?.status >= 500) {
        showMessage('Server-Fehler beim Laden der Kampagnen', 'error');
      }
      setCampaigns([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await ceoAPI.getEmailTemplates();
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (err) {
    }
  };

  const calculateStats = (campaignList) => {
    const total = campaignList.length;
    const sent = campaignList.reduce((acc, c) => acc + (c.sent || 0), 0);
    const opened = campaignList.reduce((acc, c) => acc + (c.opened || 0), 0);
    const clicked = campaignList.reduce((acc, c) => acc + (c.clicked || 0), 0);
    
    setStats({
      total,
      sent,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
      clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : 0
    });
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject) {
      showMessage('Name und Betreff sind erforderlich', 'error');
      return;
    }

    try {
      const res = await ceoAPI.createCampaign(newCampaign);
      if (res.data?.success) {
        showMessage('Kampagne erstellt', 'success');
        setShowCreateModal(false);
        setNewCampaign({ name: '', subject: '', template: '', recipients: 'all', scheduledAt: '' });
        fetchCampaigns();
      }
    } catch (err) {
      showMessage('Fehler beim Erstellen', 'error');
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!confirm('Kampagne jetzt senden?')) return;
    
    try {
      const res = await ceoAPI.sendCampaign(campaignId);
      if (res.data?.success) {
        showMessage('Kampagne wird gesendet...', 'success');
        fetchCampaigns();
      }
    } catch (err) {
      showMessage('Fehler beim Senden', 'error');
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Kampagne wirklich löschen?')) return;
    
    try {
      const res = await ceoAPI.deleteCampaign(campaignId);
      if (res.data?.success) {
        showMessage('Kampagne gelöscht', 'success');
        fetchCampaigns();
      }
    } catch (err) {
      showMessage('Fehler beim Löschen', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-500/20 text-zinc-500',
      scheduled: 'bg-blue-500/20 text-blue-400',
      sending: 'bg-yellow-500/20 text-yellow-600',
      sent: 'bg-green-500/20 text-green-600',
      failed: 'bg-red-500/20 text-red-600'
    };
    const labels = {
      draft: 'Entwurf',
      scheduled: 'Geplant',
      sending: 'Wird gesendet',
      sent: 'Gesendet',
      failed: 'Fehlgeschlagen'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-zinc-500'}`}>{labels[status] || status}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">E-Mail Kampagnen</h1>
                <p className="text-xs text-zinc-400">Marketing & Newsletter</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neue Kampagne
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
            <p className="text-zinc-400 text-sm mb-1">Kampagnen</p>
            <p className="text-3xl font-bold text-zinc-900">{stats.total}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">E-Mails gesendet</p>
            <p className="text-3xl font-bold text-purple-400">{stats.sent.toLocaleString()}</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Öffnungsrate</p>
            <p className="text-3xl font-bold text-green-600">{stats.openRate}%</p>
          </div>
          <div className="bg-white/50 border border-zinc-200 rounded-xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Klickrate</p>
            <p className="text-3xl font-bold text-cyan-400">{stats.clickRate}%</p>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white/50 border border-zinc-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900">Alle Kampagnen</h3>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>Noch keine Kampagnen vorhanden</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 px-4 py-2 bg-purple-500 text-zinc-900 rounded-lg hover:bg-purple-600 transition">
                Erste Kampagne erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="p-4 hover:bg-zinc-100/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-zinc-900 font-medium">{campaign.name}</h4>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">{campaign.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>Erstellt: {formatDate(campaign.createdAt)}</span>
                        {campaign.sentAt && <span>Gesendet: {formatDate(campaign.sentAt)}</span>}
                        {campaign.sent > 0 && (
                          <>
                            <span>📧 {campaign.sent} gesendet</span>
                            <span>👁️ {campaign.opened || 0} geöffnet</span>
                            <span>🖱️ {campaign.clicked || 0} geklickt</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <button onClick={() => sendCampaign(campaign._id)} className="px-3 py-1.5 bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition text-sm">
                          Senden
                        </button>
                      )}
                      <button onClick={() => setSelectedCampaign(campaign)} className="p-2 text-zinc-500 hover:text-zinc-900 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteCampaign(campaign._id)} className="p-2 text-red-600 hover:text-red-600 transition">
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Neue Kampagne erstellen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Name</label>
                <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" placeholder="z.B. Frühlings-Newsletter" />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Betreff</label>
                <input type="text" value={newCampaign.subject} onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" placeholder="E-Mail Betreffzeile" />
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Template</label>
                <select value={newCampaign.template} onChange={(e) => setNewCampaign({...newCampaign, template: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">
                  <option value="">Kein Template</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Empfänger</label>
                <select value={newCampaign.recipients} onChange={(e) => setNewCampaign({...newCampaign, recipients: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900">
                  <option value="all">Alle Unternehmen</option>
                  <option value="active">Nur aktive Unternehmen</option>
                  <option value="inactive">Inaktive Unternehmen</option>
                  <option value="trial">Nutzer in Testphase</option>
                  <option value="premium">Premium-Kunden</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 text-sm mb-2">Geplanter Versand (optional)</label>
                <input type="datetime-local" value={newCampaign.scheduledAt} onChange={(e) => setNewCampaign({...newCampaign, scheduledAt: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition">Abbrechen</button>
              <button onClick={createCampaign} className="flex-1 px-4 py-2 bg-purple-500 text-zinc-900 rounded-lg hover:bg-purple-600 transition">Erstellen</button>
            </div>
          </div>
        </div>
      )}

      {/* View Campaign Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{selectedCampaign.name}</h3>
                <p className="text-zinc-400">{selectedCampaign.subject}</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 text-zinc-500 hover:text-zinc-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-zinc-900">{selectedCampaign.sent || 0}</p>
                <p className="text-xs text-zinc-500">Gesendet</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{selectedCampaign.opened || 0}</p>
                <p className="text-xs text-zinc-500">Geöffnet</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">{selectedCampaign.clicked || 0}</p>
                <p className="text-xs text-zinc-500">Geklickt</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{selectedCampaign.bounced || 0}</p>
                <p className="text-xs text-zinc-500">Bounced</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-500">Status</span>
                <span>{getStatusBadge(selectedCampaign.status)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-500">Erstellt</span>
                <span className="text-zinc-900">{formatDate(selectedCampaign.createdAt)}</span>
              </div>
              {selectedCampaign.sentAt && (
                <div className="flex justify-between py-2 border-b border-zinc-200">
                  <span className="text-zinc-500">Gesendet</span>
                  <span className="text-zinc-900">{formatDate(selectedCampaign.sentAt)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-500">Empfängergruppe</span>
                <span className="text-zinc-900">{selectedCampaign.recipients}</span>
              </div>
            </div>

            <button onClick={() => setSelectedCampaign(null)} className="w-full mt-6 px-4 py-2 bg-zinc-50 text-zinc-900 rounded-lg hover:bg-zinc-100 transition">
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;
