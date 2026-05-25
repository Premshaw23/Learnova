export default function SkeletonLoader() {
  return (
    <div className="animate-pulse p-4 space-y-4">
      <div className="h-6 bg-gray-300 rounded w-1/3"></div>

      <div className="h-32 bg-gray-300 rounded"></div>

      <div className="h-32 bg-gray-300 rounded"></div>
    </div>
  );
}