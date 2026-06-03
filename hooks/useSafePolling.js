import { useEffect, useRef, useCallback } from "react";

/**
 * A safe, robust hook for self-scheduling, deduplicated, and cancelable polling.
 *
 * @param {Function} callback - The async function to poll. Receives an AbortSignal.
 * @param {number} interval - Polling interval in milliseconds.
 * @param {Array} dependencies - Dependency array to trigger restart of the polling loop.
 */
export function useSafePolling(callback, interval = 30000, dependencies = []) {
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastRequestIdRef = useRef(0);
  const callbackRef = useRef(callback);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const scheduleNextPoll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      poll();
    }, interval);
  }, [interval]);

  const poll = useCallback(async () => {
    if (document.visibilityState === "hidden") {
      // If page is hidden, reschedule the poll without executing the request to optimize resources
      scheduleNextPoll();
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    try {
      abortControllerRef.current = new AbortController();
    } catch {
      abortControllerRef.current = null; // Fallback for environments without AbortController
    }

    const signal = abortControllerRef.current?.signal;

    // Track request sequence to prevent stale overwrites
    lastRequestIdRef.current += 1;
    const currentRequestId = lastRequestIdRef.current;

    isFetchingRef.current = true;

    try {
      await callbackRef.current(signal);
    } catch (error) {
      // Ignore AbortError, log other errors
      if (error?.name !== "AbortError") {
        console.error("Polling error:", error);
      }
    } finally {
      // Only reset fetching state and schedule next poll if this request matches the latest sequence
      if (currentRequestId === lastRequestIdRef.current) {
        isFetchingRef.current = false;
        scheduleNextPoll();
      }
    }
  }, [scheduleNextPoll]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Trigger an immediate poll when the tab becomes active again
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [poll]);

  // Initial trigger and cleanup on unmount
  useEffect(() => {
    poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [poll, ...dependencies]);
}
