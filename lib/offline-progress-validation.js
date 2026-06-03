/**
 * lib/offline-progress-validation.js
 *
 * Validation layer for offline progress synchronization to prevent data
 * integrity issues, cheating, and replay attacks. All sync requests are
 * validated against server state and business logic before applying changes.
 */

/**
 * Validate timestamp to prevent replay attacks.
 * Sync data must be submitted within a reasonable time window.
 * @param {number} timestamp - Client timestamp from sync request
 * @param {number} maxAgeMsMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns {Object} { isValid: boolean, reason?: string }
 */
export function validateSyncTimestamp(timestamp, maxAgeMs = 5 * 60 * 1000) {
  if (typeof timestamp !== 'number' || timestamp <= 0) {
    return { isValid: false, reason: 'Invalid timestamp format' };
  }

  const now = Date.now();
  const age = now - timestamp;

  if (age > maxAgeMs) {
    return { isValid: false, reason: 'Sync request is stale (too old)' };
  }

  if (age < -60000) {
    // Allow 1 minute clock skew for device time sync issues
    return { isValid: false, reason: 'Sync timestamp is in the future' };
  }

  return { isValid: true };
}

/**
 * Validate that progress doesn't go backwards.
 * @param {Object} change - Offline progress change
 * @param {Object} serverState - Current server progress state
 * @returns {Object} { isValid: boolean, reason?: string }
 */
export function validateProgressDirection(change, serverState) {
  if (!change || typeof change !== 'object') {
    return { isValid: false, reason: 'Invalid change object' };
  }

  const { lessonId, progress: clientProgress } = change;

  if (!lessonId || typeof clientProgress !== 'number') {
    return { isValid: false, reason: 'Missing lessonId or progress value' };
  }

  // Get server's recorded progress for this lesson
  const serverProgress = serverState?.[lessonId] || 0;

  // Client progress should not decrease
  if (clientProgress < serverProgress) {
    return {
      isValid: false,
      reason: `Progress cannot decrease for lesson ${lessonId} (server: ${serverProgress}%, client: ${clientProgress}%)`,
    };
  }

  // Progress must be between 0 and 100
  if (clientProgress < 0 || clientProgress > 100) {
    return { isValid: false, reason: 'Progress must be between 0 and 100' };
  }

  return { isValid: true };
}

/**
 * Validate that completion time is reasonable.
 * Lessons cannot be marked complete faster than their estimated duration.
 * @param {Object} change - Offline progress change
 * @param {Object} lessonMetadata - Lesson info (duration, etc.)
 * @returns {Object} { isValid: boolean, reason?: string }
 */
export function validateCompletionTime(change, lessonMetadata) {
  const { timeSpentMs = 0, completed = false } = change;

  if (!completed) {
    // Only validate completion time for completed lessons
    return { isValid: true };
  }

  if (typeof timeSpentMs !== 'number' || timeSpentMs < 0) {
    return { isValid: false, reason: 'Invalid timeSpentMs value' };
  }

  const estimatedDurationMs = lessonMetadata?.estimatedDurationMinutes
    ? lessonMetadata.estimatedDurationMinutes * 60 * 1000
    : 0;

  // If lesson has a duration estimate, time spent should be at least that
  if (estimatedDurationMs > 0 && timeSpentMs < estimatedDurationMs) {
    const estimatedMins = Math.round(estimatedDurationMs / 1000 / 60);
    const spentMins = Math.round(timeSpentMs / 1000 / 60);
    return {
      isValid: false,
      reason: `Lesson completion too fast (estimated: ${estimatedMins}min, spent: ${spentMins}min)`,
    };
  }

  // Sanity check: time spent should be reasonable (max 24 hours per lesson)
  if (timeSpentMs > 24 * 60 * 60 * 1000) {
    return { isValid: false, reason: 'Time spent on single lesson exceeds 24 hours' };
  }

  return { isValid: true };
}

/**
 * Validate that prerequisites are met before marking lesson complete.
 * @param {Object} change - Offline progress change
 * @param {Object} lessonMetadata - Lesson info (prerequisites, etc.)
 * @param {Object} serverProgress - Server progress state
 * @returns {Object} { isValid: boolean, reason?: string }
 */
export function validatePrerequisites(change, lessonMetadata, serverProgress) {
  const { completed = false } = change;

  if (!completed) {
    // Only validate prerequisites for completed lessons
    return { isValid: true };
  }

  const prerequisites = lessonMetadata?.prerequisites || [];

  if (!Array.isArray(prerequisites) || prerequisites.length === 0) {
    return { isValid: true };
  }

  // Check that all prerequisites are completed on server
  for (const prereqId of prerequisites) {
    const prereqProgress = serverProgress?.[prereqId] || 0;

    if (prereqProgress < 100) {
      return {
        isValid: false,
        reason: `Prerequisite lesson ${prereqId} not completed (${prereqProgress}%)`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate a single offline progress change against server state.
 * @param {Object} change - Single progress change
 * @param {Object} lessonMetadata - Lesson metadata from server
 * @param {Object} serverProgress - Current server progress state
 * @returns {Object} { isValid: boolean, errors?: string[] }
 */
export function validateProgressChange(change, lessonMetadata, serverProgress) {
  const errors = [];

  // Validate direction (no backwards progress)
  const directionCheck = validateProgressDirection(change, serverProgress);
  if (!directionCheck.isValid) {
    errors.push(directionCheck.reason);
  }

  // Validate completion time
  const timeCheck = validateCompletionTime(change, lessonMetadata);
  if (!timeCheck.isValid) {
    errors.push(timeCheck.reason);
  }

  // Validate prerequisites
  const prereqCheck = validatePrerequisites(change, lessonMetadata, serverProgress);
  if (!prereqCheck.isValid) {
    errors.push(prereqCheck.reason);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate entire offline sync request before applying changes.
 * @param {Object} syncRequest - Complete sync request
 * @param {Object} serverState - Current server state (progress, user data)
 * @returns {Object} { isValid: boolean, errors?: string[] }
 */
export function validateOfflineSync(syncRequest, serverState) {
  const errors = [];

  if (!syncRequest || typeof syncRequest !== 'object') {
    return { isValid: false, errors: ['Invalid sync request'] };
  }

  const { offlineChanges = [], timestamp } = syncRequest;

  // Validate timestamp
  const timestampCheck = validateSyncTimestamp(timestamp);
  if (!timestampCheck.isValid) {
    errors.push(timestampCheck.reason);
  }

  // Validate changes array
  if (!Array.isArray(offlineChanges)) {
    errors.push('offlineChanges must be an array');
  } else {
    // Validate each change
    for (let i = 0; i < offlineChanges.length; i++) {
      const change = offlineChanges[i];
      const { lessonId } = change;

      // Get lesson metadata from server
      const lessonMetadata = serverState?.lessonMetadata?.[lessonId];

      if (!lessonMetadata) {
        errors.push(`Lesson ${lessonId} not found on server`);
        continue;
      }

      // Validate this specific change
      const changeValidation = validateProgressChange(
        change,
        lessonMetadata,
        serverState?.progress || {}
      );

      if (!changeValidation.isValid) {
        errors.push(`Change ${i} (${lessonId}): ${changeValidation.errors.join('; ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
