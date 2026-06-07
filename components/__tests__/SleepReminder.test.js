import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import SleepReminder from "./SleepReminder";

describe("SleepReminder", () => {
  test("renders heading and description content", () => {
    render(<SleepReminder />);

    expect(screen.getByText("Wellness")).toBeInTheDocument();

    expect(screen.getByText("Sleep Reminder")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Unplug at the right time and prime your mind for rest/i
      )
    ).toBeInTheDocument();
  });

  test("renders recommended rest section", () => {
    render(<SleepReminder />);

    expect(
      screen.getByText("Recommended rest")
    ).toBeInTheDocument();

    expect(screen.getByText("7-9 hours")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Keep a steady bedtime and avoid screens/i
      )
    ).toBeInTheDocument();
  });

  test("renders all relaxation cues", () => {
    render(<SleepReminder />);

    expect(
      screen.getByText("Relaxation cues")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Set a calming evening ritual with light stretches/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Dim lights and quiet notifications/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Avoid caffeine later in the day/i
      )
    ).toBeInTheDocument();
  });

  test("renders exactly three relaxation recommendations", () => {
    render(<SleepReminder />);

    const recommendations = [
      screen.getByText(
        /Set a calming evening ritual with light stretches/i
      ),
      screen.getByText(
        /Dim lights and quiet notifications/i
      ),
      screen.getByText(
        /Avoid caffeine later in the day/i
      ),
    ];

    expect(recommendations).toHaveLength(3);
  });
});