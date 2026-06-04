import { renderHook, waitFor } from "@testing-library/react";
import { useAttendance } from "../useAttendance";
import { apiFetch } from "@/lib/apiClient";
import { getUserActivities } from "@/services/activityService";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/services/activityService", () => ({
  getUserActivities: vi.fn(),
}));

vi.mock("@/lib/firebaseConfig", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

describe("useAttendance API payload handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserActivities.mockResolvedValue([]);
  });

  it("loads student gamification data from apiFetch's parsed success envelope", async () => {
    const gamificationData = {
      currentStreak: 5,
      totalXp: 1200,
      currentLevel: 4,
      xpToNextLevel: 1800,
      unlockedBadges: ["first-attendance"],
      lastAttendanceDate: "2026-05-31",
    };
    const user = {
      uid: "student-1",
      getIdToken: vi.fn().mockResolvedValue("student-token"),
    };

    apiFetch.mockResolvedValueOnce({
      success: true,
      data: gamificationData,
      meta: {},
    });

    const { result } = renderHook(() =>
      useAttendance({ role: "student", user })
    );

    await waitFor(() => {
      expect(result.current.gamificationData).toEqual(gamificationData);
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/student/gamification",
      expect.objectContaining({
        headers: { Authorization: "Bearer student-token" },
        signal: expect.any(Object),
      })
    );
  });

  it("loads institute dashboard data from apiFetch's parsed JSON payload", async () => {
    const statsPayload = {
      dashboardData: {
        totalStudents: 42,
        totalTeachers: 6,
        totalClasses: 8,
        todayAttendance: 87.5,
        activeClasses: 4,
        pendingRequests: 3,
      },
      classes: [{ id: "class-1", name: "Physics" }],
      teachers: [{ id: "teacher-1", name: "Ada Lovelace" }],
      attendanceRequests: [{ id: "request-1", status: "pending" }],
    };
    const user = {
      uid: "institute-1",
      getIdToken: vi.fn().mockResolvedValue("institute-token"),
    };

    apiFetch.mockResolvedValueOnce(statsPayload);

    const { result } = renderHook(() =>
      useAttendance({ role: "institute", user })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.dashboardData).toEqual(statsPayload.dashboardData);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.classes).toEqual(statsPayload.classes);
    expect(result.current.teachers).toEqual(statsPayload.teachers);
    expect(result.current.attendanceRequests).toEqual(
      statsPayload.attendanceRequests
    );
    expect(apiFetch).toHaveBeenCalledWith("/api/institute/stats", {
      headers: { Authorization: "Bearer institute-token" },
    });
  });
});
