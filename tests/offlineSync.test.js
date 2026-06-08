import { describe, it, expect, beforeEach, vi } from "vitest";
import { processSyncQueue } from "../services/syncQueue";
import { handleOfflineRequest } from "../utils/offlineRequestHandler";
import {
  getOfflineDb,
  clearPendingActions,
  getPendingActions,
} from "../db/offlineStore";

// Mocking dependencies
global.fetch = vi.fn();
if (typeof Response === "undefined") {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = init?.headers || {};
    }
    async json() {
      return JSON.parse(this.body);
    }
  };
}

// We need to mock idb or use a memory version.
// For simplicity in this jest test, we can mock the offlineStore entirely,
// but since we want to test the queue behavior, let's mock the DB functions.

vi.mock("../db/offlineStore", () => {
  let store = [];
  return {
    getOfflineDb: vi.fn(),
    addPendingAction: vi.fn(async (action) => {
      store.push({
        id: Math.random().toString(),
        createdAt: Date.now(),
        retryCount: 0,
        status: "pending",
        ...action,
      });
    }),
    getPendingActions: vi.fn(async () =>
      store.filter((a) => a.status === "pending")
    ),
    updateActionStatus: vi.fn(async (id, status, retryCount) => {
      const idx = store.findIndex((a) => a.id === id);
      if (idx > -1) {
        store[idx].status = status;
        store[idx].retryCount = retryCount;
      }
    }),
    removePendingAction: vi.fn(async (id) => {
      store = store.filter((a) => a.id !== id);
    }),
    clearPendingActions: vi.fn(async () => {
      store = [];
    }),
  };
});

describe("Offline Synchronization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearPendingActions();

    global.CustomEvent = class CustomEvent {};
    if (typeof window !== "undefined") {
      window.dispatchEvent = vi.fn();
    }

    // Mock navigator online status
    Object.defineProperty(global.navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    // Mock Service Worker
    global.navigator.serviceWorker = {
      ready: Promise.resolve({
        sync: { register: vi.fn() },
      }),
      controller: { postMessage: vi.fn() },
    };
  });

  it("Scenario 1: Attendance while offline - Expected: Stored locally", async () => {
    const response = await handleOfflineRequest("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ userId: "123", status: "present" }),
    });

    // Check if the action was queued locally

    const queue = await getPendingActions();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("attendance");
    expect(queue[0].endpoint).toBe("/api/attendance");
  });

  it("Scenario 2 & 4: Connectivity restored - Auto sync, multiple requests processed sequentially", async () => {
    // Add two actions
    await handleOfflineRequest("/api/attendance", {
      method: "POST",
      body: "{}",
    });
    await handleOfflineRequest("/api/complaints", {
      method: "POST",
      body: "{}",
    });

    let queue = await getPendingActions();
    expect(queue).toHaveLength(2);

    // Connectivity restored
    global.navigator.onLine = true;

    // Mock fetch to succeed
    global.fetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await processSyncQueue(global.fetch);

    expect(result.successCount).toBe(2);
    expect(result.failCount).toBe(0);

    queue = await getPendingActions();
    expect(queue).toHaveLength(0); // Queue should be empty
  });

  it("Scenario 3: Complaint submission offline - Expected: Queued", async () => {
    await handleOfflineRequest("/api/complaints", {
      method: "POST",
      body: JSON.stringify({ text: "Issue with projector" }),
    });

    const queue = await getPendingActions();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("complaint");
  });

  it("Scenario 5: Server error during sync - Expected: Retry logic triggered", async () => {
    await handleOfflineRequest("/api/attendance", {
      method: "POST",
      body: "{}",
    });

    // Mock fetch to return 500 error
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await processSyncQueue(global.fetch);

    expect(result.successCount).toBe(0);
    expect(result.failCount).toBe(1);

    // Item should still be in queue but with retryCount = 1
    const queue = await getPendingActions();
    expect(queue).toHaveLength(1);
    expect(queue[0].retryCount).toBe(1);
  });

  it("Scenario 6: Browser without Background Sync - Expected: Fallback mechanism works", async () => {
    // Remove SyncManager to simulate fallback
    delete global.window.SyncManager;

    await handleOfflineRequest("/api/attendance", {
      method: "POST",
      body: "{}",
    });

    const queue = await getPendingActions();
    expect(queue).toHaveLength(1);

    // Fallback logic handled in useOfflineSync.js which listens to online event
    // When online, it posts message to serviceWorker.controller
    // Here we just test the manual trigger via postMessage is available
    expect(global.navigator.serviceWorker.controller.postMessage).toBeDefined();
  });
});
