import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  MessageSquare,
  Activity,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Marketing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [limits, setLimits] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [statsRes, templatesRes, campaignsRes, limitsRes] = await Promise.all([
        api.get('/marketing/stats'),
        api.get('/marketing/templates'),
        api.get('/marketing/campaigns'),
        api.get('/marketing/limits')
      ]);

      setStats(statsRes.data.data);
      setTemplates(templatesRes.data.data);
      setCampaigns(campaignsRes.data.data);
      setLimits(limitsRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const createCampaignFromTemplate = async (template) => {
    try {
      const response = await api.post('/marketing/campaigns', {
        templateId: template._id
      });

      toast.success('Campaign erstellt!');
      navigate(`/dashboard/campaign-editor/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen');
    }
  };

  const toggleCampaignStatus = async (campaign) => {
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';

      await api.put(`/marketing/campaigns/${campaign._id}`, {
        status: newStatus
      });

      toast.success(`Campaign ${newStatus === 'active' ? 'aktiviert' : 'pausiert'}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Update');
    }
  };

  const runCampaignManually = async (campaign) => {
    try {
      const response = await api.post(`/marketing/campaigns/${campaign._id}/run`, {});

      toast.success(`${response.data.data.sent} SMS versendet!`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Senden');
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Campaign wirklich löschen?')) return;

    try {
      await api.delete(`/marketing/campaigns/${campaignId}`);

      toast.success('Campaign gelöscht');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Mail className="w-8 h-8 text-cyan-500" />
          Marketing Automation
        </h1>
        <p className="text-gray-400">Automatische SMS-Kampagnen für mehr Umsatz</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          label="SMS Versendet"
          value={stats?.totalSent || 0}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Conversions"
          value={stats?.totalBooked || 0}
          subtext={`${stats?.avgConversionRate || 0}% Rate`}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Umsatz"
          value={`${stats?.totalRevenue?.toFixed(0) || 0}€`}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="ROI"
          value={`${stats?.roi || 0}%`}
          subtext={`${stats?.totalCost || 0}€ Kosten`}
          color="orange"
        />
      </div>

      {/* Tier Limits Info */}
      {limits && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{  opacity: 1, y: 0 }}
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-cyan-400">
                {limits.tier.charAt(0).toUpperCase() + limits.tier.slice(1)} Tier
              </h3>
              <p className="text-sm text-gray-300">
                {limits.activeCampaigns} / {limits.maxActiveCampaigns} aktive Kampagnen ·
                {' '}{limits.smsUsed} / {limits.smsLimit} SMS diesen Monat
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">{limits.smsRemaining}</div>
              <div className="text-sm text-gray-300">SMS übrig</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden mb-6">
        <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-gray-400" />
            <span className="font-semibold text-white">Marketing</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'templates'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-950 border border-zinc-800 text-gray-300 hover:border-cyan-500/30'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" /> Templates
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'campaigns'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-950 border border-zinc-800 text-gray-300 hover:border-cyan-500/30'
              }`}
            >
              <Rocket className="w-4 h-4 inline mr-2" /> Meine Kampagnen ({(campaigns || []).length})
            </button>
          </div>

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(templates || []).map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onActivate={createCampaignFromTemplate}
                  canActivate={limits?.canCreate}
                />
              ))}
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                  <span className="font-semibold text-white">Meine Kampagnen</span>
                </div>
              </div>
              <div className="p-6">
                {(campaigns || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Keine Kampagnen</h3>
                    <p className="text-gray-400 mb-6">Erstelle deine erste Marketing-Kampagne</p>
                    <button
                      onClick={() => setActiveTab('templates')}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Templates ansehen
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <thead className="bg-zinc-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Typ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stats</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ROI</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                        {(campaigns || []).map((campaign) => (
                          <CampaignRow
                            key={campaign._id}
                            campaign={campaign}
                            onToggleStatus={toggleCampaignStatus}
                            onRun={runCampaignManually}
                            onEdit={() => navigate(`/dashboard/campaign-editor/${campaign._id}`)}
                            onDelete={deleteCampaign}
                            onViewAnalytics={() => navigate(`/dashboard/campaign-analytics/${campaign._id}`)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, subtext, color }) => {
  const colors = {
    blue: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-yellow-500/10 text-yellow-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </motion.div>
  );
};

// Template Card Component
const TemplateCard = ({ template, onActivate, canActivate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-950 border border-zinc-800 rounded-lg hover:border-cyan-500/30 transition p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{template.icon}</div>
        {template.popular && (
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-3 h-3" />
            Beliebt
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
      <p className="text-sm text-gray-400 mb-4">{template.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Tier:</span>
          <span className="font-medium text-white capitalize">{template.tier}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">ROI:</span>
          <span className="font-medium text-green-400">{template.estimatedROI}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Conversion:</span>
          <span className="font-medium text-cyan-400">{template.estimatedConversionRate}%</span>
        </div>
      </div>

      <button
        onClick={() => onActivate(template)}
        disabled={!canActivate}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
          canActivate
            ? 'bg-cyan-500 text-black hover:bg-cyan-600'
            : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Plus className="w-4 h-4" />
        Aktivieren
      </button>
    </motion.div>
  );
};

// Campaign Row Component
const CampaignRow = ({ campaign, onToggleStatus, onRun, onEdit, onDelete, onViewAnalytics }) => {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    draft: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <tr className="hover:bg-zinc-800/50 transition">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-white">{campaign.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-400 capitalize">
          {campaign.type?.replace('_', ' ') || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[campaign.status] || statusColors.draft}`}>
          {campaign.status === 'active' ? 'Aktiv' : campaign.status === 'paused' ? 'Pausiert' : 'Entwurf'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">
          {campaign.stats?.totalSent || 0} versendet
        </div>
        <div className="text-xs text-gray-400">
          {campaign.stats?.totalBooked || 0} conversions
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-green-400">
          {campaign.roi || 0}%
        </div>
        <div className="text-xs text-gray-400">
          {campaign.stats?.totalRevenue?.toFixed(0) || 0}€
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onToggleStatus(campaign)}
            className="text-gray-400 hover:text-cyan-400 transition"
            title={campaign.status === 'active' ? 'Pausieren' : 'Aktivieren'}
          >
            {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onRun(campaign)}
            disabled={campaign.status !== 'active'}
            className="text-cyan-400 hover:text-cyan-300 disabled:text-gray-600 transition"
            title="Manuell ausführen"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={onViewAnalytics}
            className="text-purple-400 hover:text-purple-300 transition"
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="text-green-400 hover:text-green-300 transition"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(campaign._id)}
            className="text-red-400 hover:text-red-300 transition"
            title="Löschen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Marketing;
