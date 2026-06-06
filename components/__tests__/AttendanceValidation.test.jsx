import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import AttendanceValidation from "../AttendanceValidation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      email: "student@example.com",
      displayName: "Test Student",
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    },
  }),
}));

// Mock calculateDistance utility
vi.mock("@/utils/authUtils", () => ({
  calculateDistance: () => 10,
}));

describe("AttendanceValidation Exception Modal Focus Trap", () => {
  const mockOnValidationSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global fetch to return settings successfully
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        timeWindow: { start: "09:00", end: "10:00" },
        gpsLocation: { lat: 12.9716, lng: 77.5946, radius: 100 },
      }),
    });

    // Mock geolocation api elements cleanly
    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn().mockImplementation((success) =>
          success({
            coords: {
              latitude: 12.9716,
              longitude: 77.5946,
            },
          })
        ),
      },
      writable: true,
      configurable: true,
    });
  });

  test("renders exception modal when Request Exception button is clicked", async () => {
    const user = userEvent.setup();
    render(<AttendanceValidation onValidationSuccess={mockOnValidationSuccess} />);

    // Wait for the settings loading state placeholder to resolve
    await waitFor(() => {
      expect(screen.queryByText(/loading system/i)).not.toBeInTheDocument();
    });

    // Capture the trigger button that opens the exception modal
    const requestExceptionBtn = await screen.findByRole("button", { name: /request exception/i });
    expect(requestExceptionBtn).toBeInTheDocument();

    // Focus the request button manually
    requestExceptionBtn.focus();
    expect(document.activeElement).toBe(requestExceptionBtn);

    // Click to open modal
    await user.click(requestExceptionBtn);

    // Verify exception modal layout container is fully rendered
    expect(screen.getByText(/exception request/i)).toBeInTheDocument();

    // Verify focus shifts to the location capture button in the exception modal
    await waitFor(() => {
      const getLocBtn = screen.getByRole("button", { name: /get current location/i });
      expect(document.activeElement).toBe(getLocBtn);
    });

    // Fire Escape key event sequence to close modal layout overlay
    await user.keyboard("{Escape}");

    // Verify modal elements are unmounted completely
    await waitFor(() => {
      expect(screen.queryByText(/exception request/i)).not.toBeInTheDocument();
    });
  });

  test("traps focus inside the exception modal with Tab/Shift+Tab", async () => {
    const user = userEvent.setup();
    render(<AttendanceValidation onValidationSuccess={mockOnValidationSuccess} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading system/i)).not.toBeInTheDocument();
    });

    const requestExceptionBtn = await screen.findByRole("button", { name: /request exception/i });
    await user.click(requestExceptionBtn);

    // Capture modal elements semantically using testing-library roles
    const getLocBtn = screen.getByRole("button", { name: /get current location/i });
    const selectReason = screen.getByRole("combobox", { name: /reason/i }) || screen.getByLabelText(/reason/i);
    const additionalDetails = screen.getByRole("textbox", { name: /details/i }) || screen.getByLabelText(/details/i);
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });

    // Ensure components exist inside container footprint
    expect(selectReason).toBeInTheDocument();
    expect(additionalDetails).toBeInTheDocument();

    // Verify focus starts securely inside initial interactive point
    await waitFor(() => {
      expect(document.activeElement).toBe(getLocBtn);
    });

    // Cycle 1: Tab -> Option Picker Select drop down
    await user.tab();
    expect(document.activeElement).toBe(selectReason);

    // Cycle 2: Tab -> Additional validation description field
    await user.tab();
    expect(document.activeElement).toBe(additionalDetails);

    // Cycle 3: Tab -> Dismiss action button
    await user.tab();
    expect(document.activeElement).toBe(cancelBtn);

    // Cycle 4: Tab again -> Wrap back to first interactive point (disabled submit button skipped)
    await user.tab();
    expect(document.activeElement).toBe(getLocBtn);

    // Reverse Cycle: Shift + Tab -> Wrap backwards to end element
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cancelBtn);
  });
});