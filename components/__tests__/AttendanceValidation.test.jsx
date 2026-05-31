import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    // Mock geolocation
    navigator.geolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 12.9716,
            longitude: 77.5946,
          },
        })
      ),
    };
  });

  test("renders exception modal when Request Exception button is clicked", async () => {
    const user = userEvent.setup();
    render(<AttendanceValidation onValidationSuccess={mockOnValidationSuccess} />);

    // Wait for the settings loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading System")).not.toBeInTheDocument();
    });

    // Capture the trigger button that opens the exception modal
    const requestExceptionBtn = await screen.findByRole("button", { name: /request exception/i });
    expect(requestExceptionBtn).toBeInTheDocument();

    // Focus the request button
    requestExceptionBtn.focus();
    expect(document.activeElement).toBe(requestExceptionBtn);

    // Click it to open the modal using await user.click
    await user.click(requestExceptionBtn);

    // Verify exception modal is rendered
    expect(screen.getByText("Exception Request")).toBeInTheDocument();

    // Verify focus shifts to the first focusable element in the exception modal
    await waitFor(() => {
      const getLocBtn = screen.getByRole("button", { name: /get current location/i });
      expect(document.activeElement).toBe(getLocBtn);
    });

    // Press Escape to verify close
    await user.keyboard("{Escape}");

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText("Exception Request")).not.toBeInTheDocument();
    });

    // Verify focus is restored back to the Request Exception button!
    await waitFor(() => {
      const freshRequestExceptionBtn = screen.getByRole("button", { name: /request exception/i });
      expect(document.activeElement).toBe(freshRequestExceptionBtn);
    });
  });

  test("traps focus inside the exception modal with Tab/Shift+Tab", async () => {
    const user = userEvent.setup();
    const { container } = render(<AttendanceValidation onValidationSuccess={mockOnValidationSuccess} />);

    await waitFor(() => {
      expect(screen.queryByText("Loading System")).not.toBeInTheDocument();
    });

    const requestExceptionBtn = await screen.findByRole("button", { name: /request exception/i });
    await user.click(requestExceptionBtn);

    // Capture the elements inside the modal
    const getLocBtn = screen.getByRole("button", { name: /get current location/i });
    const selectReason = container.querySelector("#exception-reason");
    const additionalDetails = container.querySelector("#exception-details");
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });

    expect(selectReason).toBeInTheDocument();
    expect(additionalDetails).toBeInTheDocument();

    // Focus shifts to getLocBtn initially
    await waitFor(() => {
      expect(document.activeElement).toBe(getLocBtn);
    });

    // Tab -> selectReason
    await user.tab();
    expect(document.activeElement).toBe(selectReason);

    // Tab -> additionalDetails
    await user.tab();
    expect(document.activeElement).toBe(additionalDetails);

    // Tab -> cancelBtn
    await user.tab();
    expect(document.activeElement).toBe(cancelBtn);

    // Tab again -> wraps back to getLocBtn (since submitBtn is disabled and thus skipped)
    await user.tab();
    expect(document.activeElement).toBe(getLocBtn);

    // Shift + Tab -> wraps to last element (cancelBtn)
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cancelBtn);
  });
});
