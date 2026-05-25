'use client';

import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Runtime error:', error?.message ?? 'Unknown error');
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center dark:border-destructive/20 dark:bg-destructive/10">

          <div className="mb-6 flex justify-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
              <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
            </span>
          </div>

          <h2 className="mb-3 text-xl font-semibold text-foreground">
            Something went wrong
          </h2>

          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            An unexpected error occurred while loading this page. You can try
            again or go back to the previous page.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-destructive px-6 py-2.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    </>
  );
}