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
    db.collection().findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
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
});
