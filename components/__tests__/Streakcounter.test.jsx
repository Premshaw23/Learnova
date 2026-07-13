import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import StreakCounter from "../gamification/StreakCounter";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

describe("StreakCounter", () => {
  test("renders attendance streak label", () => {
    render(<StreakCounter currentStreak={5} />);

    expect(
      screen.getByText(/attendance streak/i)
    ).toBeInTheDocument();
  });

  test("renders fire emoji indicator", () => {
    render(<StreakCounter currentStreak={5} />);

    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  test("renders singular day text when streak is 1", () => {
    render(<StreakCounter currentStreak={1} />);

    expect(screen.getByText("1 Day")).toBeInTheDocument();
  });

  test("renders plural days text when streak is greater than 1", () => {
    render(<StreakCounter currentStreak={7} />);

    expect(screen.getByText("7 Days")).toBeInTheDocument();
  });

  test("renders zero days by default", () => {
    render(<StreakCounter />);

    expect(screen.getByText("0 Days")).toBeInTheDocument();
  });

  test("renders custom streak count", () => {
    render(<StreakCounter currentStreak={30} />);

    expect(screen.getByText("30 Days")).toBeInTheDocument();
  });
});