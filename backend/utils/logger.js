/* eslint-disable no-console */
// Simple logger wrapper to centralize logs and satisfy ESLint (no-console)
export default {
  info: (...args) => console.log('[INFO]', ...args),
  // `log` is kept as an alias for backward compatibility with replaced console.log calls
  log: (...args) => console.log('[LOG]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args)
};
