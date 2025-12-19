import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  TrendingUp,
  Users,
  MousePointerClick,
  Calendar,
  Euro,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const CampaignAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const recipientsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [campaignRes, recipientsRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/marketing/campaigns/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE_URL}/marketing/campaigns/${id}/recipients`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      setCampaign(campaignRes.data.data);
      setRecipients(recipientsRes.data.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Analytics');
      navigate('/dashboard/marketing');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Telefon', 'Status', 'Rabattcode', 'Gesendet', 'Geklickt', 'Gebucht', 'Umsatz'];
    const rows = recipients.map(r => [
      r.customerName || 'N/A',
      r.phoneNumber,
      getStatusLabel(r.status),
      r.discountCode || 'N/A',
      r.sentAt ? new Date(r.sentAt).toLocaleString('de-DE') : 'N/A',
      r.clickedAt ? new Date(r.clickedAt).toLocaleString('de-DE') : 'N/A',
      r.bookedAt ? new Date(r.bookedAt).toLocaleString('de-DE') : 'N/A',
      r.revenue ? `${r.revenue}€` : '0€'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exportiert!');
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ausstehend',
      sent: 'Gesendet',
      delivered: 'Zugestellt',
      failed: 'Fehlgeschlagen',
      clicked: 'Geklickt',
      booked: 'Gebucht'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      clicked: 'bg-purple-100 text-purple-700',
      booked: 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type) => {
    const labels = {
      inactive_customers: 'Inaktive Kunden',
      birthday: 'Geburtstag',
      last_minute: 'Last-Minute',
      upsell: 'Upsell',
      loyalty: 'Treue-Bonus'
    };
    return labels[type] || type;
  };

  const prepareTimelineData = () => {
    if (!recipients.length) return [];

    const grouped = recipients.reduce((acc, r) => {
      if (!r.sentAt) return acc;

      const date = new Date(r.sentAt).toLocaleDateString('de-DE');
      if (!acc[date]) {
        acc[date] = { date, sent: 0, delivered: 0, clicked: 0, booked: 0 };
      }

      acc[date].sent++;
      if (r.status === 'delivered' || r.status === 'clicked' || r.status === 'booked') {
        acc[date].delivered++;
      }
      if (r.status === 'clicked' || r.status === 'booked') {
        acc[date].clicked++;
      }
      if (r.status === 'booked') {
        acc[date].booked++;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-'))
    );
  };

  const prepareRevenueData = () => {
    if (!recipients.length) return [];

    return recipients
      .filter(r => r.revenue > 0)
      .map(r => ({
        name: r.customerName || 'Kunde',
        revenue: r.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const filteredRecipients = recipients.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );

  const paginatedRecipients = filteredRecipients.slice(
    (currentPage - 1) * recipientsPerPage,
    currentPage * recipientsPerPage
  );

  const totalPages = Math.ceil(filteredRecipients.length / recipientsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) return null;

  const roi = campaign.stats?.totalRevenue > 0
    ? (((campaign.stats.totalRevenue - (campaign.stats.totalSent * 0.1)) / (campaign.stats.totalSent * 0.1)) * 100).toFixed(0)
    : 0;

  const conversionRate = campaign.stats?.totalSent > 0
    ? ((campaign.stats.totalBooked / campaign.stats.totalSent) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/marketing')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {getTypeLabel(campaign.type)}
              </span>
            </div>
            <p className="text-gray-600">Campaign Analytics & Performance</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/dashboard/campaign-editor/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Edit className="w-4 h-4" />
            Bearbeiten
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="SMS Versendet"
          value={campaign.stats?.totalSent || 0}
          color="blue"
        />
        <StatCard
          icon={<MousePointerClick className="w-6 h-6" />}
          label="Geklickt"
          value={campaign.stats?.totalClicked || 0}
          subtext={`${((campaign.stats?.totalClicked / campaign.stats?.totalSent) * 100 || 0).toFixed(1)}% Click-Rate`}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Buchungen"
          value={campaign.stats?.totalBooked || 0}
          subtext={`${conversionRate}% Conversion`}
          color="green"
        />
        <StatCard
          icon={<Euro className="w-6 h-6" />}
          label="Umsatz"
          value={`${campaign.stats?.totalRevenue || 0}€`}
          subtext={`${roi}% ROI`}
          color="emerald"
        />
      </div>

      {/* Timeline Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6 mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">📈 Verlauf über Zeit</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={prepareTimelineData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sent" stroke="#3B82F6" name="Gesendet" strokeWidth={2} />
            <Line type="monotone" dataKey="delivered" stroke="#10B981" name="Zugestellt" strokeWidth={2} />
            <Line type="monotone" dataKey="clicked" stroke="#8B5CF6" name="Geklickt" strokeWidth={2} />
            <Line type="monotone" dataKey="booked" stroke="#059669" name="Gebucht" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue Chart */}
      {prepareRevenueData().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">💰 Top 10 Umsatz-Bringer</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepareRevenueData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#059669" name="Umsatz (€)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recipients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">👥 Empfänger ({filteredRecipients.length})</h2>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="sent">Gesendet</option>
              <option value="delivered">Zugestellt</option>
              <option value="clicked">Geklickt</option>
              <option value="booked">Gebucht</option>
              <option value="failed">Fehlgeschlagen</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rabattcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gesendet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geklickt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gebucht</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Umsatz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRecipients.map((recipient) => (
                <tr key={recipient._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {recipient.customerName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {recipient.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipient.status)}`}>
                      {getStatusLabel(recipient.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {recipient.discountCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {recipient.clickedAt ? new Date(recipient.clickedAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {recipient.bookedAt ? new Date(recipient.bookedAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {recipient.revenue ? `${recipient.revenue}€` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Seite {currentPage} von {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-emerald-600 bg-emerald-50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {subtext && (
        <div className="text-xs text-gray-500 mt-1">{subtext}</div>
      )}
    </motion.div>
  );
};

export default CampaignAnalytics;
