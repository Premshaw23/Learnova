import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import NavbarBrand from "../navigation/NavbarBrand";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock Lucide Icon
vi.mock("lucide-react", () => ({
  BookOpen: (props) => (
    <svg data-testid="book-open-icon" {...props} />
  ),
}));

describe("NavbarBrand", () => {
  test("renders Learnova brand text", () => {
    render(<NavbarBrand />);

    expect(
      screen.getByText("Learnova")
    ).toBeInTheDocument();
  });

  test("renders Premium label", () => {
    render(<NavbarBrand />);

    expect(
      screen.getByText("Premium")
    ).toBeInTheDocument();
  });

  test("renders accessible home link", () => {
    render(<NavbarBrand />);

    const link = screen.getByRole("link", {
      name: /learnova home/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  test("renders book icon", () => {
    render(<NavbarBrand />);

    expect(
      screen.getByTestId("book-open-icon")
    ).toBeInTheDocument();
  });

  test("calls onNavigate when clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <NavbarBrand onNavigate={onNavigate} />
    );

    await user.click(
      screen.getByRole("link", {
        name: /learnova home/i,
      })
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});