export const ERROR_BORDER = {
  resolved: 'border-gray-200 opacity-60',
  critical: 'border-red-500/50',
  error: 'border-orange-500/30',
  warning: 'border-yellow-500/30'
};

export const ERROR_ICON_BG = {
  resolved: 'bg-green-500/20',
  critical: 'bg-red-500/20',
  error: 'bg-orange-500/20',
  warning: 'bg-yellow-500/20'
};

export const ERROR_BADGE = {
  resolved: 'bg-green-500/20 text-green-600',
  critical: 'bg-red-500/20 text-red-600',
  error: 'bg-orange-500/20 text-orange-400',
  warning: 'bg-yellow-500/20 text-yellow-600'
};

export const ERROR_BADGE_LABEL = {
  resolved: 'Geloest',
  critical: 'Kritisch',
  error: 'Fehler',
  warning: 'Warnung'
};

export const getErrorTypeKey = (error) => (
  error.resolved ? 'resolved' : (error.type || 'warning')
);

export const SERVICE_STATUS_COLOR = {
  running: 'bg-green-500',
  stopped: 'bg-red-500',
  starting: 'bg-yellow-500 animate-pulse',
  stopping: 'bg-yellow-500 animate-pulse',
  error: 'bg-red-600'
};

export const SERVICE_STATUS_TEXT = {
  running: 'Laeuft',
  stopped: 'Gestoppt',
  starting: 'Startet...',
  stopping: 'Stoppt...',
  error: 'Fehler'
};
