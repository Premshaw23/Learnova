import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ContributorsSection from "../ContributorsSection";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("@/data/contributors.json", () => ({
  default: [
    {
      name: "John Doe",
      username: "johndoe",
    },
    {
      name: "Jane Smith",
      username: "janesmith",
    },
  ],
}));

describe("ContributorsSection Contributor Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders section heading and description", () => {
    render(<ContributorsSection />);

    expect(
      screen.getByRole("heading", {
        name: /open source contributors/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/thank you to everyone helping build learnova/i)
    ).toBeInTheDocument();
  });

  test("renders all contributors", () => {
    render(<ContributorsSection />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    expect(screen.getByText("@johndoe")).toBeInTheDocument();

    expect(screen.getByText("@janesmith")).toBeInTheDocument();
  });

  test("renders contributor avatar images", () => {
    render(<ContributorsSection />);

    expect(screen.getByAltText("John Doe GitHub avatar")).toBeInTheDocument();

    expect(screen.getByAltText("Jane Smith GitHub avatar")).toBeInTheDocument();
  });

  test("creates correct GitHub profile links", () => {
    render(<ContributorsSection />);

    expect(
      screen.getByRole("link", {
        name: /john doe/i,
      })
    ).toHaveAttribute("href", "https://github.com/johndoe");

    expect(
      screen.getByRole("link", {
        name: /jane smith/i,
      })
    ).toHaveAttribute("href", "https://github.com/janesmith");
  });

  test("renders one link per contributor", () => {
    render(<ContributorsSection />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2);
  });
});
