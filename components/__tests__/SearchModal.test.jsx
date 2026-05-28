import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchModal from "../SearchModal";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock useAuthContext hook
jest.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    userProfile: { role: "student" },
    isAuthenticated: true,
  }),
}));

describe("SearchModal Keyboard Events and Propagation", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders search modal and shifts focus to input on open", async () => {
    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Search pages and actions...");
    expect(input).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  test("closes search modal when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByPlaceholderText("Search pages and actions..."));
    });

    await user.keyboard("{Escape}");
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("isolates keyboard events and stops them from bleeding to global window handlers", async () => {
    const user = userEvent.setup();
    const windowListener = jest.fn();
    window.addEventListener("keydown", windowListener);

    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Search pages and actions...");
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });

    // Type a character inside the search input
    await user.type(input, "h");

    // The keydown events from typing should be isolated within the modal
    // and must not bubble up to the global window listener.
    expect(windowListener).not.toHaveBeenCalled();

    window.removeEventListener("keydown", windowListener);
  });
});
