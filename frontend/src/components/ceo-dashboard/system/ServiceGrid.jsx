import { Play, RefreshCw, Square } from 'lucide-react';
import { SERVICE_STATUS_COLOR, SERVICE_STATUS_TEXT } from '../utils/statusMaps';

const getStatusColor = (status) => SERVICE_STATUS_COLOR[status] || 'bg-gray-500';
const getStatusText = (status) => SERVICE_STATUS_TEXT[status] || 'Unbekannt';

const getTypeIcon = (type) => {
  const iconClass = 'w-6 h-6 text-gray-500';

  switch (type) {
    case 'database':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
    case 'server':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case 'cache':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};

export default function ServiceGrid({ services, actionLoading, onStart, onStop, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => {
        const isRunning = service.status === 'running';
        const isStopped = service.status === 'stopped';

        return (
          <div
            key={service.id}
            className={`bg-white/50 border rounded-xl p-5 transition-all ${
              isRunning
                ? 'border-green-500/30 shadow-sm shadow-green-500/10'
                : 'border-gray-200 hover:border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isRunning ? 'bg-green-500/20' : 'bg-gray-50'
                }`}>
                  {getTypeIcon(service.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-gray-400 text-sm">{service.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                  <span className="text-sm text-gray-500">{getStatusText(service.status)}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">:{service.port}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onStart(service.id)}
                  disabled={actionLoading[service.id] || isRunning}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    isRunning
                      ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                      : actionLoading[service.id] === 'starting'
                      ? 'bg-green-500/20 text-green-600 cursor-wait'
                      : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                  }`}
                >
                  {actionLoading[service.id] === 'starting' ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-400 border-t-transparent"></div>
                  ) : (
                    <Play size={14} />
                  )}
                </button>
                <button
                  onClick={() => onStop(service.id)}
                  disabled={actionLoading[service.id] || isStopped}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    isStopped
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : actionLoading[service.id] === 'stopping'
                      ? 'bg-red-500/20 text-red-600 cursor-wait'
                      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  }`}
                >
                  {actionLoading[service.id] === 'stopping' ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent"></div>
                  ) : (
                    <Square size={14} />
                  )}
                </button>
                <button
                  onClick={() => onRefresh(service.id)}
                  className="px-2 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-400 hover:text-gray-700 transition"
                  title="Status aktualisieren"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
