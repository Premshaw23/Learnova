/**
 * Processes queued offline actions with exponential backoff and Last-Write-Wins logic
 * @param {Array} queue - Array of offline mutations
 * @param {Function} apiSyncFunction - The network dispatch handler
 * @param {Object} options - Configurations for retries (useful for testing)
 */
export async function processOfflineQueueWithRetry(
  queue,
  apiSyncFunction,
  options = {}
) {
  const processedResults = [];
  const maxAttempts = options.maxAttempts || 3;
  // Allows tests to pass 0 to avoid waiting seconds in the CI environment
  const baseDelay =
    typeof options.baseDelay !== "undefined" ? options.baseDelay : 1000;

  for (const action of queue) {
    let attempts = 0;
    let success = false;

    // 1. Conflict Resolution Layer: Last-Write-Wins (LWW) check
    if (
      action.serverTimestamp &&
      action.localTimestamp < action.serverTimestamp
    ) {
      console.warn(
        `Conflict detected for item ${action.id}. Server has a newer update. Skipping local mutation.`
      );
      continue; // Skip outdated local modification
    }

    // 2. Exponential Backoff Retry Loop
    while (attempts < maxAttempts && !success) {
      try {
        await apiSyncFunction(action);
        success = true;
        processedResults.push({ id: action.id, status: "synced" });
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          processedResults.push({
            id: action.id,
            status: "failed_max_attempts",
          });
          break;
        }
        // Calculate exponential delay: 1s -> 2s -> 4s...
        const delay = baseDelay * Math.pow(2, attempts - 1);

        // Skip waiting entirely if delay is set to 0
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  return processedResults;
}
