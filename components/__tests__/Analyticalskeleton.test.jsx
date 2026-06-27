import { render } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import AnalyticsSkeleton from "../AnalyticsSkeleton";

describe("AnalyticsSkeleton", () => {
  test("renders the skeleton container", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const root = container.firstChild;

    expect(root).toBeInTheDocument();
    expect(root).toHaveClass("animate-pulse");
  });

  test("renders one header skeleton", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const headerSkeleton = container.querySelector(
      ".h-20.bg-gray-800.rounded-2xl.w-full"
    );

    expect(headerSkeleton).toBeInTheDocument();
  });

  test("renders three analytics card skeletons", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const cardSkeletons = container.querySelectorAll(
      ".h-40.bg-gray-800.rounded-2xl"
    );

    expect(cardSkeletons).toHaveLength(3);
  });

  test("renders grid container for analytics cards", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const grid = container.querySelector(".grid");

    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("grid-cols-1");
  });

  test("renders exactly four skeleton blocks total", () => {
    const { container } = render(<AnalyticsSkeleton />);

    const skeletonBlocks = container.querySelectorAll(".bg-gray-800");

    expect(skeletonBlocks).toHaveLength(4);
  });
});