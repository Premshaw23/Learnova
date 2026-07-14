import { useState, useEffect } from 'react';

const OFFLINE_QUIZ_PREFIX = 'learnova_quiz_progress_';
const OFFLINE_SUBMIT_PREFIX = 'learnova_quiz_pending_submit_';

export function useOfflineQuiz(activityId) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status safely (typeof window !== 'undefined' for Next.js SSR)
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Save current progress to localStorage
  const saveProgress = (state) => {
    if (!activityId || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${OFFLINE_QUIZ_PREFIX}${activityId}`, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn("Failed to save quiz progress locally", err);
    }
  };

  // Load progress from localStorage
  const loadProgress = () => {
    if (!activityId || typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${OFFLINE_QUIZ_PREFIX}${activityId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn("Failed to load quiz progress", err);
    }
    return null;
  };

  // Clear saved progress (when completed successfully or abandoned)
  const clearProgress = () => {
    if (!activityId || typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${OFFLINE_QUIZ_PREFIX}${activityId}`);
    } catch (err) {}
  };

  // Save a pending submission when the user finishes while offline
  const savePendingSubmission = (submissionData) => {
    if (!activityId || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${OFFLINE_SUBMIT_PREFIX}${activityId}`, JSON.stringify({
        ...submissionData,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn("Failed to save pending submission locally", err);
    }
  };

  return {
    isOnline,
    saveProgress,
    loadProgress,
    clearProgress,
    savePendingSubmission,
  };
}
