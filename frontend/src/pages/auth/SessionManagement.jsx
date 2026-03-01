import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, formatError } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';

const SessionManagement = () => {
  const { showNotification } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await authAPI.getActiveSessions();
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setRevoking(sessionId);
    try {
      const response = await authAPI.revokeSession(sessionId);
      if (response.data.success) {
        showNotification('Session revoked', 'success');
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      showNotification(formatError(error), 'error');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-4 py-12">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Active Sessions</h1>
          <Link
            to="/customer/settings"
            className="px-4 py-2 text-accent hover:text-accent-light font-semibold transition"
          >
            ← Back
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-lg bg-secondary/50 border border-zinc-200 p-8 text-center">
            <p className="text-zinc-400">No active sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg bg-secondary/50 border border-zinc-200 p-6 hover:border-zinc-300 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {session.deviceName || 'Unknown Device'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {session.userAgent}
                    </p>
                  </div>
                  {session.isCurrent && (
                    <span className="px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold">
                      Current
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-400">IP Address</p>
                    <p className="text-zinc-900 font-mono">{session.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Last Active</p>
                    <p className="text-zinc-900">
                      {new Date(session.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20 hover:border-red-500/50 font-semibold transition disabled:opacity-50"
                  >
                    {revoking === session.id ? '⏳ Revoking...' : '🚫 Revoke Session'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;
