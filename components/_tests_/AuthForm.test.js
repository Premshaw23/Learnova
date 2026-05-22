import { render, screen, fireEvent } from "@testing-library/react";
import AuthForm from "../AuthForm";

const props = {
  isLogin: true,
  selectedRole: "student",
  email: "",
  setEmail: jest.fn(),
  password: "",
  setPassword: jest.fn(),
  fullName: "",
  setFullName: jest.fn(),
  instituteName: "",
  setInstituteName: jest.fn(),
  errors: {},
  setErrors: jest.fn(),
  isLoading: false,
  onSubmit: jest.fn((e) => e.preventDefault()),
  onGoogleLogin: jest.fn(),
  onRoleChange: jest.fn(),
  onToggleLogin: jest.fn(),
  onForgotPassword: jest.fn(),
};

describe("AuthForm", () => {
  test("renders login form by default", () => {
    render(<AuthForm {...props} />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  test('shows "Full Name" field only in sign-up mode', () => {
    const { rerender } = render(
      <AuthForm {...props} isLogin={true} />
    );

    expect(screen.queryByText(/full name/i)).not.toBeInTheDocument();

    rerender(<AuthForm {...props} isLogin={false} />);

    expect(screen.getByText(/full name/i)).toBeInTheDocument();
  });

  test("shows validation error when email is empty on submit", () => {
    render(
      <AuthForm
        {...props}
        errors={{ email: "Email is required" }}
      />
    );

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  test("shows validation error when password is empty on submit", () => {
    render(
      <AuthForm
        {...props}
        errors={{ password: "Password is required" }}
      />
    );

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test("calls onSubmit when valid data is entered", () => {
    const onSubmit = jest.fn((e) => e.preventDefault());

    render(
      <AuthForm
        {...props}
        email="test@example.com"
        password="password123"
        onSubmit={onSubmit}
      />
    );

    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});