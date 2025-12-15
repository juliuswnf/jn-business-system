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
    if (!confirm('Projekt wirklich lÃ¶schen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/workflows/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Projekt gelÃ¶scht');
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Fehler beim LÃ¶schen');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getIndustryIcon = (industry) => {
    const icons = {
      tattoo: 'ðŸŽ¨',
      medical_aesthetics: 'ðŸ’‰',
      spa_wellness: 'ðŸ§–',
      barbershop: 'ðŸ’ˆ',
      nails: 'ðŸ’…',
      massage: 'ðŸ’†',
      physiotherapy: 'ðŸ©º',
      generic: 'ðŸª'
    };
    return icons[industry] || 'ðŸ“‹';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projekte</h1>
          <p className="text-gray-600">
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
            icon="ðŸ“Š"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            title="Aktiv"
            value={stats.active}
            icon="ðŸ”„"
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            title="Abgeschlossen"
            value={stats.completed}
            icon="âœ…"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            title="Ã˜ Fortschritt"
            value={`${stats.averageProgress}%`}
            icon="ðŸ“ˆ"
            color="bg-purple-50 border-purple-200"
          />
          <StatCard
            title="Umsatz"
            value={`${stats.totalRevenue.toLocaleString()}â‚¬`}
            icon="ðŸ’°"
            color="bg-green-50 border-green-200"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Suche nach Name, Kunde..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.industry}
            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Branchen</option>
            <option value="tattoo">ðŸŽ¨ Tattoo</option>
            <option value="medical_aesthetics">ðŸ’‰ Medical Aesthetics</option>
            <option value="spa_wellness">ðŸ§– Spa & Wellness</option>
            <option value="barbershop">ðŸ’ˆ Barbershop</option>
            <option value="nails">ðŸ’… Nails</option>
            <option value="massage">ðŸ’† Massage</option>
            <option value="physiotherapy">ðŸ©º Physiotherapie</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Noch keine Projekte vorhanden</p>
          <button
            onClick={() => navigate('/dashboard/workflow-projects/new')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Erstes Projekt erstellen
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Projekt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Branche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fortschritt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <motion.tr
                  key={project._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getIndustryIcon(project.industry)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {project.customerId?.firstName} {project.customerId?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{project.customerId?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{project.industry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
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
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/workflow-projects/${project._id}/edit`)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        LÃ¶schen
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
      className={`border-2 rounded-lg p-4 ${color}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </motion.div>
  );
}
