import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import WaterTracker from "./WaterTracker";

const mockSafeLocalStorageGet = vi.fn();
const mockSafeLocalStorageSet = vi.fn();
const mockNormalizeWaterGlasses = vi.fn();

vi.mock("@/lib/storage", () => ({
  safeLocalStorageGet: (...args) => mockSafeLocalStorageGet(...args),
  safeLocalStorageSet: (...args) => mockSafeLocalStorageSet(...args),
}));

vi.mock("@/lib/wellnessStorage", () => ({
  DEFAULT_WATER_GLASSES: 4,
  WELLNESS_WATER_GOAL: 8,
  normalizeWaterGlasses: (...args) =>
    mockNormalizeWaterGlasses(...args),
}));

describe("WaterTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSafeLocalStorageGet.mockReturnValue(4);

    mockNormalizeWaterGlasses.mockImplementation(
      (value) => Number(value)
    );
  });

  test("renders water tracker heading and description", () => {
    render(<WaterTracker />);

    expect(screen.getByText("Water Intake")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Track your hydration with a clear daily goal/i
      )
    ).toBeInTheDocument();
  });

  test("loads saved water intake from storage", () => {
    mockSafeLocalStorageGet.mockReturnValue(6);

    render(<WaterTracker />);

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("75% hydrated")).toBeInTheDocument();
  });

  test("adds a glass of water when add button is clicked", () => {
    render(<WaterTracker />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /add water/i,
      })
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("removes a glass of water when remove button is clicked", () => {
    render(<WaterTracker />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove glass/i,
      })
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("updates hydration percentage when water intake changes", () => {
    render(<WaterTracker />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /add water/i,
      })
    );

    expect(screen.getByText("63% hydrated")).toBeInTheDocument();
  });

  test("persists updated hydration value", () => {
    render(<WaterTracker />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /add water/i,
      })
    );

    expect(mockSafeLocalStorageSet).toHaveBeenCalled();
  });

  test("displays target water goal", () => {
    render(<WaterTracker />);

    expect(
      screen.getByText("Target: 8 glasses")
    ).toBeInTheDocument();
  });

  test("does not allow water count below zero", () => {
    mockSafeLocalStorageGet.mockReturnValue(0);

    render(<WaterTracker />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove glass/i,
      })
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
