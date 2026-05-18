export default function SystemLogsPanel({ logs, onClear }) {
  return (
    <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-900">System Logs</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
        >
          Leeren
        </button>
      </div>
      <div className="bg-white rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs scrollbar-thin">
        {logs.length === 0 ? (
          <div className="text-gray-500 flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Keine Logs vorhanden...
            </div>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`py-1.5 border-b border-gray-900 last:border-0 ${
                log.type === 'error' ? 'text-red-600' :
                log.type === 'success' ? 'text-green-600' :
                'text-gray-500'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
