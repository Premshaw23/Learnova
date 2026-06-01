"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook for managing timers with automatic cleanup
 * Prevents memory leaks by ensuring timers are cleared on component unmount
 * 
 * @param {Function} callback - Function to execute when timer fires
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} [immediate=false] - Whether to execute immediately on mount
 * @returns {Object} - { clear, reset } methods for manual control
 */
export function useTimeout(callback, delay, immediate = false) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const start = () => {
    if (delay !== null && delay !== undefined) {
      timeoutRef.current = setTimeout(() => {
        callbackRef.current();
        timeoutRef.current = null;
      }, delay);
    }
  };

  useEffect(() => {
    if (immediate) {
      callbackRef.current();
    }

    start();

    return clear;
  }, [delay, immediate]);

  return {
    clear,
    reset: () => {
      clear();
      if (immediate) {
        callbackRef.current();
      }
      start();
    },
  };
}

/**
 * Custom hook for managing intervals with automatic cleanup
 * Prevents memory leaks by ensuring intervals are cleared on component unmount
 * 
 * @param {Function} callback - Function to execute on each interval
 * @param {number} delay - Delay in milliseconds between executions
 * @param {boolean} [immediate=false] - Whether to execute immediately on mount
 * @returns {Object} - { clear, reset } methods for manual control
 */
export function useInterval(callback, delay, immediate = false) {
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (delay !== null && delay !== undefined) {
      if (immediate) {
        callbackRef.current();
      }
      
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, delay);
    }

    return clear;
  }, [delay, immediate]);

  return { clear, reset: () => {
    clear();
    if (delay !== null && delay !== undefined) {
      if (immediate) {
        callbackRef.current();
      }
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, delay);
    }
  }};
}
