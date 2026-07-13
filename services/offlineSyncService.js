import { updateActivityProgress } from "@/services/activityService";
import { updateUserStat } from "@/services/statsService";

const OFFLINE_SUBMIT_PREFIX = 'learnova_quiz_pending_submit_';

/**
 * Checks for any pending quiz submissions in localStorage and attempts to sync them.
 */
export async function syncPendingQuizzes() {
  if (typeof window === 'undefined') return;

  const pendingKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(OFFLINE_SUBMIT_PREFIX)
  );

  let successCount = 0;
  let failCount = 0;

  for (const key of pendingKeys) {
    try {
      const dataStr = localStorage.getItem(key);
      if (!dataStr) continue;
      
      const data = JSON.parse(dataStr);
      const { activityId, userId, passed } = data;

      if (passed) {
        // Run the DB updates that failed while offline
        await updateActivityProgress(activityId, 100);
        await updateUserStat(userId, "Assignments Done", 1);
      }

      // If we reach here without errors, sync was successful
      localStorage.removeItem(key);
      successCount++;
    } catch (err) {
      console.error("Failed to sync pending quiz submission:", key, err);
      failCount++;
    }
  }

  return { successCount, failCount };
}
