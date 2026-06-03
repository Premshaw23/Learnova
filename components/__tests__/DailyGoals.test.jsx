import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import DailyGoals from "../DailyGoals";

const mockSafeLocalStorageGet = vi.fn();
const mockSafeLocalStorageSet = vi.fn();
const mockNormalizeDailyGoals = vi.fn();

vi.mock("@/lib/storage", () => ({
  safeLocalStorageGet: (...args) =>
    mockSafeLocalStorageGet(...args),
  safeLocalStorageSet: (...args) =>
    mockSafeLocalStorageSet(...args),
}));

vi.mock("@/lib/wellnessStorage", () => ({
  normalizeDailyGoals: (...args) =>
    mockNormalizeDailyGoals(...args),
}));

describe("DailyGoals Goal Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSafeLocalStorageGet.mockReturnValue([]);
    mockNormalizeDailyGoals.mockImplementation(
      (value) => value
    );

    global.crypto = {
      randomUUID: vi.fn(() => "goal-123"),
    };
  });

  test("renders empty state when no goals exist", () => {
    render(<DailyGoals />);

    expect(
      screen.getByText(
        /no goals added yet/i
      )
    ).toBeInTheDocument();
  });

  test("adds a new goal", async () => {
    const user = userEvent.setup();

    render(<DailyGoals />);

    const input = screen.getByRole("textbox", {
      name: /goal description/i,
    });

    await user.type(input, "Drink 2 liters of water");

    await user.click(
      screen.getByRole("button", {
        name: /add goal/i,
      })
    );

    expect(
      screen.getByText(
        "Drink 2 liters of water"
      )
    ).toBeInTheDocument();
  });

  test("does not add empty goals", async () => {
    const user = userEvent.setup();

    render(<DailyGoals />);

    await user.click(
      screen.getByRole("button", {
        name: /add goal/i,
      })
    );

    expect(
      screen.getByText(
        /no goals added yet/i
      )
    ).toBeInTheDocument();
  });

  test("toggles goal completion", async () => {
    const user = userEvent.setup();

    render(<DailyGoals />);

    const input = screen.getByRole("textbox", {
      name: /goal description/i,
    });

    await user.type(input, "Morning Walk");

    await user.click(
      screen.getByRole("button", {
        name: /add goal/i,
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: /morning walk/i,
      })
    );

    expect(
      screen.getByText("Morning Walk")
        .closest("button")
    ).toHaveClass("line-through");
  });

  test("removes a goal", async () => {
    const user = userEvent.setup();

    render(<DailyGoals />);

    const input = screen.getByRole("textbox", {
      name: /goal description/i,
    });

    await user.type(input, "Meditation");

    await user.click(
      screen.getByRole("button", {
        name: /add goal/i,
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: /remove goal meditation/i,
      })
    );

    expect(
      screen.queryByText("Meditation")
    ).not.toBeInTheDocument();
  });

  test("loads saved goals from storage", () => {
    mockSafeLocalStorageGet.mockReturnValue([
      {
        id: "goal-1",
        text: "Read a book",
        complete: false,
      },
    ]);

    render(<DailyGoals />);

    expect(
      screen.getByText("Read a book")
    ).toBeInTheDocument();
  });
});