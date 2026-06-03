import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import DailyReflectionJournal from "../DailyReflectionJournal";

vi.mock("framer-motion", async () => {
  const React = await vi.importActual("react");

  return {
    motion: {
      section: React.forwardRef(({ children, ...props }, ref) =>
        React.createElement("section", { ref, ...props }, children)
      ),
      div: React.forwardRef(({ children, ...props }, ref) =>
        React.createElement("div", { ref, ...props }, children)
      ),
    },
  };
});

const localStorageMock = (() => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe("DailyReflectionJournal Reflection Persistence", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  test("renders journal headings", () => {
    render(<DailyReflectionJournal />);

    expect(
      screen.getByText(/daily reflection journal/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/what went well today/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/one thing you're proud of/i)
    ).toBeInTheDocument();
  });

  test("loads saved reflections from localStorage", () => {
    window.localStorage.setItem(
      "learnova-wellness-reflections",
      JSON.stringify({
        wentWell: "Completed my assignments",
        proudOf: "Stayed consistent",
      })
    );

    render(<DailyReflectionJournal />);

    expect(
      screen.getByDisplayValue(
        "Completed my assignments"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "Stayed consistent"
      )
    ).toBeInTheDocument();
  });

  test("updates textarea values", async () => {
    const user = userEvent.setup();

    render(<DailyReflectionJournal />);

    const wentWellTextarea =
      screen.getByPlaceholderText(
        /a moment that felt good/i
      );

    await user.type(
      wentWellTextarea,
      "Had a productive day"
    );

    expect(wentWellTextarea).toHaveValue(
      "Had a productive day"
    );
  });

  test("saves reflections to localStorage", async () => {
    const user = userEvent.setup();

    render(<DailyReflectionJournal />);

    await user.type(
      screen.getByPlaceholderText(
        /a moment that felt good/i
      ),
      "Finished studying"
    );

    await user.type(
      screen.getByPlaceholderText(
        /a small accomplishment or progress/i
      ),
      "Completed workout"
    );

    await user.click(
      screen.getByRole("button", {
        name: /save reflection/i,
      })
    );

    expect(
      window.localStorage.setItem
    ).toHaveBeenCalled();
  });

  test("shows save confirmation message", async () => {
    const user = userEvent.setup();

    render(<DailyReflectionJournal />);

    await user.click(
      screen.getByRole("button", {
        name: /save reflection/i,
      })
    );

    expect(
      screen.getByText(
        /reflection saved successfully/i
      )
    ).toBeInTheDocument();
  });

  test("handles invalid localStorage data gracefully", () => {
    window.localStorage.setItem(
      "learnova-wellness-reflections",
      "invalid-json"
    );

    expect(() => {
      render(<DailyReflectionJournal />);
    }).not.toThrow();
  });
});