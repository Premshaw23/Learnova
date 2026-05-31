import React from 'react';

const AnalyticsSkeleton = () => {
  return (
    <div className="min-h-screen bg-black p-6 space-y-6 animate-pulse">
      {/* Fake Header Box */}
      <div className="h-20 bg-gray-800 rounded-2xl w-full"></div>
      
      {/* Fake Grid Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-gray-800 rounded-2xl"></div>
        <div className="h-40 bg-gray-800 rounded-2xl"></div>
        <div className="h-40 bg-gray-800 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;