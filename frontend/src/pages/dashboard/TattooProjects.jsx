import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * Tattoo Projects Dashboard
 * Overview of all tattoo projects with stats and filters
 */

const TattooProjects = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchStats();
    fetchProjects();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tattoo/projects/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await fetch(`/api/tattoo/projects?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      } else {
        toast.error(data.error || 'Fehler beim Laden der Projekte');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Projekt wirklich lÃ¶schen? Alle Sessions werden abgebrochen.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tattoo/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Projekt gelÃ¶scht');
        fetchProjects();
        fetchStats();
      } else {
        toast.error(data.error || 'Fehler beim LÃ¶schen');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Netzwerkfehler');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      draft: 'Entwurf',
      in_progress: 'In Arbeit',
      completed: 'Fertig',
      cancelled: 'Abgebrochen'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ðŸŽ¨ Tattoo Projekte</h1>
            <p className="text-gray-600 mt-1">Verwalte Multi-Session Tattoo-Projekte</p>
          </div>
          <Link
            to="/dashboard/tattoo/projects/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Neues Projekt
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard
              label="Gesamt"
              value={stats.total}
              icon="ðŸ“Š"
              color="bg-gray-100"
            />
            <StatCard
              label="In Arbeit"
              value={stats.inProgress}
              icon="ðŸš§"
              color="bg-blue-100"
            />
            <StatCard
              label="Fertig"
              value={stats.completed}
              icon="âœ…"
              color="bg-green-100"
            />
            <StatCard
              label="Durchschnitt"
              value={`${stats.averageProgress}%`}
              icon="ðŸ“ˆ"
              color="bg-purple-100"
            />
            <StatCard
              label="Umsatz"
              value={`â‚¬${(stats.totalRevenue / 100).toLocaleString()}`}
              icon="ðŸ’°"
              color="bg-yellow-100"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ðŸ” Suche nach Name, Style..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="in_progress">In Arbeit</option>
              <option value="completed">Fertig</option>
              <option value="cancelled">Abgebrochen</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              LÃ¤dt Projekte...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Keine Projekte gefunden. Erstelle dein erstes Tattoo-Projekt!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projekt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Style</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <motion.tr
                      key={project._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.bodyPart}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.customerId && (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.customerId.firstName} {project.customerId.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{project.customerId.phone}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{project.style || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {project.completedSessions}/{project.totalSessions}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/dashboard/tattoo/projects/${project._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Details
                          </Link>
                          <Link
                            to={`/dashboard/tattoo/projects/${project._id}/edit`}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ label, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${color} rounded-lg p-6 shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </motion.div>
);

export default TattooProjects;
