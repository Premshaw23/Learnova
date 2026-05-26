"use client";

export default function Error({
  error,
  reset,
}) {
  console.error("Application Error:", error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Service Temporarily Unavailable
      </h1>

      <p className="text-gray-600 mb-6">
        Something went wrong while loading data.
        Please check your connection or try again.
      </p>

      <button
        onClick={() => reset()}
        className="px-5 py-2 rounded bg-black text-white hover:opacity-80"
      >
        Retry
      </button>
    </div>
  );
}