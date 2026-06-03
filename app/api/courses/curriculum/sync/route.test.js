import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireRole } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockFindOne = vi.fn();
  const mockUpdateOne = vi.fn().mockResolvedValue({});
  const mockCollection = vi.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
  }));
  const mockDb = {
    collection: mockCollection,
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("POST /api/courses/curriculum/sync", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    const db = await connectDb();
    db.collection().findOne.mockReset();
    db.collection().updateOne.mockReset();
    db.collection().updateOne.mockResolvedValue({});
  });

  const createMockRequest = (body) => {
    return {
      json: async () => body,
    };
  };

  test("syncs curriculum successfully when MONGODB_URI is set", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue(null); // No existing curriculum (creator is current user)

    const req = createMockRequest({
      courseId: "course-101",
      modules: [{ id: "mod-1", title: "Module 1", lessons: [] }],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.persisted).toBe(true);
    expect(body.message).toContain("synced atomically");
  });

  test("returns 500 error when MONGODB_URI is set but database write fails", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue(null);
    db.collection().updateOne.mockRejectedValue(new Error("Database connection timeout"));

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Database connection timeout");
  });

  test("returns 403 Forbidden if a non-creator teacher tries to update curriculum", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-other", role: "teacher" },
      profile: { role: "teacher" },
    });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue({ ownerId: "teacher-original" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain("You do not own this course curriculum");
  });

  test("allows admin to sync any curriculum even if they are not the creator", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "admin-1", role: "admin" },
      profile: { role: "admin" },
    });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.persisted).toBe(true);
  });

  test("returns success: true and persisted: false when MONGODB_URI is not set (demo mode)", async () => {
    delete process.env.MONGODB_URI;
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.persisted).toBe(false);
    expect(body.message).toContain("cached successfully (Demo fallback mode active)");
  });
});
