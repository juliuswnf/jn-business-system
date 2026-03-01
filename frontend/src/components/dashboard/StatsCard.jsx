import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

/**
 * StatsCard Component
 * Displays key statistics with trend indicator
 * 
 * Props:
 * - title: Card title
 * - value: Main value to display
 * - suffix: Value suffix (e.g., '€', '%')
 * - icon: React Icon component
 * - trend: percentage change (positive or negative)
 * - trendText: text for trend (e.g., 'vs last month')
 * - backgroundColor: bg color class
 * - textColor: text color class
 * - iconColor: icon color class
 * - onClick: click handler
 */
const StatsCard = ({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend = null,
  trendText = 'vs last period',
  backgroundColor = 'bg-blue-50',
  textColor = 'text-blue-600',
  iconColor = 'text-blue-500',
  onClick = null,
  className = ''
}) => {
  const isTrendPositive = trend !== null && trend >= 0;
  const trendColor = isTrendPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isTrendPositive ? FiTrendingUp : FiTrendingDown;

  return (
    <div
      onClick={onClick}
      className={`${backgroundColor} rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Left Content */}
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          
          <div className="flex items-baseline gap-2">
            <h3 className={`${textColor} text-3xl font-bold`}>
              {value}
            </h3>
            {suffix && (
              <span className={`${textColor} text-lg font-semibold`}>
                {suffix}
              </span>
            )}
          </div>

          {/* Trend Indicator */}
          {trend !== null && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`${trendColor} text-sm`} />
              <span className={`${trendColor} text-xs font-semibold`}>
                {isTrendPositive ? '+' : ''}{trend}%
              </span>
              <span className="text-zinc-400 text-xs">{trendText}</span>
            </div>
          )}
        </div>

        {/* Right Icon */}
        {Icon && (
          <div className={`${iconColor} opacity-10 ml-4`}>
            <Icon size={48} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
