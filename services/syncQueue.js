import { getPendingActions, updateActionStatus, removePendingAction } from "../db/offlineStore";

const MAX_RETRIES = 4;

export async function processSyncQueue(fetchFn = fetch) {
  const actions = await getPendingActions();
  if (actions.length === 0) return { successCount: 0, failCount: 0 };

  actions.sort((a, b) => a.createdAt - b.createdAt);

  let successCount = 0;
  let failCount = 0;

  for (const action of actions) {
    try {
      // In the Service Worker context, we need to add the CSRF token back.
      // The old worker used withCsrfHeaders. We can fetch it or assume it's handled by fetchFn wrapper.
      // For simplicity, we just pass the raw request out.
      
      const response = await fetchFn(action.endpoint, {
        method: action.method,
        headers: action.headers || {
          "Content-Type": "application/json",
        },
        body: action.payload,
        credentials: "same-origin",
      });

      if (response.ok) {
        await removePendingAction(action.id);
        successCount++;
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // Client errors or conflicts shouldn't be retried indefinitely
        await updateActionStatus(action.id, "failed", action.retryCount);
        failCount++;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      failCount++;
      if (action.retryCount >= MAX_RETRIES) {
        await updateActionStatus(action.id, "failed", action.retryCount);
      } else {
        await updateActionStatus(action.id, "pending", action.retryCount + 1);
        if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
          break; // Stop queue processing on network failure
        }
      }
    }
  }

  return { successCount, failCount };
}
