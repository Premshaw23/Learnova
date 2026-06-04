import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MoodTracker from "../MoodTracker";

// Mock framer-motion since it can be problematic in jsdom/vitest environment
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, whileHover, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("MoodTracker Component", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("should render the MoodTracker title and moods", () => {
    render(<MoodTracker />);
    expect(screen.getByText("Mood Tracker")).toBeInTheDocument();
    expect(screen.getAllByText("Happy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Calm").length).toBeGreaterThan(0);
  });

  test("should render the 'Selected mood' badge exactly once for the active mood", () => {
    render(<MoodTracker />);

    // By default, "happy" is the active mood.
    // Let's verify that the "Selected mood" badge is rendered exactly once.
    const badges = screen.getAllByText("Selected mood");
    expect(badges).toHaveLength(1);
  });

  test("should update the active mood and keep only a single 'Selected mood' badge", () => {
    render(<MoodTracker />);

    // Find the "Calm" mood button and click it
    const calmButton = screen.getByRole("button", { name: /Calm/i });
    fireEvent.click(calmButton);

    // Verify that the "Selected mood" badge is still rendered exactly once on the page
    const badges = screen.getAllByText("Selected mood");
    expect(badges).toHaveLength(1);
  });
});
