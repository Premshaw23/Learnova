import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StreakTracker from "../ui/StreakTracker";

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

describe("StreakTracker Component", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should initialize streak to 1 and store today as lastActiveDate on first render", () => {
    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/1 Day Streak/i);
    expect(streakText).toBeInTheDocument();

    const storedStreak = window.localStorage.getItem("currentStreak");
    const storedDate = window.localStorage.getItem("lastActiveDate");

    expect(storedStreak).toBe("1");
    expect(storedDate).toBeDefined();
  });

  test("should increment streak if lastActiveDate was yesterday", () => {
    // Set yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMidnight = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    window.localStorage.setItem("currentStreak", "3");
    window.localStorage.setItem(
      "lastActiveDate",
      yesterdayMidnight.toISOString()
    );

    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/4 Days Streak/i);
    expect(streakText).toBeInTheDocument();

    expect(window.localStorage.getItem("currentStreak")).toBe("4");
  });

  test("should keep streak the same if lastActiveDate is today", () => {
    const today = new Date();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    window.localStorage.setItem("currentStreak", "5");
    window.localStorage.setItem("lastActiveDate", todayMidnight.toISOString());

    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/5 Days Streak/i);
    expect(streakText).toBeInTheDocument();

    expect(window.localStorage.getItem("currentStreak")).toBe("5");
  });

  test("should reset streak to 1 if lastActiveDate was more than 1 day ago", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoMidnight = new Date(
      threeDaysAgo.getFullYear(),
      threeDaysAgo.getMonth(),
      threeDaysAgo.getDate()
    );

    window.localStorage.setItem("currentStreak", "10");
    window.localStorage.setItem(
      "lastActiveDate",
      threeDaysAgoMidnight.toISOString()
    );

    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/1 Day Streak/i);
    expect(streakText).toBeInTheDocument();

    expect(window.localStorage.getItem("currentStreak")).toBe("1");
  });
});
