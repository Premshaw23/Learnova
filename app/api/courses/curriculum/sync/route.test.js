import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireRole, requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
  parseJSON: vi.fn(async (req) => {
    const raw = await req.text();
    return JSON.parse(raw);
  }),
}));

vi.mock("@/lib/api-response", () => ({
  jsonSuccess: (data) => ({
    status: 200,
    json: async () => ({ success: true, ...data }),
  }),
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

  const createMockRequest = (body) => ({
    headers: new Headers({ "content-type": "application/json" }),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  });

  test("syncs curriculum successfully when MONGODB_URI is set", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue(null);

    const req = createMockRequest({
      courseId: "course-101",
      modules: [{ id: "mod-1", title: "Module 1", lessons: [] }],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.persisted).toBe(true);
  });

  test("returns 403 Forbidden if a non-creator teacher tries to update curriculum", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-other", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-other", role: "teacher" });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue({ ownerId: "teacher-original" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [{ title: "Module 1" }],
    });

    await expect(POST(req)).rejects.toThrow("You do not own this course curriculum");
  });

  test("allows admin to sync any curriculum even if they are not the creator", async () => {
    process.env.MONGODB_URI = "mongodb://mock-uri";
    requireRole.mockResolvedValue({
      payload: { uid: "admin-1", role: "admin" },
      profile: { role: "admin" },
    });
    requireAuth.mockResolvedValue({ uid: "admin-1", role: "admin" });

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

  test("returns persisted: false when MONGODB_URI is not set (demo mode)", async () => {
    delete process.env.MONGODB_URI;
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.persisted).toBe(false);
  });

  test("rejects missing courseId with validation error", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const req = createMockRequest({ modules: [] });

    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects module with missing title", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [{ id: "mod-1" }],
    });

    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects null module entry", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [null],
    });

    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects extra fields via strict schema", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher" },
    });
    requireAuth.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const req = createMockRequest({
      courseId: "course-101",
      modules: [],
      injected: "payload",
    });

    await expect(POST(req)).rejects.toThrow();
  });
});
