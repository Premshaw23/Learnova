import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuthContext } from "../AuthContext";
import { useAuth } from "@/hooks/useAuth";

// Mock the useAuth hook
jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

// Test component that consumes the AuthContext
function TestComponent() {
  const { user } = useAuthContext();
  return <div data-testid="user-email">{user ? user.email : "No User"}</div>;
}

describe("AuthContext and AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("throws an error when useAuthContext is used outside AuthProvider", () => {
    // Suppress console.error in test output as throwing is expected here
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useAuthContext must be used within an AuthProvider"
    );

    consoleErrorSpy.mockRestore();
  });

  test("returns the context value when used within AuthProvider", () => {
    const mockAuthValue = {
      user: { email: "test@example.com" },
      userProfile: null,
      loading: false,
      error: null,
      signOut: jest.fn(),
      isAuthenticated: true,
      hasProfile: false,
    };

    useAuth.mockReturnValue(mockAuthValue);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
  });
});
