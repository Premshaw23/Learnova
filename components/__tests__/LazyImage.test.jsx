import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import LazyImage from "./LazyImage";

describe("LazyImage", () => {
  test("renders image with provided src and alt", () => {
    render(<LazyImage src="/image.jpg" alt="Test image" />);

    const image = screen.getByAltText("Test image");

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/image.jpg");
  });

  test("shows loading skeleton before image loads", () => {
    const { container } = render(
      <LazyImage src="/image.jpg" alt="Test image" />
    );

    const skeleton = container.querySelector(".animate-pulse");

    expect(skeleton).toBeInTheDocument();
  });

  test("hides skeleton and shows image after load", () => {
    const { container } = render(
      <LazyImage src="/image.jpg" alt="Test image" />
    );

    const image = screen.getByAltText("Test image");

    fireEvent.load(image);

    const skeleton = container.querySelector(".animate-pulse");

    expect(skeleton).not.toBeInTheDocument();
    expect(image.className).toContain("opacity-100");
  });

  test("uses fallback image when image load fails", () => {
    render(
      <LazyImage
        src="/broken-image.jpg"
        alt="Broken image"
        fallbackSrc="/fallback.jpg"
      />
    );

    const image = screen.getByAltText("Broken image");

    fireEvent.error(image);

    expect(image).toHaveAttribute("src", "/fallback.jpg");
  });

  test("resets loading state when src changes", () => {
    const { rerender, container } = render(
      <LazyImage src="/first.jpg" alt="Test image" />
    );

    const image = screen.getByAltText("Test image");

    fireEvent.load(image);

    rerender(<LazyImage src="/second.jpg" alt="Test image" />);

    const skeleton = container.querySelector(".animate-pulse");

    expect(skeleton).toBeInTheDocument();
  });

  test("applies custom className and skeletonClassName", () => {
    const { container } = render(
      <LazyImage
        src="/image.jpg"
        alt="Test image"
        className="custom-wrapper"
        skeletonClassName="custom-skeleton"
      />
    );

    expect(container.firstChild).toHaveClass("custom-wrapper");

    const skeleton = container.querySelector(".custom-skeleton");

    expect(skeleton).toBeInTheDocument();
  });

  test("passes additional props to image element", () => {
    render(
      <LazyImage
        src="/image.jpg"
        alt="Test image"
        data-testid="lazy-image"
      />
    );

    const image = screen.getByTestId("lazy-image");

    expect(image).toBeInTheDocument();
  });
});