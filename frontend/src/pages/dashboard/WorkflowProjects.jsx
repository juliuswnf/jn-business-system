import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { BarChart3, RefreshCw, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function WorkflowProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      // ? SECURITY FIX: Use central api instance (already imported)
      // Fetch projects
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const projectsRes = await api.get(`/workflows/projects?${params}`);
      setProjects(projectsRes.data.data);

      // Fetch stats
      const statsRes = await api.get('/workflows/projects/stats');
      setStats(statsRes.data.data);

      setLoading(false);
    } catch (error) {
      toast.error('Fehler beim Laden der Projekte');
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Projekt wirklich löschen?')) return;

    try {
      // ? SECURITY FIX: Use central api instance (already imported)
      await api.delete(`/workflows/projects/${id}`);
      toast.success('Projekt gelöscht');
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-zinc-50 text-zinc-300',
      active: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-600',
      cancelled: 'bg-red-500/20 text-red-600'
    };
    return colors[status] || colors.draft;
  };

  const getIndustryIcon = (industry) => {
    const icons = {
      tattoo: '🎨',
      medical_aesthetics: '💉',
      spa_wellness: '🧖',
      barbershop: '💇',
      nails: '💅',
      massage: '💆',
      physiotherapy: '🧘',
      generic: '🏪'
    };
    return icons[industry] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Projekte</h1>
          <p className="text-zinc-400">
            Verwalte alle branchenspezifischen Projekte
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/workflow-projects/new')}
          className="bg-blue-600 text-zinc-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Neues Projekt
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Gesamt"
            value={stats.total}
            icon={<BarChart3 className="w-6 h-6 text-cyan-400" />}
            color="bg-zinc-50 border-zinc-200"
          />
          <StatCard
            title="Aktiv"
            value={stats.active}
            icon={<RefreshCw className="w-6 h-6 text-cyan-400" />}
            color="bg-zinc-50 border-zinc-200"
          />
          <StatCard
            title="Abgeschlossen"
            value={stats.completed}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            color="bg-zinc-50 border-zinc-200"
          />
          <StatCard
            title="Ø Fortschritt"
            value={`${stats.averageProgress}%`}
            icon={<TrendingUp className="w-6 h-6 text-cyan-400" />}
            color="bg-zinc-50 border-zinc-200"
          />
          <StatCard
            title="Umsatz"
            value={`€${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            color="bg-zinc-50 border-zinc-200"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden mb-6">
        <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-semibold text-zinc-900">Filter</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Suche nach Name, Kunde..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="">Alle Branchen</option>
              <option value="tattoo">🎨 Tattoo</option>
              <option value="medical_aesthetics">💉 Medical Aesthetics</option>
              <option value="spa_wellness">🧖 Spa & Wellness</option>
              <option value="barbershop">💇 Barbershop</option>
              <option value="nails">💅 Nails</option>
              <option value="massage">💆 Massage</option>
              <option value="physiotherapy">🧘 Physiotherapie</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="active">Aktiv</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Abgebrochen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-12 text-center">
          <p className="text-zinc-400 mb-4">Noch keine Projekte vorhanden</p>
          <button
            onClick={() => navigate('/dashboard/workflow-projects/new')}
            className="bg-blue-600 text-zinc-900 px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Erstes Projekt erstellen
          </button>
        </div>
      ) : (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Projekt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Branche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Fortschritt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-50 divide-y divide-zinc-200">
              {(projects || []).map((project) => (
                <motion.tr
                  key={project._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-100"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getIndustryIcon(project.industry)}</span>
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-zinc-400 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-900">
                      {project.customerId?.firstName} {project.customerId?.lastName}
                    </div>
                    <div className="text-sm text-zinc-400">{project.customerId?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-300">{project.industry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-zinc-50 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-300">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-900">
                      {project.completedSessions}/{project.totalSessions}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/dashboard/workflow-projects/${project._id}`)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/workflow-projects/${project._id}/edit`)}
                        className="text-yellow-600 hover:text-yellow-600"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="text-red-600 hover:text-red-600"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 ${color || 'bg-zinc-50 border-zinc-200'}`}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-400">{title}</div>
    </motion.div>
  );
}
