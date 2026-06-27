import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { SessionAwareFetchProvider, useSessionMonitor } from "../useSessionMonitor";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useSessionMonitor", () => {
  let mockSignOut;
  let mockRouterPush;

  beforeEach(() => {
    mockSignOut = vi.fn().mockResolvedValue(undefined);
    mockRouterPush = vi.fn();

    useAuth.mockReturnValue({
      signOut: mockSignOut,
    });

    useRouter.mockReturnValue({
      push: mockRouterPush,
    });

    vi.clearAllMocks();
  });

  it("should return null (no-op hook)", () => {
    const { result } = renderHook(() => useSessionMonitor());
    expect(result.current).toBeNull();
  });
});
