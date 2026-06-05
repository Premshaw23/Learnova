import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AttendanceValidation from "../AttendanceValidation";

const mockPush = vi.fn();
const mockUserRef = vi.hoisted(() => ({
  email: "student@test.com",
  displayName: "Test Student",
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUserRef,
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockApiFetch = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiFetch: (...args) => mockApiFetch(...args),
}));

describe("AttendanceValidation Core States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockReset();
  });

  test("renders loading state while attendance settings are loading", () => {
    mockApiFetch.mockImplementation(() => new Promise(() => {}));

    render(<AttendanceValidation onValidationSuccess={vi.fn()} />);

    expect(screen.getByText(/loading system/i)).toBeInTheDocument();

    expect(
      screen.getByText(/preparing attendance validation/i)
    ).toBeInTheDocument();
  });

  test("renders error state when settings request fails", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Settings fetch failed"));

    render(<AttendanceValidation onValidationSuccess={vi.fn()} />);

    expect(await screen.findByText(/system error/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /retry/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /hard refresh/i,
      })
    ).toBeInTheDocument();
  });

  test("opens exception request modal", async () => {
    const user = userEvent.setup();

    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timeWindow: {
          start: "00:00",
          end: "23:59",
        },
        gpsLocation: {
          lat: 0,
          lng: 0,
          radius: 100,
        },
      }),
    });

    render(<AttendanceValidation onValidationSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/secure attendance/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /request exception/i,
      })
    );

    expect(screen.getByText(/exception request/i)).toBeInTheDocument();

    expect(
      screen.getByText(/request attendance validation exception/i)
    ).toBeInTheDocument();
  });

  test("closes exception modal when cancel is clicked", async () => {
    const user = userEvent.setup();

    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timeWindow: {
          start: "00:00",
          end: "23:59",
        },
        gpsLocation: {
          lat: 0,
          lng: 0,
          radius: 100,
        },
      }),
    });

    render(<AttendanceValidation onValidationSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/secure attendance/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /request exception/i,
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: /cancel/i,
      })
    );

    expect(screen.queryByText(/exception request/i)).not.toBeInTheDocument();
  });

  test("disables submit button when required fields are empty", async () => {
    const user = userEvent.setup();

    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timeWindow: {
          start: "00:00",
          end: "23:59",
        },
        gpsLocation: {
          lat: 0,
          lng: 0,
          radius: 100,
        },
      }),
    });

    render(<AttendanceValidation onValidationSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/secure attendance/i)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /request exception/i,
      })
    );

    const submitButton = screen.getByRole("button", {
      name: /submit/i,
    });

    expect(submitButton).toBeDisabled();
  });
});
