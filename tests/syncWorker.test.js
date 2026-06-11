import { describe, it, expect, vi } from "vitest";
import { processOfflineQueueWithRetry } from "../worker/syncWorker";

describe("processOfflineQueueWithRetry", () => {
  it("should successfully sync actions on the first attempt", async () => {
    const queue = [{ id: "1", localTimestamp: 200, serverTimestamp: 100 }];
    const apiSyncMock = vi.fn().mockResolvedValue({ success: true });

    const results = await processOfflineQueueWithRetry(queue, apiSyncMock, {
      baseDelay: 0,
    });

    expect(results).toEqual([{ id: "1", status: "synced" }]);
    expect(apiSyncMock).toHaveBeenCalledTimes(1);
  });

  it("should skip actions matching Last-Write-Wins conflict criteria", async () => {
    const queue = [{ id: "2", localTimestamp: 100, serverTimestamp: 200 }];
    const apiSyncMock = vi.fn();

    const results = await processOfflineQueueWithRetry(queue, apiSyncMock, {
      baseDelay: 0,
    });

    expect(results).toEqual([]);
    expect(apiSyncMock).not.toHaveBeenCalled();
  });

  it("should retry with backoff and mark as failed after reaching max attempts", async () => {
    const queue = [{ id: "3", localTimestamp: 200, serverTimestamp: 100 }];
    const apiSyncMock = vi.fn().mockRejectedValue(new Error("Network Error"));

    const results = await processOfflineQueueWithRetry(queue, apiSyncMock, {
      baseDelay: 0,
      maxAttempts: 3,
    });

    expect(results).toEqual([{ id: "3", status: "failed_max_attempts" }]);
    expect(apiSyncMock).toHaveBeenCalledTimes(3);
  });
});
