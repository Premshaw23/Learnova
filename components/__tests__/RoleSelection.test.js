import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RoleSelection from "./RoleSelection";

const mockOnRoleSelect = vi.fn();

vi.mock("@/constants/userRoles", () => ({
  ROLE_CONFIG: {
    student: {
      title: "Student",
      description: "Student portal",
      color: "from-blue-500 to-blue-600",
      icon: () => <div data-testid="student-icon" />,
    },
    teacher: {
      title: "Teacher",
      description: "Teacher portal",
      color: "from-green-500 to-green-600",
      icon: () => <div data-testid="teacher-icon" />,
    },
    admin: {
      title: "Admin",
      description: "Admin portal",
      color: "from-orange-500 to-orange-600",
      icon: () => <div data-testid="admin-icon" />,
    },
  },
}));

describe("RoleSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders heading and instructional content", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    expect(screen.getByText("Choose Your Role")).toBeInTheDocument();

    expect(
      screen.getByText(/Select your portal to unlock/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Role selection is required/i)
    ).toBeInTheDocument();
  });

  test("renders all roles from ROLE_CONFIG", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("calls onRoleSelect when student role is selected", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /select student role/i,
      })
    );

    expect(mockOnRoleSelect).toHaveBeenCalledWith("student");
  });

  test("calls onRoleSelect when teacher role is selected", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /select teacher role/i,
      })
    );

    expect(mockOnRoleSelect).toHaveBeenCalledWith("teacher");
  });

  test("calls onRoleSelect when admin role is selected", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /select admin role/i,
      })
    );

    expect(mockOnRoleSelect).toHaveBeenCalledWith("admin");
  });

  test("renders feature section cards", () => {
    render(<RoleSelection onRoleSelect={mockOnRoleSelect} />);

    expect(screen.getByText("Secure Access")).toBeInTheDocument();
    expect(screen.getByText("Real-time Sync")).toBeInTheDocument();
    expect(screen.getByText("Custom Dashboard")).toBeInTheDocument();
  });
});