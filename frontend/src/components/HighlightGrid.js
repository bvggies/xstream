import React from 'react';
import HighlightCard from './HighlightCard';
import SkeletonLoader from './SkeletonLoader';

const HighlightGrid = ({ highlights, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonLoader key={i} className="h-80" />
        ))}
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-400 text-lg">No highlights found</p>
        <p className="text-dark-500 text-sm mt-2">Check back later for new highlights</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {highlights.map((highlight, index) => (
        <HighlightCard key={highlight.id} highlight={highlight} index={index} />
      ))}
    </div>
  );
};

export default HighlightGrid;

