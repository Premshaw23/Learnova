import { render, screen, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import MotivationCard from "./MotivationCard";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

describe("MotivationCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("renders motivation section content", () => {
    render(<MotivationCard />);

    expect(screen.getByText("Motivation")).toBeInTheDocument();
    expect(screen.getByText("Daily Boost")).toBeInTheDocument();

    expect(
      screen.getByText(/New quote every few seconds/i)
    ).toBeInTheDocument();
  });

  test("shows the first quote on initial render", () => {
    render(<MotivationCard />);

    expect(screen.getByText("Daily motivation")).toBeInTheDocument();

    expect(
      screen.getByText(
        /A calm mind supports sharper thinking\. Take small breaks and keep moving forward\./i
      )
    ).toBeInTheDocument();
  });

  test("rotates to the second quote after 6500ms", () => {
    render(<MotivationCard />);

    act(() => {
      vi.advanceTimersByTime(6500);
    });

    expect(screen.getByText("Study encouragement")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Every step you take today builds stronger habits for tomorrow\./i
      )
    ).toBeInTheDocument();
  });

  test("rotates to the third quote after two intervals", () => {
    render(<MotivationCard />);

    act(() => {
      vi.advanceTimersByTime(6500 * 2);
    });

    expect(screen.getByText("Productivity reminder")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Focus on progress, not perfection\. Momentum grows from consistency\./i
      )
    ).toBeInTheDocument();
  });

  test("loops back to the first quote after completing a full cycle", () => {
    render(<MotivationCard />);

    act(() => {
      vi.advanceTimersByTime(6500 * 4);
    });

    expect(screen.getByText("Daily motivation")).toBeInTheDocument();

    expect(
      screen.getByText(
        /A calm mind supports sharper thinking\. Take small breaks and keep moving forward\./i
      )
    ).toBeInTheDocument();
  });

  test("clears interval on component unmount", () => {
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = render(<MotivationCard />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});