import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function WorkflowProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const projectRes = await axios.get(
        `${API_URL}/api/workflows/projects/${id}`,
        { headers }
      );
      setProject(projectRes.data.data);

      const sessionsRes = await axios.get(
        `${API_URL}/api/workflows/sessions/${id}`,
        { headers }
      );
      setSessions(sessionsRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Fehler beim Laden');
      setLoading(false);
    }
  };

  const handleCompleteSession = async (sessionId, progress, notes) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/workflows/sessions/${sessionId}/complete`,
        { progress, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session abgeschlossen!');
      setShowCompleteModal(false);
      fetchProjectDetails();
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Fehler beim Abschließen');
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getIndustryIcon = (industry) => {
    const icons = {
      tattoo: 'ðŸŽ¨',
      medical_aesthetics: 'ðŸ’‰',
      spa_wellness: 'ðŸ§–',
      barbershop: 'ðŸ’ˆ',
      nails: 'ðŸ’…',
      massage: 'ðŸ’†',
      physiotherapy: 'ðŸ©º',
      generic: 'ðŸ“‹'
    };
    return icons[industry] || 'ðŸ“‹';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-zinc-800 text-zinc-300',
      scheduled: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      no_show: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/workflow-projects')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          â† ZurÃ¼ck zu Projekten
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-5xl mr-4">{getIndustryIcon(project.industry)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/workflow-projects/${id}/edit`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Bearbeiten
          </button>
        </div>
      </div>

      {/* Progress Circle */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fortschritt</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {project.completedSessions}/{project.totalSessions}
                </div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{project.progress}%</div>
                <div className="text-sm text-gray-600">Fortschritt</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {project.totalPrice.toLocaleString()}â‚¬
                </div>
                <div className="text-sm text-gray-600">Gesamtpreis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {project.paidAmount.toLocaleString()}â‚¬
                </div>
                <div className="text-sm text-gray-600">Bezahlt</div>
              </div>
            </div>
          </div>
          <div className="ml-8">
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#3b82f6"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${(project.progress / 100) * 314} 314`}
                strokeLinecap="round"
              />
              <text
                x="60"
                y="60"
                textAnchor="middle"
                dy=".3em"
                className="text-2xl font-bold fill-gray-900 transform rotate-90"
                style={{ transformOrigin: '60px 60px' }}
              >
                {project.progress}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Sessions Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sessions</h3>
          <button
            onClick={() => navigate(`/dashboard/workflow-projects/${id}/new-session`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + Neue Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Noch keine Sessions geplant</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <SessionCard
                key={session._id}
                session={session}
                index={index}
                onComplete={(session) => {
                  setSelectedSession(session);
                  setShowCompleteModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      {sessions.some(s => s.photos?.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto-Galerie</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sessions
              .flatMap(s => s.photos || [])
              .map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Project photo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    {photo.type} - {photo.caption}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Consents */}
      {project.consents?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Einwilligungen</h3>
          <div className="space-y-2">
            {project.consents.map((consent) => (
              <div
                key={consent._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{consent.type}</div>
                  <div className="text-xs text-gray-500">
                    {consent.signedAt ? `Unterschrieben: ${new Date(consent.signedAt).toLocaleDateString('de-DE')}` : 'Ausstehend'}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(consent.status)}`}>
                  {consent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {showCompleteModal && selectedSession && (
        <CompleteSessionModal
          session={selectedSession}
          onClose={() => setShowCompleteModal(false)}
          onComplete={handleCompleteSession}
        />
      )}
    </div>
  );
}

function SessionCard({ session, index, onComplete }) {
  const getStatusIcon = (status) => {
    const icons = {
      scheduled: 'ðŸ“…',
      in_progress: 'ðŸ”„',
      completed: 'âœ…',
      cancelled: 'âŒ',
      no_show: 'âš ï¸'
    };
    return icons[status] || 'ðŸ“‹';
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      no_show: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || colors.scheduled;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center p-4 bg-zinc-800 rounded-lg border border-zinc-700"
    >
      <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full text-xl font-bold text-blue-400 mr-4">
        {session.sessionNumber}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getStatusIcon(session.status)}</span>
            <span className="font-medium text-white">{session.phase || 'Session'}</span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
        {session.scheduledDate && (
          <div className="text-sm text-zinc-400 mb-1">
            📅 {new Date(session.scheduledDate).toLocaleString('de-DE')}
          </div>
        )}
        {session.notes && (
          <div className="text-sm text-zinc-400">📝 {session.notes}</div>
        )}
        {session.status === 'scheduled' && (
          <button
            onClick={() => onComplete(session)}
            className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Session abschließen
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CompleteSessionModal({ session, onClose, onComplete }) {
  const [progress, setProgress] = useState(100);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(session._id, progress, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Session {session.sessionNumber} abschließen
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Fortschritt nach dieser Session: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Was wurde gemacht? Wie war die Session?"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 text-zinc-300 py-2 px-4 rounded-lg hover:bg-zinc-700 border border-zinc-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Abschließen
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
