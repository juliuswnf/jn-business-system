import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, templatesRes, campaignsRes, limitsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/marketing/stats`, config),
        axios.get(`${API_BASE_URL}/marketing/templates`, config),
        axios.get(`${API_BASE_URL}/marketing/campaigns`, config),
        axios.get(`${API_BASE_URL}/marketing/limits`, config)
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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/marketing/campaigns`,
        { templateId: template._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Campaign erstellt!');
      navigate(`/dashboard/campaign-editor/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen');
    }
  };

  const toggleCampaignStatus = async (campaign) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      
      await axios.put(
        `${API_BASE_URL}/marketing/campaigns/${campaign._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Campaign ${newStatus === 'active' ? 'aktiviert' : 'pausiert'}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Update');
    }
  };

  const runCampaignManually = async (campaign) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/marketing/campaigns/${campaign._id}/run`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${response.data.data.sent} SMS versendet!`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Senden');
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Campaign wirklich lÃ¶schen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/marketing/campaigns/${campaignId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Campaign gelÃ¶scht');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim LÃ¶schen');
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ðŸ“§ Marketing Automation</h1>
        <p className="text-gray-600">Automatische SMS-Kampagnen fÃ¼r mehr Umsatz</p>
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
          value={`${stats?.totalRevenue?.toFixed(0) || 0}â‚¬`}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="ROI"
          value={`${stats?.roi || 0}%`}
          subtext={`${stats?.totalCost || 0}â‚¬ Kosten`}
          color="orange"
        />
      </div>

      {/* Tier Limits Info */}
      {limits && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                {limits.tier.charAt(0).toUpperCase() + limits.tier.slice(1)} Tier
              </h3>
              <p className="text-sm text-blue-700">
                {limits.activeCampaigns} / {limits.maxActiveCampaigns} aktive Kampagnen Â· 
                {' '}{limits.smsUsed} / {limits.smsLimit} SMS diesen Monat
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{limits.smsRemaining}</div>
              <div className="text-sm text-blue-700">SMS Ã¼brig</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ðŸ“‹ Templates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ðŸš€ Meine Kampagnen ({campaigns.length})
          </button>
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kampagnen</h3>
              <p className="text-gray-500 mb-4">Erstelle deine erste Marketing-Kampagne</p>
              <button
                onClick={() => setActiveTab('templates')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Templates ansehen
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
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
          )}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, subtext, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
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
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{template.icon}</div>
        {template.popular && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            â­ Beliebt
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tier:</span>
          <span className="font-medium text-gray-900 capitalize">{template.tier}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">ROI:</span>
          <span className="font-medium text-green-600">{template.estimatedROI}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Conversion:</span>
          <span className="font-medium text-blue-600">{template.estimatedConversionRate}%</span>
        </div>
      </div>
      
      <button
        onClick={() => onActivate(template)}
        disabled={!canActivate}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
          canActivate
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 capitalize">
          {campaign.type.replace('_', ' ')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[campaign.status]}`}>
          {campaign.status === 'active' ? 'Aktiv' : campaign.status === 'paused' ? 'Pausiert' : 'Entwurf'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {campaign.stats?.totalSent || 0} versendet
        </div>
        <div className="text-xs text-gray-500">
          {campaign.stats?.totalBooked || 0} conversions
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-green-600">
          {campaign.roi}%
        </div>
        <div className="text-xs text-gray-500">
          {campaign.stats?.totalRevenue?.toFixed(0) || 0}â‚¬
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onToggleStatus(campaign)}
            className="text-gray-600 hover:text-gray-900"
            title={campaign.status === 'active' ? 'Pausieren' : 'Aktivieren'}
          >
            {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onRun(campaign)}
            disabled={campaign.status !== 'active'}
            className="text-blue-600 hover:text-blue-900 disabled:text-gray-300"
            title="Manuell ausfÃ¼hren"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={onViewAnalytics}
            className="text-purple-600 hover:text-purple-900"
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="text-green-600 hover:text-green-900"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(campaign._id)}
            className="text-red-600 hover:text-red-900"
            title="LÃ¶schen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Marketing;
