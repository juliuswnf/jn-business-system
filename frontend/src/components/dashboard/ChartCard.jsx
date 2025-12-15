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
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50"
              title="Refresh"
            >
              ↻
            </button>
          )}
          
          {onMore && (
            <button
              onClick={onMore}
              className="p-2 hover:bg-gray-100 rounded transition"
              title="More options"
            >
              <FiMoreVertical size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded z-10">
            <div className="animate-spin">⟳</div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
