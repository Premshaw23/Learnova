import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getStudentAchievements } from "../student/[studentId]/route";
import { POST as createAchievement } from "../route";
import { PATCH as verifyAchievement } from "../[id]/verify/route";
import { requireRole } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/errors";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    })),
  },
}));

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return {
        status: error.statusCode || 500,
        json: async () => ({ error: error.message }),
      };
    }
  },
  parseJSON: vi.fn().mockResolvedValue({
    studentId: "student-1",
    title: "Math Olympiad",
    description: "Won gold medal",
    category: "Academic",
    achievementDate: "2026-01-15",
  }),
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
  requireParent: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    role: "student",
    instituteId: "inst-1",
    fullName: "Test Student",
  }),
}));

vi.mock("@/lib/services/achievementAccess", () => ({
  assertStudentOwnership: vi.fn(),
  assertInstituteScope: vi.fn(),
  assertParentAccess: vi.fn(),
}));

vi.mock("@/lib/services/achievementNotifications", () => ({
  notifyAchievementCreated: vi.fn(),
  notifyAchievementVerified: vi.fn(),
  notifyAchievementRejected: vi.fn(),
}));

vi.mock("@/lib/models/achievementModel", () => {
  const mockAchievement = {
    achievementId: "ach-1",
    studentId: "student-1",
    studentName: "Test Student",
    title: "Math Olympiad",
    verificationStatus: "Pending",
  };
  return {
    createAchievement: vi.fn().mockResolvedValue(mockAchievement),
    listAchievements: vi.fn().mockResolvedValue([mockAchievement]),
    countAchievements: vi.fn().mockResolvedValue(1),
    getAchievementById: vi.fn().mockResolvedValue(mockAchievement),
    updateAchievement: vi.fn().mockResolvedValue({
      ...mockAchievement,
      verificationStatus: "Verified",
    }),
    buildAchievementFilter: vi.fn().mockReturnValue({ studentId: "student-1" }),
  };
});

describe("Achievements API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("student can fetch own achievements", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { instituteId: "inst-1" },
    });

    const request = { url: "http://localhost/api/achievements/student/student-1" };
    const response = await getStudentAchievements(request, {
      params: Promise.resolve({ studentId: "student-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.achievements).toHaveLength(1);
  });

  it("teacher can create achievement", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher", email: "t@test.com" },
      profile: { instituteId: "inst-1", fullName: "Teacher" },
    });

    const request = {
      headers: { get: () => "127.0.0.1" },
    };
    const response = await createAchievement(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.achievement.title).toBe("Math Olympiad");
  });

  it("parent blocked from unlinked student returns 403", async () => {
    const { assertParentAccess } = await import("@/lib/services/achievementAccess");
    assertParentAccess.mockRejectedValue(
      new ForbiddenError("Access Denied: You are not authorized to view this student's records.")
    );

    requireRole.mockResolvedValue({
      payload: { uid: "parent-1", role: "parent" },
      profile: {},
    });

    const request = { url: "http://localhost/api/achievements/student/student-2" };
    const response = await getStudentAchievements(request, {
      params: Promise.resolve({ studentId: "student-2" }),
    });

    expect(response.status).toBe(403);
  });

  it("teacher can verify achievement", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { instituteId: "inst-1", fullName: "Teacher" },
    });

    const { parseJSON } = await import("@/lib/error-handler");
    parseJSON.mockResolvedValue({ verificationStatus: "Verified", remarks: "Looks good" });

    const request = {
      headers: { get: () => "127.0.0.1" },
    };
    const response = await verifyAchievement(request, {
      params: Promise.resolve({ id: "ach-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.achievement.verificationStatus).toBe("Verified");
  });
});
