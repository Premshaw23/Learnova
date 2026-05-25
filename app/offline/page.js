"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold mb-3">You are offline</h1>
        <p className="text-muted-foreground mb-6">
          It looks like you lost your internet connection. Please check your
          network and try again.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}