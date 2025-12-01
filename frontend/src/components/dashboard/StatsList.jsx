import React from 'react';

const StatsList = ({ stats = [] }) => {
  return (
    <div className="space-y-3">
      {stats.length === 0 ? (
        <p className="text-gray-500">No stats available</p>
      ) : (
        stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-gray-100 rounded">
            <span className="font-medium text-gray-700">{stat.label}</span>
            <span className="text-lg font-bold text-gray-900">{stat.value}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default StatsList;
