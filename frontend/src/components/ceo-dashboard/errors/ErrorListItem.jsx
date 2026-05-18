import {
  ERROR_BADGE,
  ERROR_BADGE_LABEL,
  ERROR_BORDER,
  ERROR_ICON_BG,
  getErrorTypeKey
} from '../utils/statusMaps';

export default function ErrorListItem({ error, isSelected, onSelect, formatTimestamp }) {
  const typeKey = getErrorTypeKey(error);

  return (
    <div
      onClick={() => onSelect(error)}
      className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      } ${ERROR_BORDER[typeKey]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ERROR_ICON_BG[typeKey]}`}>
          {error.resolved ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 ${error.type === 'critical' ? 'text-red-600' : error.type === 'error' ? 'text-orange-400' : 'text-yellow-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`font-medium ${error.resolved ? 'text-gray-400' : 'text-gray-900'}`}>{error.message}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                <span>{formatTimestamp(error.timestamp)}</span>
                {error.source && <span className="capitalize">• {error.source}</span>}
                {error.salon && <span>• {error.salon.name}</span>}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${ERROR_BADGE[typeKey]}`}>
              {ERROR_BADGE_LABEL[typeKey]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
