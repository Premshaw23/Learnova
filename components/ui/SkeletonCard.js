const SkeletonCard = () => {
  return (
    <div className="animate-pulse bg-gray-800 rounded-xl p-6">
      <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
    </div>
  );
};

export default SkeletonCard;