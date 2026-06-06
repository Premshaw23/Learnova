import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach, beforeAll } from "vitest";
import AuthForm from "../AuthForm";

// =========================================================================
// REMOVED: Local lucide-react mock block. It now relies completely on the 
// structured dynamic Proxy mock configured inside your global tests/setup.js
// =========================================================================

// Polyfill window.matchMedia safely inside the browser simulation shell
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const defaultProps = {
  isLogin: true,
  selectedRole: "student",
  email: "",
  setEmail: vi.fn(),
  password: "",
  setPassword: vi.fn(),
  fullName: "",
  setFullName: vi.fn(),
  instituteName: "",
  setInstituteName: vi.fn(),
  errors: {},
  setErrors: vi.fn(),
  isLoading: false,
  onSubmit: vi.fn((e) => e.preventDefault()),
  onGoogleLogin: vi.fn(),
  onRoleChange: vi.fn(),
  onToggleLogin: vi.fn(),
  onForgotPassword: vi.fn(),
};

describe("AuthForm Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders login form with correct heading layouts", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByText(/sign in to your student/i)).toBeInTheDocument();
  });

  test("renders signup form layout when isLogin is false", () => {
    render(<AuthForm {...defaultProps} isLogin={false} />);

    expect(screen.getByRole("heading", { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/create your student/i)).toBeInTheDocument();
  });

  test("shows full name field only on signup form states", () => {
    const { rerender } = render(<AuthForm {...defaultProps} />);

    expect(screen.queryByPlaceholderText(/john doe/i)).not.toBeInTheDocument();

    rerender(<AuthForm {...defaultProps} isLogin={false} />);

    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
  });

  test("shows institute name field when role is institute on signup", () => {
    render(<AuthForm {...defaultProps} isLogin={false} selectedRole="institute" />);

    expect(screen.getByPlaceholderText(/institute name/i)).toBeInTheDocument();
  });

  test("calls onSubmit handler successfully when form is submitted", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(<AuthForm {...defaultProps} onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test("shows disabled loading state buttons when isLoading is active", () => {
    render(<AuthForm {...defaultProps} isLoading={true} />);

    expect(screen.getByText(/processing/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /processing/i });
    expect(submitBtn).toBeDisabled();
  });

  test("displays submit validation error message when present in errors", () => {
    render(<AuthForm {...defaultProps} errors={{ submit: "Invalid credentials" }} />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  test("calls onToggleLogin state action link when sign up link is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const toggleLink = screen.getByRole("button", { name: /sign up/i });
    await user.click(toggleLink);

    expect(defaultProps.onToggleLogin).toHaveBeenCalledTimes(1);
  });

  test("calls onForgotPassword action link when forgot password link is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const forgotLink = screen.getByRole("button", { name: /forgot password/i });
    await user.click(forgotLink);

    expect(defaultProps.onForgotPassword).toHaveBeenCalledTimes(1);
  });

  test("calls onGoogleLogin OAuth stream provider when Google button is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const googleBtn = screen.getByRole("button", { name: /continue with google/i });
    await user.click(googleBtn);

    expect(defaultProps.onGoogleLogin).toHaveBeenCalledTimes(1);
  });
});