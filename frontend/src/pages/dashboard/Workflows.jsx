import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Workflows() {
  const [industries, setIndustries] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get available industries
      const industriesRes = await axios.get(`${API_URL}/api/workflows/industries`);
      setIndustries(industriesRes.data.data);

      // Get active workflows
      const salonId = JSON.parse(atob(token.split('.')[1])).salonId;
      const workflowsRes = await axios.get(
        `${API_URL}/api/workflows/${salonId}?enabled=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveWorkflows(workflowsRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Fehler beim Laden der Workflows');
      setLoading(false);
    }
  };

  const handleEnableWorkflow = async (industry, features) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/workflows/enable`,
        { industry, features },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Workflow aktiviert!');
      fetchData();
    } catch (error) {
      console.error('Error enabling workflow:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branchen-Workflows</h1>
        <p className="text-gray-600">
          Aktiviere branchenspezifische Features fÃ¼r dein Business
        </p>
      </div>

      {/* Active Workflows */}
      {activeWorkflows.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Aktive Workflows ({activeWorkflows.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWorkflows.map((workflow) => (
              <motion.div
                key={workflow._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-500 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{workflow.icon}</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Aktiv
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {workflow.displayName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {workflow.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {workflow.features.map((feature) => (
                    <span
                      key={feature}
                      className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Workflows */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          VerfÃ¼gbare Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries
            .filter(industry => !isWorkflowActive(industry.id))
            .map((industry) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{industry.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {industry.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {industry.description}
                </p>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {industry.defaultFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleEnableWorkflow(industry.id, industry.defaultFeatures)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aktivieren
                </button>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
