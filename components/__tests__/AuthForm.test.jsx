import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "../AuthForm";

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

describe("AuthForm", () => {
  test("renders login form with correct heading", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.getByText(/sign in to your student/i)).toBeInTheDocument();
  });

  test("renders signup form when isLogin is false", () => {
    render(<AuthForm {...defaultProps} isLogin={false} />);

    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByText(/create your student/i)).toBeInTheDocument();
  });

  test("shows full name field only on signup", () => {
    const { rerender } = render(<AuthForm {...defaultProps} />);

    expect(screen.queryByText("Full Name")).not.toBeInTheDocument();

    rerender(<AuthForm {...defaultProps} isLogin={false} />);

    expect(screen.getByText("Full Name")).toBeInTheDocument();
  });

  test("shows institute name field when role is institute on signup", () => {
    render(<AuthForm {...defaultProps} isLogin={false} selectedRole="institute" />);

    expect(screen.getByText("Institute Name")).toBeInTheDocument();
  });

  test("calls onSubmit when form is submitted", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(<AuthForm {...defaultProps} onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test("shows loading state when isLoading is true", () => {
    render(<AuthForm {...defaultProps} isLoading={true} />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /processing/i });
    expect(submitBtn).toBeDisabled();
  });

  test("displays submit error when present in errors object", () => {
    render(<AuthForm {...defaultProps} errors={{ submit: "Invalid credentials" }} />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  test("calls onToggleLogin when sign up link is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const toggleLink = screen.getByRole("button", { name: /sign up/i });
    await user.click(toggleLink);

    expect(defaultProps.onToggleLogin).toHaveBeenCalledTimes(1);
  });

  test("calls onForgotPassword when forgot password link is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const forgotLink = screen.getByRole("button", { name: /forgot password/i });
    await user.click(forgotLink);

    expect(defaultProps.onForgotPassword).toHaveBeenCalledTimes(1);
  });

  test("calls onGoogleLogin when Google button is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const googleBtn = screen.getByRole("button", { name: /continue with google/i });
    await user.click(googleBtn);

    expect(defaultProps.onGoogleLogin).toHaveBeenCalledTimes(1);
  });
});
