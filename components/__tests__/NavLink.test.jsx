import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import NavLink from "../navigation/NavLink";

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
    span: ({ children, ...props }) => (
      <span data-testid="motion-span" {...props}>
        {children}
      </span>
    ),
  },
}));

describe("NavLink", () => {
  test("renders the provided label", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={false}
      />
    );

    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toBeInTheDocument();
  });

  test("renders the correct href", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={false}
      />
    );

    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toHaveAttribute("href", "/dashboard");
  });

  test("sets aria-current when active", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={true}
      />
    );

    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toHaveAttribute("aria-current", "page");
  });

  test("does not set aria-current when inactive", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={false}
      />
    );

    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).not.toHaveAttribute("aria-current");
  });

  test("renders active indicator when active", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={true}
      />
    );

    expect(screen.getByTestId("motion-span")).toBeInTheDocument();
  });

  test("does not render active indicator when inactive", () => {
    render(
      <NavLink
        href="/dashboard"
        label="Dashboard"
        isActive={false}
      />
    );

    expect(screen.queryByTestId("motion-span")).not.toBeInTheDocument();
  });
});