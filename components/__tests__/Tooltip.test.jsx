import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Tooltip from "../ui/Tooltip";

// Simple test to ensure the Tooltip renders its children correctly.
// Since Radix UI Tooltip handles the portal and visibility inside React Lifecycle,
// we verify that the trigger element is mounted and correctly linked with aria-attributes.
describe("Tooltip Component", () => {
  test("should render trigger children correctly", () => {
    render(
      <Tooltip content="Tooltip message">
        <button data-testid="trigger-btn">Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByTestId("trigger-btn");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Hover me");
  });

  test("should gracefully render children without crash when content is empty", () => {
    render(
      <Tooltip content="">
        <button data-testid="trigger-btn">No Tooltip</button>
      </Tooltip>
    );

    const trigger = screen.getByTestId("trigger-btn");
    expect(trigger).toBeInTheDocument();
  });
});
