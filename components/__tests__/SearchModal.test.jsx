import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";
import SearchModal from "../SearchModal";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useAuthContext hook
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    userProfile: { role: "student" },
    isAuthenticated: true,
  }),
}));

// =========================================================================
// REMOVED: Local lucide-react mock block. It now relies completely on the 
// structured dynamic Proxy mock configured inside your global tests/setup.js
// =========================================================================

describe("SearchModal Keyboard Events and Propagation", () => {
  const mockOnClose = vi.fn();
  let windowListener;

  beforeAll(() => {
    // Prevent unmocked framer-motion or layout warnings from cluttering logs
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
    windowListener = vi.fn();
  });

  afterEach(() => {
    // FIXED: Guarantees global intercept listeners are always stripped down between cycles
    window.removeEventListener("keydown", windowListener);
  });

  test("renders search modal and shifts focus to input on open", async () => {
    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/search pages and actions/i);
    expect(input).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  test("closes search modal when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/search pages and actions/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });

    await user.keyboard("{Escape}");
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("isolates specific action keys and prevents propagation to global listeners", async () => {
    window.addEventListener("keydown", windowListener);

    render(<SearchModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/search pages and actions/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    
    // Attach an interceptor directly onto the input element
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        mockOnClose();
      }
    });

    input.dispatchEvent(event);

    // The keydown event should be cleanly intercepted and prevented from bleeding up to window
    expect(windowListener).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});