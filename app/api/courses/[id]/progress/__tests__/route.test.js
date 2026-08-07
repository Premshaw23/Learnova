import { describe, expect, it, vi, beforeEach } from "vitest";
import { PATCH, GET } from "../route";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { awardXp } from "@/lib/gamification-service";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/gamification-service", () => ({
  awardXp: vi.fn(),
}));

function createMockRequest(body) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: { get: vi.fn().mockReturnValue(null) },
  };
}

describe("PATCH /api/courses/[id]/progress", () => {
  let findOne;
  let updateOne;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });
    awardXp.mockResolvedValue({ xpAwarded: 100 });

    findOne = vi.fn().mockResolvedValue(null);
    updateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });

    db = {
      collection: vi.fn((name) => {
        if (name === "course_progress") {
          return { findOne, updateOne };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    connectDb.mockResolvedValue(db);
  });

  it("persists completedLessons/completionPercentage and awards course_completed XP exactly once at 100%", async () => {
    const req = createMockRequest({
      completedLessons: { "Lesson 1": true, "Lesson 2": true },
      completionPercentage: 100,
    });

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completed).toBe(true);
    expect(body.xpAwarded).toBe(100);
    expect(awardXp).toHaveBeenCalledWith(
      "user-123",
      "course_completed",
      expect.objectContaining({ courseId: "course-1" })
    );
    expect(updateOne).toHaveBeenCalledWith(
      { firebaseUid: "user-123", courseId: "course-1" },
      expect.objectContaining({
        $set: expect.objectContaining({
          completed: true,
          completionPercentage: 100,
        }),
      }),
      { upsert: true }
    );
  });

  it("does not re-award XP if the course was already marked completed", async () => {
    findOne.mockResolvedValue({
      firebaseUid: "user-123",
      courseId: "course-1",
      completed: true,
      completionDate: "January 1, 2026",
    });

    const req = createMockRequest({
      completedLessons: { "Lesson 1": true, "Lesson 2": true },
      completionPercentage: 100,
    });

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.xpAwarded).toBe(0);
    expect(awardXp).not.toHaveBeenCalled();
  });

  it("does not award XP when completion percentage is below 100", async () => {
    const req = createMockRequest({
      completedLessons: { "Lesson 1": true },
      completionPercentage: 50,
    });

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completed).toBe(false);
    expect(body.xpAwarded).toBe(0);
    expect(awardXp).not.toHaveBeenCalled();
  });
});

describe("GET /api/courses/[id]/progress", () => {
  let findOne;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });

    db = {
      collection: vi.fn((name) => {
        if (name === "course_progress") {
          return { findOne };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    connectDb.mockResolvedValue(db);
  });

  it("returns the persisted completion record for the authenticated user", async () => {
    findOne = vi.fn().mockResolvedValue({
      completedLessons: { "Lesson 1": true },
      completionPercentage: 100,
      completed: true,
      completionDate: "January 1, 2026",
    });
    db.collection = vi.fn(() => ({ findOne }));
    connectDb.mockResolvedValue(db);

    const req = createMockRequest();
    const response = await GET(req, {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      completedLessons: { "Lesson 1": true },
      completionPercentage: 100,
      completed: true,
      completionDate: "January 1, 2026",
    });
  });

  it("returns an empty/zeroed record when no server-side progress exists yet (clean browser profile)", async () => {
    findOne = vi.fn().mockResolvedValue(null);
    db.collection = vi.fn(() => ({ findOne }));
    connectDb.mockResolvedValue(db);

    const req = createMockRequest();
    const response = await GET(req, {
      params: Promise.resolve({ id: "course-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      completedLessons: {},
      completionPercentage: 0,
      completed: false,
      completionDate: "",
    });
  });
});