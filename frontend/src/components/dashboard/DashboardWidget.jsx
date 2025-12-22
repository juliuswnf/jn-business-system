import React from 'react';

/**
 * DashboardWidget Component
 * Generic widget container for dashboard items
 * 
 * Props:
 * - title: Widget title
 * - icon: Icon component
 * - children: Widget content
 * - action: Action button/link
 * - variant: 'default' | 'compact' | 'expanded'
 */
const DashboardWidget = ({
  title,
  icon: Icon,
  children,
  action = null,
  variant = 'default',
  className = ''
}) => {
  const variantClasses = {
    default: 'p-6',
    compact: 'p-4',
    expanded: 'p-8'
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center">
                <Icon size={20} className="text-gray-400" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          
          {action && (
            <div className="text-sm">
              {action}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${variantClasses[variant]}`}>
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;
