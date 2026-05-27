import { renderHook } from "@testing-library/react";
import { useOfflineQueue } from "../useOfflineQueue";
import toast from "react-hot-toast";

jest.mock("react-hot-toast", () => ({
  loading: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  dismiss: jest.fn(),
}));

describe("useOfflineQueue hook", () => {
  let swListeners = {};
  let windowListeners = {};
  let mockPostMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    swListeners = {};
    windowListeners = {};
    mockPostMessage = jest.fn();

    // Mock navigator.serviceWorker
    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          addEventListener: jest.fn((event, callback) => {
            swListeners[event] = callback;
          }),
          removeEventListener: jest.fn((event, callback) => {
            delete swListeners[event];
          }),
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    // Spy on window.addEventListener
    jest.spyOn(window, "addEventListener").mockImplementation((event, callback) => {
      windowListeners[event] = callback;
    });
    jest.spyOn(window, "removeEventListener").mockImplementation((event, callback) => {
      delete windowListeners[event];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should register service worker and window event listeners on mount", () => {
    renderHook(() => useOfflineQueue());

    expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("online", expect.any(Function));
  });

  test("should trigger loading toast on MUTATION_QUEUED message", () => {
    renderHook(() => useOfflineQueue());

    // Trigger MUTATION_QUEUED message event
    swListeners["message"]({
      data: {
        type: "MUTATION_QUEUED",
        url: "/api/settings",
        method: "PATCH",
      },
    });

    expect(toast.loading).toHaveBeenCalledWith(
      "Device is offline. Request queued for replay when online.",
      expect.objectContaining({ id: "offline-mutation-queued" })
    );
  });

  test("should trigger success toast on MUTATIONS_SYNC_COMPLETE with no errors", () => {
    renderHook(() => useOfflineQueue());

    // Trigger MUTATIONS_SYNC_COMPLETE message event
    swListeners["message"]({
      data: {
        type: "MUTATIONS_SYNC_COMPLETE",
        successCount: 3,
        failCount: 0,
      },
    });

    expect(toast.dismiss).toHaveBeenCalledWith("offline-mutation-queued");
    expect(toast.success).toHaveBeenCalledWith(
      "Connection restored! Replayed 3 queued request(s) successfully.",
      expect.objectContaining({ id: "offline-mutation-sync", icon: "⚡" })
    );
  });

  test("should trigger error toast on MUTATIONS_SYNC_COMPLETE with failures", () => {
    renderHook(() => useOfflineQueue());

    // Trigger MUTATIONS_SYNC_COMPLETE message event
    swListeners["message"]({
      data: {
        type: "MUTATIONS_SYNC_COMPLETE",
        successCount: 1,
        failCount: 2,
      },
    });

    expect(toast.dismiss).toHaveBeenCalledWith("offline-mutation-queued");
    expect(toast.error).toHaveBeenCalledWith(
      "Replayed queued requests: 1 succeeded, 2 failed.",
      expect.objectContaining({ id: "offline-mutation-sync" })
    );
  });

  test("should post TRIGGER_MUTATION_SYNC message to service worker when window goes online", () => {
    // Disable SyncManager in window to force fallback message trigger
    const originalSyncManager = window.SyncManager;
    delete window.SyncManager;

    renderHook(() => useOfflineQueue());

    // Trigger online event
    windowListeners["online"]();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TRIGGER_MUTATION_SYNC",
    });

    window.SyncManager = originalSyncManager;
  });
});
