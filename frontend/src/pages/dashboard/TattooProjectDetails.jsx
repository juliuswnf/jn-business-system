import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * Tattoo Project Details & Progress
 * View project progress, sessions timeline, and photo gallery
 */

const TattooProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      // ? SECURITY FIX: Use central api instance
      const { api } = await import('../../utils/api');
      const res = await api.get(`/tattoo/projects/${id}`);
      const data = res.data;
      if (data.success) {
        setProject(data.project);
        setSessions(data.sessions);
        setConsents(data.consents);
      } else {
        toast.error(data.error || 'Fehler beim Laden');
      }
    } catch (error) {
      toast.error('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (sessionId, progress, notes) => {
    try {
      // ? SECURITY FIX: Use central api instance
      const { api } = await import('../../utils/api');
      const res = await api.post(`/tattoo/sessions/${sessionId}/complete`, { progress, notes });
      const data = res.data;
      if (data.success) {
        toast.success('Session abgeschlossen!');
        setShowCompleteModal(null);
        fetchProjectDetails();
      } else {
        toast.error(data.error || 'Fehler');
      }
    } catch (error) {
      toast.error('Netzwerkfehler');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-gray-500">Lädt Projekt...</div>
    </div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-gray-500">Projekt nicht gefunden</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{project.name}</h1>
              <p className="text-gray-500 mt-1">{project.bodyPart} • {project.style}</p>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <span className="text-sm text-gray-400">Kunde:</span>
                  <span className="ml-2 font-medium">
                    {project.customerId?.firstName} {project.customerId?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Artist:</span>
                  <span className="ml-2 font-medium">
                    {project.artistId ? `${project.artistId.firstName} ${project.artistId.lastName}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#4f46e5"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(project.progress / 100) * 351.86} 351.86`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-semibold tracking-tight text-gray-900">{project.progress}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Fortschritt</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-400">Sessions</p>
              <p className="text-xl md:text-xl font-semibold tracking-tight text-gray-900">
                {project.completedSessions}/{project.totalSessions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Geschätzt</p>
              <p className="text-xl font-semibold tracking-tight text-gray-900">€{(project.estimatedPrice / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tatsächlich</p>
              <p className="text-xl font-semibold tracking-tight text-green-600">€{(project.actualPrice / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{project.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Sessions Timeline */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Sessions Timeline</h2>

          {sessions.length === 0 ? (
            <p className="text-gray-400">Keine Sessions geplant. Erstelle die erste Session!</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isLast={index === sessions.length - 1}
                  onComplete={() => setShowCompleteModal(session)}
                />
              ))}
            </div>
          )}

          <Link
            to={`/dashboard/tattoo/sessions/new?projectId=${id}`}
            className="mt-4 inline-block px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-100"
          >
            + Neue Session planen
          </Link>
        </div>

        {/* Photo Gallery */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Photo Gallery</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sessions.flatMap(session => session.photos || []).length === 0 ? (
              <p className="text-gray-400 col-span-4">Keine Fotos hochgeladen</p>
            ) : (
              sessions.flatMap(session =>
                (session.photos || []).map((photo, idx) => (
                  <div key={`${session._id}-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={photo.url}
                      alt={`Session ${session.sessionNumber}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-50 text-gray-900 text-xs p-2">
                      Session {session.sessionNumber}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Consents */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Einverständniserklärungen</h2>

          {consents.length === 0 ? (
            <p className="text-gray-400">Keine Consents vorhanden</p>
          ) : (
            <div className="space-y-2">
              {consents.map(consent => (
                <div key={consent._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{consent.type.replace('_', ' ')}</span>
                    <span className={`ml-3 px-2 py-1 text-xs rounded ${
                      consent.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {consent.status}
                    </span>
                  </div>
                  {consent.signedAt && (
                    <span className="text-sm text-gray-400">
                      Unterschrieben: {new Date(consent.signedAt).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Session Modal */}
      {showCompleteModal && (
        <CompleteSessionModal
          session={showCompleteModal}
          onClose={() => setShowCompleteModal(null)}
          onComplete={handleCompleteSession}
        />
      )}
    </div>
  );
};

// Session Card Component
const SessionCard = ({ session, isLast, onComplete }) => {
  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          session.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
        } text-gray-900 font-bold`}>
          {session.sessionNumber}
        </div>
        {!isLast && <div className="w-0.5 h-12 bg-gray-300" />}
      </div>

      <div className="flex-1 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">Session {session.sessionNumber}</h3>
            {session.phase && <p className="text-sm text-gray-500">{session.phase}</p>}
            {session.scheduledDate && (
              <p className="text-sm text-gray-400 mt-1">
                {new Date(session.scheduledDate).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[session.status]}`}>
            {session.status}
          </span>
        </div>

        {session.notes && (
          <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
        )}

        {session.status === 'scheduled' && (
          <button
            onClick={onComplete}
            className="mt-2 text-sm text-gray-900 hover:text-gray-700 font-medium"
          >
            Session abschließen →
          </button>
        )}
      </div>
    </div>
  );
};

// Complete Session Modal
const CompleteSessionModal = ({ session, onClose, onComplete }) => {
  const [progress, setProgress] = useState(session.progress || 0);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-bold mb-4">Session {session.sessionNumber} abschließen</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress nach dieser Session (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Was wurde gemacht? Wie lief die Session?"
              className="w-full px-3 py-2 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onComplete(session._id, progress, notes)}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-100"
          >
            Abschließen
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TattooProjectDetails;
