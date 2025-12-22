import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';

/**
 * ChartCard Component
 * Wrapper for charts with header and controls
 * 
 * Props:
 * - title: Chart title
 * - children: Chart component
 * - onRefresh: refresh handler
 * - onMore: more options handler
 * - loading: loading state
 */
const ChartCard = ({
  title,
  children,
  onRefresh = null,
  onMore = null,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 hover:bg-zinc-700 rounded transition disabled:opacity-50 text-gray-400 hover:text-white"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            
            {onMore && (
              <button
                onClick={onMore}
                className="p-2 hover:bg-zinc-700 rounded transition text-gray-400 hover:text-white"
                title="More options"
              >
                <FiMoreVertical size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {loading && (
          <div className="absolute inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center rounded z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
