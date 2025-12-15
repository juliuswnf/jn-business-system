import React from 'react';

/**
 * MetricBox Component
 * Small box showing a single metric value
 * 
 * Props:
 * - label: Metric label
 * - value: Metric value
 * - unit: Unit (e.g., '%', '€')
 * - change: Change value with direction
 */
const MetricBox = ({
  label,
  value,
  unit = '',
  change = null,
  className = ''
}) => {
  const isPositive = change && change >= 0;

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-800">
          {value}
        </span>
        {unit && (
          <span className="text-gray-600 text-sm">{unit}</span>
        )}
      </div>

      {change !== null && (
        <p className={`text-xs mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% from last period
        </p>
      )}
    </div>
  );
};

export default MetricBox;
