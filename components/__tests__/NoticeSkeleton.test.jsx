import React from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import NoticeSkeleton from "../NoticeSkeleton";

vi.mock("framer-motion", async () => {
  const React = await vi.importActual("react");

  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) =>
        React.createElement("div", { ref, ...props }, children)
      ),
    },
  };
});

describe("NoticeSkeleton Loading States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders four skeleton cards by default", () => {
    const { container } = render(<NoticeSkeleton />);

    const cards = container.querySelectorAll(
      ".rounded-\\[2rem\\]"
    );

    expect(cards).toHaveLength(4);
  });

  test("renders custom skeleton count", () => {
    const { container } = render(
      <NoticeSkeleton count={6} />
    );

    const cards = container.querySelectorAll(
      ".rounded-\\[2rem\\]"
    );

    expect(cards).toHaveLength(6);
  });

  test("renders no skeleton cards when count is zero", () => {
    const { container } = render(
      <NoticeSkeleton count={0} />
    );

    const cards = container.querySelectorAll(
      ".rounded-\\[2rem\\]"
    );

    expect(cards).toHaveLength(0);
  });
});