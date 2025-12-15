import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  SkipForward,
  TrendingUp,
  Users,
  RefreshCcw,
  Calendar
} from 'lucide-react';
import api from '../../utils/api';

/**
 * CEO Lifecycle Emails Dashboard
 * Shows stats and history of automated trial nurturing emails
 */
const LifecycleEmails = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ceo/analytics/lifecycle-emails');
      if (response.data.success) {
        setStats(response.data);
      } else {
        setError('Failed to load lifecycle email stats');
      }
    } catch (err) {
      console.error('Lifecycle email stats error:', err);
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const getEmailTypeName = (type) => {
    const names = {
      'welcome_day1': 'Tag 1: Willkommen',
      'engagement_day3': 'Tag 3: Engagement',
      'midtrial_day7': 'Tag 7: Mid-Trial',
      'urgency_day23': 'Tag 23: Urgency',
      'expiry_day30': 'Tag 30: Ablauf',
      'expired_day31': 'Tag 31: Post-Expiry',
      'winback_day45': 'Tag 45: Win-Back'
    };
    return names[type] || type;
  };

  const getEmailTypeColor = (type) => {
    const colors = {
      'welcome_day1': 'bg-green-100 text-green-800',
      'engagement_day3': 'bg-blue-100 text-blue-800',
      'midtrial_day7': 'bg-purple-100 text-purple-800',
      'urgency_day23': 'bg-yellow-100 text-yellow-800',
      'expiry_day30': 'bg-red-100 text-red-800',
      'expired_day31': 'bg-orange-100 text-orange-800',
      'winback_day45': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button 
            onClick={fetchStats}
            className="ml-4 text-red-600 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lifecycle E-Mails</h1>
          <p className="text-gray-600 mt-1">
            Automatisierte Trial-Nurturing E-Mails für Conversion-Optimierung
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Gesamt geplant</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats?.sent || 0}</p>
              <p className="text-sm text-gray-500">Gesendet</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats?.pending || 0}</p>
              <p className="text-sm text-gray-500">Ausstehend</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats?.failed || 0}</p>
              <p className="text-sm text-gray-500">Fehlgeschlagen</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats?.sendRate || 0}%</p>
              <p className="text-sm text-gray-500">Senderate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Type Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">E-Mail Performance nach Typ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail Typ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gesendet</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gesamt</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Senderate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conversions</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.byType?.map((email) => (
                <tr key={email.type} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getEmailTypeColor(email.type)}`}>
                      {getEmailTypeName(email.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 font-medium">{email.sent}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{email.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-medium ${email.sendRate >= 80 ? 'text-green-600' : email.sendRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {email.sendRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 font-medium">{email.conversions}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-medium ${email.conversionRate >= 10 ? 'text-green-600' : email.conversionRate >= 5 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {email.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Sent */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Kürzlich gesendet</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {stats?.recentlySent?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Noch keine E-Mails gesendet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats?.recentlySent?.map((email) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getEmailTypeColor(email.type)}`}>
                          {getEmailTypeName(email.type)}
                        </span>
                        <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                          {email.salon}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{email.user}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {email.sentAt ? new Date(email.sentAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Geplante E-Mails</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {stats?.upcoming?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Keine E-Mails geplant
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats?.upcoming?.map((email) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getEmailTypeColor(email.type)}`}>
                          {getEmailTypeName(email.type)}
                        </span>
                        <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                          {email.salon}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{email.user}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {email.scheduledFor ? new Date(email.scheduledFor).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📧 Lifecycle E-Mail Flow</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Tag 1:</strong> Willkommen + Setup-Guide</p>
          <p><strong>Tag 3:</strong> &quot;Hast du schon deinen ersten Termin erstellt?&quot;</p>
          <p><strong>Tag 7:</strong> &quot;Noch 23 Tage Trial – brauchst du Hilfe?&quot;</p>
          <p><strong>Tag 23:</strong> &quot;Nur noch 7 Tage – jetzt upgraden!&quot;</p>
          <p><strong>Tag 30:</strong> &quot;Dein Trial endet heute – letzte Chance!&quot;</p>
          <p><strong>Tag 31:</strong> &quot;Trial abgelaufen – 20% Rabatt als Dankeschön&quot;</p>
          <p><strong>Tag 45:</strong> Win-Back Kampagne</p>
        </div>
      </div>
    </div>
  );
};

export default LifecycleEmails;
