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
    <div className={`bg-white rounded-lg shadow-sm ${variantClasses[variant]} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <Icon size={24} />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        
        {action && (
          <div className="text-sm">
            {action}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;
