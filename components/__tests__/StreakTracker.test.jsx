import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import StreakTracker from "../ui/StreakTracker";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

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
  // Pin down a static date anchor for testing date intervals (e.g., May 28, 2026)
  const baseMockDate = new Date(2026, 4, 28, 10, 0, 0);

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(baseMockDate);
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
    // Set yesterday's date relative to our fixed system time
    const yesterday = new Date(baseMockDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    window.localStorage.setItem("currentStreak", "3");
    window.localStorage.setItem("lastActiveDate", yesterdayMidnight.toISOString());

    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/4 Days Streak/i);
    expect(streakText).toBeInTheDocument();

    expect(window.localStorage.getItem("currentStreak")).toBe("4");
  });

  test("should keep streak the same if lastActiveDate is today", () => {
    const today = new Date(baseMockDate);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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
    const threeDaysAgo = new Date(baseMockDate);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoMidnight = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate());

    window.localStorage.setItem("currentStreak", "10");
    window.localStorage.setItem("lastActiveDate", threeDaysAgoMidnight.toISOString());

    render(<StreakTracker />);

    act(() => {
      vi.runAllTimers();
    });

    const streakText = screen.getByText(/1 Day Streak/i);
    expect(streakText).toBeInTheDocument();

    expect(window.localStorage.getItem("currentStreak")).toBe("1");
  });
});