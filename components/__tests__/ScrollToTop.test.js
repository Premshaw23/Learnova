import { render, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import ScrollToTop from "./ScrollToTop";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("ScrollToTop", () => {
  let scrollToSpy;

  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");

    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    Object.defineProperty(window.history, "scrollRestoration", {
      writable: true,
      configurable: true,
      value: "auto",
    });

    window.location.hash = "";

    global.requestAnimationFrame = vi.fn((cb) => cb());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("sets scroll restoration to manual", () => {
    render(<ScrollToTop />);

    expect(window.history.scrollRestoration).toBe("manual");
  });

  test("scrolls to top when no hash is present", () => {
    render(<ScrollToTop />);

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "instant",
    });
  });

  test("scrolls target element into view when hash exists", async () => {
    window.location.hash = "#target-section";

    const scrollIntoViewMock = vi.fn();

    const getElementByIdSpy = vi
      .spyOn(document, "getElementById")
      .mockReturnValue({
        scrollIntoView: scrollIntoViewMock,
      });

    render(<ScrollToTop />);

    await waitFor(() => {
      expect(getElementByIdSpy).toHaveBeenCalledWith("target-section");
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      });
    });

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  test("does not fail when hash target element does not exist", () => {
    window.location.hash = "#missing-element";

    vi.spyOn(document, "getElementById").mockReturnValue(null);

    expect(() => render(<ScrollToTop />)).not.toThrow();
  });

  test("runs effect again when pathname changes", () => {
    const { rerender } = render(<ScrollToTop />);

    expect(scrollToSpy).toHaveBeenCalledTimes(1);

    mockUsePathname.mockReturnValue("/dashboard");

    rerender(<ScrollToTop />);

    expect(scrollToSpy).toHaveBeenCalledTimes(2);
  });
});