import { renderHook, act } from "@testing-library/react";
import { useSessionMonitor } from "../useSessionMonitor";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe("useSessionMonitor", () => {
  let originalFetch;
  let mockSignOut;
  let mockRouterPush;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockSignOut = jest.fn().mockResolvedValue(undefined);
    mockRouterPush = jest.fn();

    useAuth.mockReturnValue({
      signOut: mockSignOut,
    });

    useRouter.mockReturnValue({
      push: mockRouterPush,
    });

    // Reset global state
    delete window.__sessionExpired;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should intercept 401 responses and trigger logout flow", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401 });

    renderHook(() => useSessionMonitor());

    await act(async () => {
      await global.fetch("/api/test");
    });

    expect(toast.error).toHaveBeenCalledWith("Session expired. Please log in again.");
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/auth");
  });

  it("should intercept 403 responses and trigger logout flow", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 403 });

    renderHook(() => useSessionMonitor());

    await act(async () => {
      await global.fetch("/api/test");
    });

    expect(toast.error).toHaveBeenCalledWith("Session expired. Please log in again.");
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/auth");
  });

  it("should not trigger logout for 200 responses", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });

    renderHook(() => useSessionMonitor());

    await act(async () => {
      await global.fetch("/api/test");
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("should prevent multiple concurrent redirects", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401 });

    renderHook(() => useSessionMonitor());

    await act(async () => {
      // Simulate two concurrent failing requests
      await Promise.all([
        global.fetch("/api/test1"),
        global.fetch("/api/test2"),
      ]);
    });

    // Toast and signOut should only be called once despite two 401 responses
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });
});
