const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
        >
          <div className="h-8 bg-gray-700 rounded w-16 mb-3"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
};

export default StatsSkeleton;