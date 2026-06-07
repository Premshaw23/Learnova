import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import BreathingExercise from "./BreathingExercise";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock("@/hooks/useIsMounted", () => ({
  useIsMounted: () => () => true,
}));

describe("BreathingExercise", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("renders breathing exercise content", () => {
    render(<BreathingExercise />);

    expect(screen.getByText("Wellness")).toBeInTheDocument();
    expect(screen.getByText("Breathing Exercise")).toBeInTheDocument();
    expect(screen.getByText("Breathe In")).toBeInTheDocument();
    expect(screen.getByText("Start breathing")).toBeInTheDocument();
  });

  test("shows initial countdown value", () => {
    render(<BreathingExercise />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("seconds")).toBeInTheDocument();
  });

  test("starts breathing session when button is clicked", () => {
    render(<BreathingExercise />);

    fireEvent.click(screen.getByRole("button", { name: /start breathing/i }));

    expect(
      screen.getByRole("button", { name: /pause session/i })
    ).toBeInTheDocument();
  });

  test("decreases countdown while active", () => {
    render(<BreathingExercise />);

    fireEvent.click(screen.getByRole("button", { name: /start breathing/i }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("moves from inhale phase to hold phase", () => {
    render(<BreathingExercise />);

    fireEvent.click(screen.getByRole("button", { name: /start breathing/i }));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getAllByText("Hold").length).toBeGreaterThan(0);
  });

  test("reset button restores initial state", () => {
    render(<BreathingExercise />);

    fireEvent.click(screen.getByRole("button", { name: /start breathing/i }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(
      screen.getByRole("button", { name: /start breathing/i })
    ).toBeInTheDocument();

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("Breathe In").length).toBeGreaterThan(0);
  });

  test("pauses breathing session", () => {
    render(<BreathingExercise />);

    fireEvent.click(screen.getByRole("button", { name: /start breathing/i }));

    fireEvent.click(screen.getByRole("button", { name: /pause session/i }));

    expect(
      screen.getByRole("button", { name: /start breathing/i })
    ).toBeInTheDocument();
  });
});