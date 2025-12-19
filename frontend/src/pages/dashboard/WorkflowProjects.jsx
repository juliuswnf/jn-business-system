import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch projects
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const projectsRes = await axios.get(
        `${API_URL}/api/workflows/projects?${params}`,
        { headers }
      );
      setProjects(projectsRes.data.data);

      // Fetch stats
      const statsRes = await axios.get(
        `${API_URL}/api/workflows/projects/stats`,
        { headers }
      );
      setStats(statsRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Fehler beim Laden der Projekte');
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Projekt wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/workflows/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Projekt gelöscht');
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-zinc-800 text-zinc-300',
      active: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
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
          <h1 className="text-3xl font-bold text-white mb-2">Projekte</h1>
          <p className="text-zinc-400">
            Verwalte alle branchenspezifischen Projekte
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/workflow-projects/new')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
            icon="📊"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            title="Aktiv"
            value={stats.active}
            icon="🔄"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            title="Abgeschlossen"
            value={stats.completed}
            icon="✅"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            title="Ø Fortschritt"
            value={`${stats.averageProgress}%`}
            icon="📊"
            color="bg-purple-50 border-purple-200"
          />
          <StatCard
            title="Umsatz"
            value={`€${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="bg-green-50 border-green-200"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Suche nach Name, Kunde..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.industry}
            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="active">Aktiv</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Abgebrochen</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400 mb-4">Noch keine Projekte vorhanden</p>
          <button
            onClick={() => navigate('/dashboard/workflow-projects/new')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Erstes Projekt erstellen
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800">
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
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {projects.map((project) => (
                <motion.tr
                  key={project._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-800"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getIndustryIcon(project.industry)}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-zinc-400 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {project.customerId?.firstName} {project.customerId?.lastName}
                    </div>
                    <div className="text-sm text-zinc-400">{project.customerId?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-300">{project.industry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-zinc-800 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-300">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">
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
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="text-red-400 hover:text-red-300"
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
      className={`border-2 rounded-lg p-4 ${color || 'bg-zinc-900 border-zinc-800'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-zinc-400">{title}</div>
    </motion.div>
  );
}
