import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

export default function Workflows() {
  const [industries, setIndustries] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      // Get available industries
      const industriesRes = await api.get('/workflows/industries');
      setIndustries(industriesRes.data.data);

      // Get salonId from user profile instead of decoding token
      const profileRes = await api.get('/auth/profile');
      const salonId = profileRes.data.user?.salonId;
      
      if (!salonId) {
        toast.error('Kein Salon zugeordnet');
        setLoading(false);
        return;
      }

      // Get active workflows
      const workflowsRes = await api.get(`/workflows/${salonId}?enabled=true`);
      setActiveWorkflows(workflowsRes.data.data);

      setLoading(false);
    } catch (error) {
      toast.error('Fehler beim Laden der Workflows');
      setLoading(false);
    }
  };

  const handleEnableWorkflow = async (industry, features) => {
    try {
      // ? SECURITY FIX: Use central api instance
      await api.post('/workflows/enable', { industry, features });

      toast.success('Workflow aktiviert!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Aktivieren');
    }
  };

  const isWorkflowActive = (industryId) => {
    return activeWorkflows.some(w => w.industry === industryId);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Branchen-Workflows</h1>
        <p className="text-zinc-400">
          Aktiviere branchenspezifische Features für dein Business
        </p>
      </div>

      {/* Active Workflows */}
      {activeWorkflows.length > 0 && (
        <div className="mb-8">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-zinc-900">Aktive Workflows ({activeWorkflows.length})</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWorkflows.map((workflow) => (
                  <motion.div
                    key={workflow._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-50 border-2 border-green-500/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{workflow.icon}</span>
                      <span className="bg-green-500/10 border border-green-500/30 text-green-500 text-xs px-3 py-1 rounded-full font-medium">
                        Aktiv
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                      {workflow.displayName}
                    </h3>
                    <p className="text-sm text-zinc-500 mb-3">
                      {workflow.description}
                    </p>
                    <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                      {workflow.features.slice(0, 3).map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-zinc-600 text-xs">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Workflows */}
      <div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl shadow-none overflow-hidden">
          <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-zinc-900">Verfügbare Workflows</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries
                .filter(industry => !isWorkflowActive(industry.id))
                .map((industry) => (
                  <motion.div
                    key={industry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:border-cyan-500/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-center">
                        <span className="text-2xl">{industry.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900">{industry.name}</h3>
                        <p className="text-sm text-zinc-500">{industry.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                        {industry.defaultFeatures.slice(0, 3).map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-zinc-600 text-xs">
                            <svg className="w-3 h-3 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEnableWorkflow(industry.id, industry.defaultFeatures)}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Aktivieren
                    </button>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
