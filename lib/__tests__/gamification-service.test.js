import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockFindOne = vi.fn();
  const mockUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
  const mockCreateIndex = vi.fn();
  const mockCollection = vi.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    createIndex: vi.fn().mockResolvedValue({}),
  }));

  const mockMongoDb = {
    collection: mockCollection,
  };

  return {
    connectDb: vi.fn().mockResolvedValue(mockMongoDb),
  };
});

import { awardXp } from "../gamification-service";
import { connectDb } from "@/lib/mongodb";

describe("awardXp resiliency tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uses updateOne upsert and retries finding student if findOne initially returns null", async () => {
    const db = await connectDb();

    // First findOne returns null (no student document yet)
    // Second findOne returns the newly upserted student document
    db.collection().findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      firebaseUid: "user-resilient",
      totalXp: 10,
      currentLevel: 1,
      xpToNextLevel: 100,
      currentStreak: 0,
      unlockedBadges: [],
      attendanceHistory: [],
      version: 1,
    });

    const result = await awardXp("user-resilient", "streak_continued");

    expect(result.xpAwarded).toBe(10);
    expect(db.collection().updateOne).toHaveBeenCalledWith(
      { firebaseUid: "user-resilient" },
      expect.objectContaining({
        $setOnInsert: expect.any(Object),
      }),
      { upsert: true }
    );
  });

  test("persists gamification state using upsert when the user document disappears before the final update", async () => {
    const db = await connectDb();

    db.collection().findOne.mockResolvedValueOnce({
      firebaseUid: "user-missing",
      totalXp: 25,
      currentLevel: 1,
      xpToNextLevel: 100,
      currentStreak: 1,
      unlockedBadges: [],
      attendanceHistory: [],
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    db.collection().updateOne.mockResolvedValueOnce({ matchedCount: 0, upsertedCount: 1 });

    const result = await awardXp("user-missing", "attendance_marked", {
      attendanceHour: 9,
      attendanceDate: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.totalXp).toBeGreaterThanOrEqual(25);
    expect(db.collection().updateOne).toHaveBeenCalledWith(
      {
        firebaseUid: "user-missing",
        $or: [{ version: 1 }, { version: { $exists: false } }],
      },
      expect.objectContaining({
        $set: expect.any(Object),
        $setOnInsert: expect.any(Object),
      }),
      { upsert: true }
    );
  });
});
