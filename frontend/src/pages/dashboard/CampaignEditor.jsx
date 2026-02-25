import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Eye,
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  Percent,
  Euro
} from 'lucide-react';

const CampaignEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const [campaign, setCampaign] = useState({
    name: '',
    type: 'inactive_customers',
    status: 'draft',
    rules: {
      inactiveDays: 180,
      birthdayDaysBefore: 7,
      minBookings: 3,
      targetSegment: 'all',
      maxRecipients: 50
    },
    message: {
      template: '',
      discountType: 'percentage',
      discountValue: 20,
      validDays: 30
    },
    schedule: {
      type: 'manual',
      time: '10:00',
      dayOfWeek: 1
    }
  });

  useEffect(() => {
    if (id) {
      loadCampaign();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadCampaign = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const response = await api.get(`/marketing/campaigns/${id}`);
      setCampaign(response.data.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Campaign');
      navigate('/dashboard/marketing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // ? SECURITY FIX: Use central api instance

      if (id) {
        await api.put(`/marketing/campaigns/${id}`, campaign);
        toast.success('Campaign gespeichert!');
      } else {
        const response = await api.post('/marketing/campaigns', campaign);
        toast.success('Campaign erstellt!');
        navigate(`/dashboard/campaign-editor/${response.data.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const loadPreview = async () => {
    try {
      // ? SECURITY FIX: Use central api instance
      const response = await api.get(`/marketing/campaigns/${id}/preview`);
      setPreview(response.data.data);
      toast.success(`${response.data.data.totalRecipients} Empfänger gefunden`);
    } catch (error) {
      toast.error('Fehler beim Laden der Vorschau');
    }
  };

  const updateField = (field, value) => {
    setCampaign(prev => ({ ...prev, [field]: value }));
  };

  const updateRules = (field, value) => {
    setCampaign(prev => ({
      ...prev,
      rules: { ...prev.rules, [field]: value }
    }));
  };

  const updateMessage = (field, value) => {
    setCampaign(prev => ({
      ...prev,
      message: { ...prev.message, [field]: value }
    }));
  };

  const updateSchedule = (field, value) => {
    setCampaign(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? 'Campaign bearbeiten' : 'Neue Campaign'}
            </h1>
            <p className="text-gray-600">Konfiguriere deine Marketing-Kampagne</p>
          </div>
        </div>
        <div className="flex gap-3">
          {id && (
            <button
              onClick={loadPreview}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Eye className="w-4 h-4" />
              Vorschau
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Speichert...' : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Section title="📋 Grundeinstellungen">
            <Input
              label="Campaign Name"
              value={campaign.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="z.B. Inaktive Kunden zurückgewinnen"
            />

            <Select
              label="Campaign Typ"
              value={campaign.type}
              onChange={(e) => updateField('type', e.target.value)}
              options={[
                { value: 'inactive_customers', label: 'Inaktive Kunden' },
                { value: 'birthday', label: 'Geburtstag' },
                { value: 'last_minute', label: 'Last-Minute' },
                { value: 'upsell', label: 'Upsell' },
                { value: 'loyalty', label: 'Treue-Bonus' }
              ]}
            />

            <Select
              label="Status"
              value={campaign.status}
              onChange={(e) => updateField('status', e.target.value)}
              options={[
                { value: 'draft', label: 'Entwurf' },
                { value: 'active', label: 'Aktiv' },
                { value: 'paused', label: 'Pausiert' }
              ]}
            />
          </Section>

          {/* Targeting Rules */}
          <Section title="🎯 Zielgruppen-Regeln">
            {campaign.type === 'inactive_customers' && (
              <Slider
                label="Inaktive Tage"
                value={campaign.rules.inactiveDays}
                onChange={(value) => updateRules('inactiveDays', value)}
                min={30}
                max={365}
                step={30}
                unit=" Tage"
              />
            )}

            {campaign.type === 'birthday' && (
              <Slider
                label="Tage vor Geburtstag"
                value={campaign.rules.birthdayDaysBefore}
                onChange={(value) => updateRules('birthdayDaysBefore', value)}
                min={0}
                max={30}
                step={1}
                unit=" Tage"
              />
            )}

            {campaign.type === 'loyalty' && (
              <Slider
                label="Mindest-Buchungen"
                value={campaign.rules.minBookings}
                onChange={(value) => updateRules('minBookings', value)}
                min={1}
                max={50}
                step={1}
                unit=" Buchungen"
              />
            )}

            {campaign.type === 'last_minute' && (
              <Select
                label="Zielgruppe"
                value={campaign.rules.targetSegment}
                onChange={(e) => updateRules('targetSegment', e.target.value)}
                options={[
                  { value: 'all', label: 'Alle Kunden' },
                  { value: 'vip', label: 'VIP (10+ Buchungen)' },
                  { value: 'regular', label: 'Stammkunden (3+ Buchungen)' },
                  { value: 'new', label: 'Neue Kunden' }
                ]}
              />
            )}

            <Slider
              label="Max. Empfänger"
              value={campaign.rules.maxRecipients}
              onChange={(value) => updateRules('maxRecipients', value)}
              min={10}
              max={500}
              step={10}
              unit=" Kunden"
            />
          </Section>

          {/* Message Editor */}
          <Section title="✉️ Nachricht & Rabatt">
            <Textarea
              label="SMS Template"
              value={campaign.message.template}
              onChange={(e) => updateMessage('template', e.target.value)}
              placeholder="Hallo {{customerName}}! ..."
              rows={4}
              maxLength={320}
            />
            <div className="text-xs text-gray-500 mb-4">
              Variablen: {'{{customerName}}'}, {'{{salonName}}'}, {'{{discount}}'}, {'{{discountCode}}'}, {'{{bookingLink}}'}, {'{{validDays}}'}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Rabatt Typ"
                value={campaign.message.discountType}
                onChange={(e) => updateMessage('discountType', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Prozent (%)' },
                  { value: 'fixed_amount', label: 'Fixer Betrag (€)' },
                  { value: 'none', label: 'Kein Rabatt' }
                ]}
              />

              {campaign.message.discountType !== 'none' && (
                <Input
                  label="Rabatt Wert"
                  type="number"
                  value={campaign.message.discountValue}
                  onChange={(e) => updateMessage('discountValue', Number(e.target.value))}
                  min={0}
                  max={campaign.message.discountType === 'percentage' ? 100 : 1000}
                />
              )}
            </div>

            {campaign.message.discountType !== 'none' && (
              <Slider
                label="Gültigkeit"
                value={campaign.message.validDays}
                onChange={(value) => updateMessage('validDays', value)}
                min={1}
                max={90}
                step={1}
                unit=" Tage"
              />
            )}
          </Section>

          {/* Schedule */}
          <Section title="📅 Zeitplan">
            <Select
              label="Ausführung"
              value={campaign.schedule.type}
              onChange={(e) => updateSchedule('type', e.target.value)}
              options={[
                { value: 'manual', label: 'Manuell (nur auf Knopfdruck)' },
                { value: 'daily', label: 'Täglich' },
                { value: 'weekly', label: 'Wöchentlich' }
              ]}
            />

            {campaign.schedule.type !== 'manual' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Uhrzeit"
                  type="time"
                  value={campaign.schedule.time}
                  onChange={(e) => updateSchedule('time', e.target.value)}
                />

                {campaign.schedule.type === 'weekly' && (
                  <Select
                    label="Wochentag"
                    value={campaign.schedule.dayOfWeek}
                    onChange={(e) => updateSchedule('dayOfWeek', Number(e.target.value))}
                    options={[
                      { value: 0, label: 'Sonntag' },
                      { value: 1, label: 'Montag' },
                      { value: 2, label: 'Dienstag' },
                      { value: 3, label: 'Mittwoch' },
                      { value: 4, label: 'Donnerstag' },
                      { value: 5, label: 'Freitag' },
                      { value: 6, label: 'Samstag' }
                    ]}
                  />
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          {preview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 sticky top-6"
            >
              <h3 className="text-lg font-semibold mb-4">📊 Vorschau</h3>

              <div className="space-y-4">
                <PreviewStat
                  icon={<Users className="w-5 h-5" />}
                  label="Empfänger"
                  value={preview.totalRecipients}
                />
                <PreviewStat
                  icon={<Euro className="w-5 h-5" />}
                  label="Geschätzte Kosten"
                  value={`${preview.estimatedCost}€`}
                />
              </div>

              {preview.sampleMessage && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Beispiel-SMS:</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200">
                    {preview.sampleMessage}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-right">
                    {preview.sampleMessage.length} / 320 Zeichen
                  </div>
                </div>
              )}

              {preview.recipients && preview.recipients.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Erste {preview.recipients.length} Empfänger:
                  </h4>
                  <div className="space-y-2">
                    {preview.recipients.map((r, i) => (
                      <div key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {r.name} ({r.phoneNumber})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-6"
  >
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

// Input Component
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      {...props}
    />
  </div>
);

// Textarea Component
const Textarea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <textarea
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      {...props}
    />
  </div>
);

// Select Component
const Select = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Slider Component
const Slider = ({ label, value, onChange, min, max, step, unit = '' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-sm font-semibold text-blue-600">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

// Preview Stat Component
const PreviewStat = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-lg font-semibold text-gray-900">{value}</span>
  </div>
);

export default CampaignEditor;
