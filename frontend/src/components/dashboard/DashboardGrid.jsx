import React from 'react';

/**
 * DashboardGrid Component
 * Responsive grid layout for dashboard components
 * 
 * Props:
 * - children: Dashboard components
 * - cols: number of columns
 * - gap: gap size
 */
const DashboardGrid = ({
  children,
  cols = 3,
  gap = 'gap-6'
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${colClasses[cols]} ${gap}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;
