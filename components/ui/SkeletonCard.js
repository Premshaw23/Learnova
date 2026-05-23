const SkeletonCard = ({ lines = 2, height = "h-4" }) => {
  return (
    <div className="animate-pulse bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-700/40 rounded ${
            i === lines - 1 ? "w-1/2" : i === 0 ? "w-3/4" : "w-2/3"
          } ${i > 0 ? "mt-3" : ""}`}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;