import React from "react";

export default function SyncStatusBadge({ syncState }) {
  // syncState can be: 'online', 'offline', 'retrying', 'error'
  const config = {
    online: { text: "Synced", styles: "bg-green-100 text-green-800" },
    offline: { text: "Offline Mode", styles: "bg-gray-100 text-gray-800" },
    retrying: {
      text: "Retrying Sync...",
      styles: "bg-yellow-100 text-yellow-800 animate-pulse",
    },
    error: { text: "Sync Issues", styles: "bg-red-100 text-red-800" },
  };

  const current = config[syncState] || config.offline;

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${current.styles}`}
    >
      {syncState === "retrying" && (
        <svg
          className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {current.text}
    </div>
  );
}
