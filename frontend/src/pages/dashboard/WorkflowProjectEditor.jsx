import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

/**
 * Workflow Project Editor
 * Create or edit workflow projects (multi-industry)
 */

export default function WorkflowProjectEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    industry: '',
    type: '',
    name: '',
    description: '',
    totalSessions: 1,
    totalPrice: 0,
    artistId: '',
    checklist: [],
    metadata: {}
  });

  const [checklistItem, setChecklistItem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchIndustries();
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.get('/customers');
      if (res.data.success) setCustomers(res.data.customers || res.data.data || []);
    } catch (error) {
    }
  };

  const fetchEmployees = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.get('/employees');
      if (res.data.success) setEmployees(res.data.employees || res.data.data || []);
    } catch (error) {
    }
  };

  const fetchIndustries = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.get('/workflows/industries');
      if (res.data.success) setIndustries(res.data.data || []);
    } catch (error) {
    }
  };

  const fetchProject = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const res = await api.get(`/workflows/projects/${id}`);
      if (res.data.success) {
        const project = res.data.data;
        setFormData({
          customerId: project.customerId?._id || project.customerId || '',
          industry: project.industry || '',
          type: project.type || '',
          name: project.name || '',
          description: project.description || '',
          totalSessions: project.totalSessions || 1,
          totalPrice: project.totalPrice ? project.totalPrice / 100 : 0,
          artistId: project.artistId?._id || project.artistId || '',
          checklist: project.checklist || [],
          metadata: project.metadata ? Object.fromEntries(project.metadata) : {}
        });
      }
    } catch (error) {
      toast.error('Fehler beim Laden des Projekts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ? SECURITY FIX: Use central api instance
      const payload = {
        ...formData,
        totalPrice: Math.round(formData.totalPrice * 100),
        metadata: formData.metadata
      };

      const res = isEdit
        ? await api.put(`/workflows/projects/${id}`, payload)
        : await api.post('/workflows/projects', payload);

      if (res.data.success) {
        toast.success(isEdit ? 'Projekt aktualisiert' : 'Projekt erstellt');
        navigate(`/dashboard/workflow-projects/${res.data.data._id}`);
      } else {
        toast.error(res.data.message || 'Fehler beim Speichern');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (!checklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [...formData.checklist, { item: checklistItem, completed: false }]
    });
    setChecklistItem('');
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
  };

  const getIndustryIcon = (industryId) => {
    const industry = industries.find(i => i.id === industryId);
    return industry?.icon || '📋';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border border-gray-100 rounded-2xl p-8"
        >
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">
            {isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kunde *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-100"
                >
                  <option value="">Kunde wählen...</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.firstName} {customer.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Branche *
                </label>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                  <select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 rounded-xl"
                  >
                    <option value="">Branche wählen...</option>
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.icon} {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Typ
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="z.B. Behandlung, Projekt, Plan"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-zinc-500 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist/Mitarbeiter
                </label>
                <select
                  value={formData.artistId}
                  onChange={(e) => setFormData({ ...formData, artistId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-100"
                >
                  <option value="">Mitarbeiter wählen...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Projekt-Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Behandlungsserie, Projekt-Name"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-zinc-500 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-zinc-500 focus:ring-2 focus:ring-gray-100"
                placeholder="Beschreibung des Projekts..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Anzahl Sessions *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gesamtpreis (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-100"
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Checklist
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={checklistItem}
                  onChange={(e) => setChecklistItem(e.target.value)}
                  placeholder="z.B. Vorbereitung, Materialien, etc."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-zinc-500 focus:ring-2 focus:ring-gray-100"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-4 py-2 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 border border-gray-200"
                >
                  Hinzufügen
                </button>
              </div>
              {formData.checklist.length > 0 && (
                <ul className="space-y-2">
                  {formData.checklist.map((item, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                      <span className="text-sm text-gray-300">✓ {typeof item === 'string' ? item : item.item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="text-red-600 hover:text-red-600 text-sm"
                      >
                        Entfernen
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/workflow-projects')}
                className="px-6 py-2 border border-gray-200 text-gray-300 rounded-xl hover:bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gray-900 text-gray-900 rounded-xl hover:bg-gray-900 disabled:opacity-50"
              >
                {loading ? 'Speichere...' : (isEdit ? 'Aktualisieren' : 'Erstellen')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

