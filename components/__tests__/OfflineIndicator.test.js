import { render, screen, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import OfflineIndicator from "./OfflineIndicator";

const mockUseOfflineSync = vi.fn();

vi.mock("@/hooks/useOfflineSync", () => ({
  useOfflineSync: () => mockUseOfflineSync(),
}));

describe("OfflineIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOfflineSync.mockReturnValue({
      queueCount: 0,
      syncStatus: "idle",
    });

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      writable: true,
      value: true,
    });
  });

  test("renders nothing when online with no queued records and idle status", () => {
    const { container } = render(<OfflineIndicator />);

    expect(container.firstChild).toBeNull();
  });

  test("shows offline banner when browser goes offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      writable: true,
      value: false,
    });

    render(<OfflineIndicator />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
  });

  test("shows queued records banner", () => {
    mockUseOfflineSync.mockReturnValue({
      queueCount: 3,
      syncStatus: "idle",
    });

    render(<OfflineIndicator />);

    expect(screen.getByText("3 records queued")).toBeInTheDocument();
  });

  test("shows singular queued record text", () => {
    mockUseOfflineSync.mockReturnValue({
      queueCount: 1,
      syncStatus: "idle",
    });

    render(<OfflineIndicator />);

    expect(screen.getByText("1 record queued")).toBeInTheDocument();
  });

  test("shows syncing banner while records are syncing", () => {
    mockUseOfflineSync.mockReturnValue({
      queueCount: 5,
      syncStatus: "syncing",
    });

    render(<OfflineIndicator />);

    expect(
      screen.getByText("Syncing records...")
    ).toBeInTheDocument();
  });

  test("updates when offline event is dispatched", () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
  });

  test("removes offline banner when online event is dispatched", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      writable: true,
      value: false,
    });

    render(<OfflineIndicator />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(
      screen.queryByText("Offline Mode")
    ).not.toBeInTheDocument();
  });
});