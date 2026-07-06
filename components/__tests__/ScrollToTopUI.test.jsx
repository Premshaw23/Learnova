import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ScrollToTop from "../ui/ScrollToTop";

describe("ScrollToTop UI Component", () => {
  let scrollToSpy;

  beforeEach(() => {
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;
    window.scrollY = 0;
  });

  test("does not render the button initially when scroll position is <= 300px", () => {
    render(<ScrollToTop />);
    const button = screen.queryByRole("button", { name: /scroll to top/i });
    expect(button).not.toBeInTheDocument();
  });

  test("renders the button when scrolled past 300px", () => {
    render(<ScrollToTop />);
    
    // Simulate scrolling past 300px
    window.scrollY = 350;
    act(() => {
      fireEvent.scroll(window);
    });

    const button = screen.getByRole("button", { name: /scroll to top/i });
    expect(button).toBeInTheDocument();
  });

  test("smoothly scrolls to top when clicked", () => {
    render(<ScrollToTop />);
    
    // Simulate scroll and trigger button render
    window.scrollY = 350;
    act(() => {
      fireEvent.scroll(window);
    });

    const button = screen.getByRole("button", { name: /scroll to top/i });
    fireEvent.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });
});
