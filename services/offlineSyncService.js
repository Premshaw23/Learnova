/**
 * ============================================================================
 * 🔄 OFFLINE SYNC SERVICE (Refactored for Issue #4224)
 * ============================================================================
 * Refactored to use the unified offline storage layer.
 * Handles quiz submission sync with conflict detection.
 */

import { updateActivityProgress } from "@/services/activityService";
import { updateUserStat } from "@/services/statsService";
import {
  upsertRecord,
  queryRecords,
  deleteRecord,
  RECORD_TYPES,
  SYNC_STATUS,
} from "@/lib/offlineStorage";
import { logger } from "@/lib/logger";

const OFFLINE_SUBMIT_PREFIX = "learnova_quiz_pending_submit_";

// ---------------------------------------------------------------------------
// Quiz Submission Sync
// ---------------------------------------------------------------------------

/**
 * Save a quiz submission for offline sync.
 * @param {Object} submissionData - { activityId, userId, passed, score, ... }
 */
export async function saveOfflineQuizSubmission(submissionData) {
  try {
    const record = await upsertRecord({
      type: RECORD_TYPES.QUIZ,
      collection: "quiz-submissions",
      data: submissionData,
      vectorClock: { [submissionData.userId || "unknown"]: 1 },
    });

    // Also save to localStorage for backward compatibility
    if (typeof window !== "undefined" && submissionData.activityId) {
      localStorage.setItem(
        `${OFFLINE_SUBMIT_PREFIX}${submissionData.activityId}`,
        JSON.stringify({
          ...submissionData,
          timestamp: Date.now(),
          unifiedRecordId: record.id,
        })
      );
    }

    logger.info(`[OfflineSync] Saved quiz submission: ${record.id}`);
    return record.id;
  } catch (error) {
    logger.error("[OfflineSync] Failed to save quiz submission:", error);
    throw error;
  }
}

/**
 * Checks for any pending quiz submissions and attempts to sync them.
 * Uses both unified storage and localStorage for backward compatibility.
 */
export async function syncPendingQuizzes() {
  if (typeof window === "undefined") return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  // 1. Sync from unified storage
  try {
    const pendingQuizzes = await queryRecords({
      type: RECORD_TYPES.QUIZ,
      status: SYNC_STATUS.PENDING,
    });

    for (const record of pendingQuizzes) {
      try {
        const { activityId, userId, passed } = record.data;

        if (passed) {
          await updateActivityProgress(activityId, 100);
          await updateUserStat(userId, "Assignments Done", 1);
        }

        // Mark as synced by deleting from the unified store
        await deleteRecord(record.id);
        successCount++;
      } catch (err) {
        logger.error(`[OfflineSync] Failed to sync quiz ${record.id}:`, err);
        failCount++;
      }
    }
  } catch (err) {
    logger.error("[OfflineSync] Error querying unified storage:", err);
  }

  // 2. Also sync from legacy localStorage (migration path)
  if (typeof window !== "undefined") {
    const pendingKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(OFFLINE_SUBMIT_PREFIX)
    );

    for (const key of pendingKeys) {
      try {
        const dataStr = localStorage.getItem(key);
        if (!dataStr) continue;

        const data = JSON.parse(dataStr);
        const { activityId, userId, passed } = data;

        // Skip if already synced via unified storage
        if (data.unifiedRecordId) {
          localStorage.removeItem(key);
          continue;
        }

        if (passed) {
          await updateActivityProgress(activityId, 100);
          await updateUserStat(userId, "Assignments Done", 1);
        }

        localStorage.removeItem(key);
        successCount++;
      } catch (err) {
        console.error("Failed to sync pending quiz submission:", key, err);
        failCount++;
      }
    }
  }

  return { successCount, failCount };
}

/**
 * Get pending quiz count for UI display.
 */
export async function getPendingQuizCount() {
  const pending = await queryRecords({
    type: RECORD_TYPES.QUIZ,
    status: SYNC_STATUS.PENDING,
  });
  return pending.length;
}

export default {
  saveOfflineQuizSubmission,
  syncPendingQuizzes,
  getPendingQuizCount,
};
