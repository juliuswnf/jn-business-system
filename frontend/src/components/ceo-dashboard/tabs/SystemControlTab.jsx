import { lazy, Suspense, useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { api, API_URL } from '../../../utils/api';
import { captureError } from '../../../utils/errorTracking';

const ServiceGrid = lazy(() => import('../system/ServiceGrid'));
const SystemLogsPanel = lazy(() => import('../system/SystemLogsPanel'));

const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const DEFAULT_SERVICES = [
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Datenbank-Container',
    status: 'unknown',
    port: 27017,
    type: 'database',
    command: 'docker'
  },
  {
    id: 'backend',
    name: 'Backend Server',
    description: 'Node.js API Server',
    status: 'unknown',
    port: 3000,
    type: 'server',
    command: 'node'
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'React Development Server',
    status: 'unknown',
    port: 3000,
    type: 'server',
    command: 'vite'
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Cache und Queue Service',
    status: 'unknown',
    port: 6379,
    type: 'cache',
    command: 'docker'
  }
];

const STARTUP_ORDER = [
  { step: 1, name: 'MongoDB', desc: 'Datenbank', badgeClass: 'bg-green-500/20 text-green-600' },
  { step: 2, name: 'Redis', desc: 'Cache Layer', badgeClass: 'bg-red-500/20 text-red-600' },
  { step: 3, name: 'Backend', desc: 'API Server', badgeClass: 'bg-yellow-500/20 text-yellow-600' },
  { step: 4, name: 'Frontend', desc: 'React App', badgeClass: 'bg-blue-500/20 text-blue-600' }
];

export default function SystemControlTab() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [actionLoading, setActionLoading] = useState({});
  const [logs, setLogs] = useState([]);
  const [allStarting, setAllStarting] = useState(false);
  const [allStopping, setAllStopping] = useState(false);

  const checkServiceStatus = async (serviceId) => {
    try {
      const response = await api.get(`/ceo/system/status/${serviceId}`);

      if (response.data) {
        const data = response.data;
        setServices((prev) => prev.map((entry) => (
          entry.id === serviceId ? { ...entry, status: data.status } : entry
        )));
      }
    } catch (err) {
      captureError(err, { context: 'checkServiceStatus', serviceId });
    }
  };

  useEffect(() => {
    DEFAULT_SERVICES.forEach((service) => checkServiceStatus(service.id));

    const interval = setInterval(() => {
      DEFAULT_SERVICES.forEach((service) => checkServiceStatus(service.id));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setLogs((prevLogs) => [...prevLogs, { timestamp, message, type }].slice(-50));
  };

  const startService = async (serviceId) => {
    setActionLoading((prev) => ({ ...prev, [serviceId]: 'starting' }));
    addLog(`Starte ${serviceId}...`, 'info');

    try {
      const response = await api.post(`/ceo/system/start/${serviceId}`);
      const data = response.data;

      if (data.success) {
        addLog(`[OK] ${serviceId} erfolgreich gestartet`, 'success');
        setServices((prev) => prev.map((entry) => (
          entry.id === serviceId ? { ...entry, status: 'running' } : entry
        )));
      } else {
        addLog(`[ERR] Fehler beim Starten von ${serviceId}: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [serviceId]: null }));
    }
  };

  const stopService = async (serviceId) => {
    setActionLoading((prev) => ({ ...prev, [serviceId]: 'stopping' }));
    addLog(`Stoppe ${serviceId}...`, 'info');

    try {
      const response = await api.post(`/ceo/system/stop/${serviceId}`);
      const data = response.data;

      if (data.success) {
        addLog(`[OK] ${serviceId} gestoppt`, 'success');
        setServices((prev) => prev.map((entry) => (
          entry.id === serviceId ? { ...entry, status: 'stopped' } : entry
        )));
      } else {
        addLog(`[ERR] Fehler beim Stoppen von ${serviceId}: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [serviceId]: null }));
    }
  };

  const applyStartAllResults = (results) => {
    results?.forEach((result) => {
      if (result.success) {
        setServices((prev) => prev.map((entry) => (
          entry.id === result.service ? { ...entry, status: 'running' } : entry
        )));
        addLog(`  > ${result.service} gestartet`, 'success');
      } else {
        addLog(`  X ${result.service}: ${result.message}`, 'error');
      }
    });
  };

  const startAllServices = async () => {
    setAllStarting(true);
    addLog('[SYS] Starte alle Services...', 'info');

    try {
      const response = await api.post('/ceo/system/start-all');
      const data = response.data;

      if (data.success) {
        addLog('[OK] Alle Services werden gestartet...', 'success');
        applyStartAllResults(data.results);
      } else {
        addLog(`[ERR] Fehler: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setAllStarting(false);
      setTimeout(() => DEFAULT_SERVICES.forEach((service) => checkServiceStatus(service.id)), 3000);
    }
  };

  const stopAllServices = async () => {
    setAllStopping(true);
    addLog('[SYS] Stoppe alle Services...', 'info');

    try {
      const response = await api.post('/ceo/system/stop-all');
      const data = response.data;

      if (data.success) {
        addLog('[OK] Alle Services werden gestoppt...', 'success');
        setServices((prev) => prev.map((entry) => ({ ...entry, status: 'stopped' })));
      } else {
        addLog(`[ERR] Fehler: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`[ERR] Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      setAllStopping(false);
    }
  };

  const runningCount = services.filter((entry) => entry.status === 'running').length;
  const stoppedCount = services.filter((entry) => entry.status === 'stopped').length;
  const unknownCount = services.filter((entry) => entry.status === 'unknown').length;
  const healthPercent = services.length > 0
    ? Math.round((runningCount / services.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Services</h2>
            <p className="text-gray-400 text-sm">Alle System-Komponenten im Ueberblick</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={startAllServices}
              disabled={allStarting || allStopping}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                allStarting
                  ? 'bg-green-500/20 text-green-600 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {allStarting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Play size={16} />
              )}
              {allStarting ? 'Startet...' : 'Alle Starten'}
            </button>
            <button
              onClick={stopAllServices}
              disabled={allStarting || allStopping}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                allStopping
                  ? 'bg-red-500/20 text-red-600 cursor-wait'
                  : 'bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              {allStopping ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
              ) : (
                <Square size={16} />
              )}
              {allStopping ? 'Stoppt...' : 'Alle Stoppen'}
            </button>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
              Service-Liste wird geladen...
            </div>
          }
        >
          <ServiceGrid
            services={services}
            actionLoading={actionLoading}
            onStart={startService}
            onStop={stopService}
            onRefresh={checkServiceStatus}
          />
        </Suspense>

        <Suspense
          fallback={
            <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
              Logs werden geladen...
            </div>
          }
        >
          <SystemLogsPanel logs={logs} onClear={() => setLogs([])} />
        </Suspense>
      </div>

      <div className="space-y-6">
        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <StatusStat label="Aktive Services" value={`${runningCount}/${services.length}`} valueClass="text-green-600" />
            <StatusStat label="Gestoppt" value={stoppedCount} valueClass="text-red-600" />
            <StatusStat label="Unbekannt" value={unknownCount} valueClass="text-gray-500" />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">System Health</span>
              <span className="text-gray-900 font-medium">{healthPercent}%</span>
            </div>
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${healthPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-200/20 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <QuickActionButton
              onClick={() => window.open(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://app.jn-business-system.de', '_blank')}
              title="Frontend oeffnen"
              subtitle="app.jn-business-system.de"
              iconClass="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </QuickActionButton>

            <QuickActionButton
              onClick={() => window.open(`${BACKEND_ORIGIN}/api/health`, '_blank')}
              title="Backend Health"
              subtitle="API Status pruefen"
              iconClass="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </QuickActionButton>
          </div>
        </div>

        <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Startup-Reihenfolge</h3>
          <div className="space-y-3">
            {STARTUP_ORDER.map((entry) => (
              <div key={entry.step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${entry.badgeClass}`}>
                  {entry.step}
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">{entry.name}</p>
                  <p className="text-gray-400 text-xs">{entry.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusStat({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
      <span className="text-gray-500">{label}</span>
      <span className={`text-xl font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}

function QuickActionButton({ onClick, title, subtitle, iconClass, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white/30 rounded-lg text-left hover:bg-white/50 transition group"
    >
      <div className={iconClass}>{children}</div>
      <div className="flex-1">
        <p className="text-gray-900 text-sm font-medium">{title}</p>
        <p className="text-gray-400 text-xs">{subtitle}</p>
      </div>
      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  );
}
