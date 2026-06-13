"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  let t = null;

  // 1. Defensively try to initialize the translation hook.
  // If next-intl core infrastructure is completely broken, this catch prevents a hard crash.
  try {
    t = useTranslations('common');
  } catch (e) {
    console.error('Failed to initialize translation context in Error Boundary:', e);
  }

  useEffect(() => {
    console.error('Runtime error:', error?.message ?? 'Unknown error', {
      digest: error?.digest,
    });
  }, [error]);

  // 2. Safe text resolution using the requested t.has() fallback strategy.
  const errorText = t && t.has('error') ? t('error') : 'Something went wrong.';
  const retryText = t && t.has('try_again') ? t('try_again') : 'Try again';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Service Temporarily Unavailable
      </h1>

      <p className="text-gray-600 mb-6">
        {errorText}
      </p>

      <button
        onClick={() => reset()}
        className="px-5 py-2 rounded bg-black text-white hover:opacity-80 mb-6"
      >
        {retryText}
      </button>

      {error?.digest && (
        <p className="text-xs text-gray-400 font-mono select-all">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}