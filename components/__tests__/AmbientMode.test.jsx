import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AmbientMode from "../AmbientMode";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe("AmbientMode", () => {
  test("renders ambient mode label", () => {
    render(<AmbientMode />);

    expect(screen.getByText(/ambient mode/i)).toBeInTheDocument();
  });

  test("renders heading", () => {
    render(<AmbientMode />);

    expect(
      screen.getByRole("heading", {
        name: /calm focus space/i,
      })
    ).toBeInTheDocument();
  });

  test("renders description text", () => {
    render(<AmbientMode />);

    expect(
      screen.getByText(
        /sink into a serene gradient environment/i
      )
    ).toBeInTheDocument();
  });

  test("renders both feature cards", () => {
    render(<AmbientMode />);

    expect(
      screen.getByText(
        "Soft glow edges create a calm visual field."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Smooth ambient motion helps your eyes relax."
      )
    ).toBeInTheDocument();
  });

  test("renders motion elements", () => {
    render(<AmbientMode />);

    expect(screen.getAllByTestId("motion-div").length).toBeGreaterThanOrEqual(3);
  });
});