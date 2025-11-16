import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-dark-700 rounded-lg mb-4" />
      <div className="h-4 bg-dark-700 rounded w-1/4 mb-2" />
      <div className="h-6 bg-dark-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-dark-700 rounded w-1/2" />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-dark-700">
        <div className="h-6 bg-dark-700 rounded w-1/4" />
      </div>
      <div className="divide-y divide-dark-700">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center space-x-4">
            <div className="h-4 bg-dark-700 rounded flex-1" />
            <div className="h-4 bg-dark-700 rounded w-24" />
            <div className="h-4 bg-dark-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-dark-700 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Default export for generic skeleton loader
const SkeletonLoader = ({ className = '' }) => {
  return (
    <div className={`bg-dark-800 rounded-lg animate-pulse ${className}`}>
      <div className="h-full w-full bg-dark-700 rounded-lg" />
    </div>
  );
};

export default SkeletonLoader;

