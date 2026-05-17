export default function RouteLoading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      aria-busy="true"
      aria-label="Loading"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin"
        role="status"
      />
    </div>
  );
}
