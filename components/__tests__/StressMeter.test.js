import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import StressMeter from "./StressMeter";

const mockSafeLocalStorageGet = vi.fn();
const mockSafeLocalStorageSet = vi.fn();

vi.mock("@/lib/storage", () => ({
  safeLocalStorageGet: (...args) => mockSafeLocalStorageGet(...args),
  safeLocalStorageSet: (...args) => mockSafeLocalStorageSet(...args),
}));

vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }) => (
      <section {...props}>{children}</section>
    ),
  },
}));

vi.mock("react-circular-progressbar", () => ({
  CircularProgressbar: ({ value, text }) => (
    <div data-testid="progressbar">
      {value} - {text}
    </div>
  ),
  buildStyles: vi.fn(() => ({})),
}));

describe("StressMeter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSafeLocalStorageGet.mockReturnValue(36);
  });

  test("renders stress meter heading and description", () => {
    render(<StressMeter />);

    expect(screen.getByText("Stress Meter")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Track your stress level with a responsive meter/i
      )
    ).toBeInTheDocument();
  });

  test("loads saved stress value from local storage", () => {
    mockSafeLocalStorageGet.mockReturnValue(55);

    render(<StressMeter />);

    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText("Moderate Stress")).toBeInTheDocument();
  });

  test("shows low stress label", () => {
    mockSafeLocalStorageGet.mockReturnValue(20);

    render(<StressMeter />);

    expect(screen.getByText("Low Stress")).toBeInTheDocument();
  });

  test("shows moderate stress label", () => {
    mockSafeLocalStorageGet.mockReturnValue(50);

    render(<StressMeter />);

    expect(screen.getByText("Moderate Stress")).toBeInTheDocument();
  });

  test("shows high stress label", () => {
    mockSafeLocalStorageGet.mockReturnValue(85);

    render(<StressMeter />);

    expect(screen.getByText("High Stress")).toBeInTheDocument();
  });

  test("updates stress value when slider changes", () => {
    render(<StressMeter />);

    const slider = screen.getByLabelText("Adjust stress level");

    fireEvent.change(slider, {
      target: { value: "80" },
    });

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("High Stress")).toBeInTheDocument();
  });

  test("persists updated stress value", () => {
    render(<StressMeter />);

    const slider = screen.getByLabelText("Adjust stress level");

    fireEvent.change(slider, {
      target: { value: "72" },
    });

    expect(mockSafeLocalStorageSet).toHaveBeenCalledWith(
      "learnova-wellness-stress",
      72
    );
  });

  test("renders wellness tip content", () => {
    render(<StressMeter />);

    expect(screen.getByText("Wellness tip")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Try a short walk or breathing break when stress climbs above 70%/i
      )
    ).toBeInTheDocument();
  });
});