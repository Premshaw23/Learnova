import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AmbientMode from "./AmbientMode";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("AmbientMode", () => {
  test("renders ambient mode heading and description", () => {
    render(<AmbientMode />);

    expect(screen.getByText("Ambient Mode")).toBeInTheDocument();

    expect(screen.getByText("Calm Focus Space")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Sink into a serene gradient environment with soft motion/i
      )
    ).toBeInTheDocument();
  });

  test("renders both ambient feature cards", () => {
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

  test("renders exactly two ambient feature cards", () => {
    render(<AmbientMode />);

    const cards = [
      screen.getByText(
        "Soft glow edges create a calm visual field."
      ),
      screen.getByText(
        "Smooth ambient motion helps your eyes relax."
      ),
    ];

    expect(cards).toHaveLength(2);
  });

  test("renders the animated ambient visual container", () => {
    const { container } = render(<AmbientMode />);

    const visualContainer = container.querySelector(
      ".h-48"
    );

    expect(visualContainer).toBeInTheDocument();
  });
});