import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { vi } from "vitest";

global.fetch = vi.fn();

const mockUser = {
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock("../Navbar", () => ({
  Navbar: () => <div>Mock Navbar</div>,
}));

vi.mock("@/components/ui/DashboardSkeleton", () => ({
  default: function MockDashboardSkeleton() {
    return <div>Dashboard Loading...</div>;
  },
}));

vi.mock("@/components/ui/ChartSkeleton", () => ({
  default: function MockChartSkeleton() {
    return <div>Chart Skeleton</div>;
  },
}));

vi.mock("@/components/ui/SkeletonCard", () => ({
  default: function MockSkeletonCard() {
    return <div>Skeleton Card</div>;
  },
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return function MockDynamicComponent() {
      return <div>Mock Chart</div>;
    };
  },
}));

vi.mock("@/db/offlineStore", () => ({
  getPendingActions: vi.fn().mockResolvedValue([]),
  removePendingAction: vi.fn().mockResolvedValue(true),
  clearPendingActions: vi.fn().mockResolvedValue(true),
}));

import AdminDashboard from "../AdminDashboard";

const mockResponse = {
  platformStats: {
    totalInstitutes: 12,
    activeInstitutes: 10,
    totalUsers: 1500,
    dailyActiveUsers: 950,
    faceRecognitionAPICalls: "25K",
    storageUsed: "80GB",
    systemUptime: "99.9%",
    revenue: "$5000",
    pendingIssues: 2,
    serverLoad: 35,
  },
  institutes: [
    {
      id: "1",
      name: "Delhi Technical University",
      lastActive: "Today",
      status: "active",
      students: 500,
      teachers: 40,
      plan: "Premium",
      payment: "paid",
      apiCalls: 12000,
      storage: "20GB",
      healthScore: 95,
      issues: 0,
    },
  ],
  systemMetrics: {
    database: {
      status: "operational",
      latency: "8ms",
    },
  },
  criticalAlerts: [
    {
      id: "1",
      severity: "high",
      message: "Database latency increased",
      time: "5m ago",
    },
  ],
  featureUsage: {
    faceRecognition: {
      enabled: 8,
      total: 12,
      percentage: 66,
    },
  },
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: vi.fn().mockResolvedValue(mockResponse),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders dashboard after successful fetch", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Learnova Admin Center")).toBeInTheDocument();
    });

    expect(screen.getByText("Super Admin Dashboard")).toBeInTheDocument();

    expect(
      screen.getByText("System Status: All Services Operational")
    ).toBeInTheDocument();
  });

  test("renders fetched critical alerts", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Database latency increased")
      ).toBeInTheDocument();
    });
  });

  test("switches to institutes tab", async () => {
    const user = userEvent.setup();

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Learnova Admin Center")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /institutes/i,
      })
    );

    expect(screen.getByText("Institute Management")).toBeInTheDocument();

    expect(screen.getByText("Delhi Technical University")).toBeInTheDocument();
  });

  test("switches to monitoring tab", async () => {
    const user = userEvent.setup();

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Learnova Admin Center")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /monitoring/i,
      })
    );

    expect(
      screen.getByText(/System Monitoring & Infrastructure/i)
    ).toBeInTheDocument();
  });

  test("switches to security tab", async () => {
    const user = userEvent.setup();

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Learnova Admin Center")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /security/i,
      })
    );

    expect(
      screen.getByText(/Security & Compliance Center/i)
    ).toBeInTheDocument();
  });

  test("calls admin stats api with auth token", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(mockUser.getIdToken).toHaveBeenCalled();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/stats",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer mock-token",
        },
      })
    );
  });
});
