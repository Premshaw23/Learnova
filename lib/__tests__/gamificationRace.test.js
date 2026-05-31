import { vi } from "vitest";
import { connectDb } from "@/lib/mongodb";
import { awardXp } from "@/lib/gamification-service";

// Set a longer timeout for concurrency/integration tests
vi.setConfig({ testTimeout: 30000 });

describe("Gamification Concurrency Race Condition Test", () => {
  let db;
  const testFirebaseUid = "race-test-student-999";

  beforeAll(async () => {
    try {
      db = await connectDb();
      console.log("Connected to MongoDB successfully!");
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    }
  });

  beforeEach(async () => {
    // Reset test user document
    await db.collection("users").deleteOne({ firebaseUid: testFirebaseUid });
    await db.collection("users").insertOne({
      firebaseUid: testFirebaseUid,
      email: "racetest@example.com",
      name: "Race Test Student",
      totalXp: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      currentStreak: 0,
      unlockedBadges: [],
      attendanceHistory: [],
      createdAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    // Cleanup
    if (db) {
      await db.collection("users").deleteOne({ firebaseUid: testFirebaseUid });
    }
  });

  test("reproduces the concurrent XP overwrite race condition", async () => {
    const concurrentRequests = 5; // 5 concurrent focus sessions
    // Each focus session completed awards 50 XP (XP_VALUES.focus_session_completed)
    // Expected total XP after 5 sessions: 250 XP.

    const promises = [];
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(awardXp(testFirebaseUid, "focus_session_completed", {}));
    }

    // Run them in parallel
    const results = await Promise.all(promises);

    // Fetch the final document from the database
    const finalStudent = await db.collection("users").findOne({ firebaseUid: testFirebaseUid });

    console.log("CONCURRENCY RESULTS:");
    console.log("Individual returned totalXp values:", results.map(r => r.totalXp));
    console.log("Final database totalXp value:", finalStudent.totalXp);

    // If there is a race condition, the final totalXp in the database will be less than 250
    // (typically 50, because they all read 0, compute 50, and write 50).
    expect(finalStudent.totalXp).toBe(250);
  });

  test("handles mixed concurrent rewards aggressively without loss or corruption", async () => {
    // We will fire 5 focus sessions (50 XP each) and 5 course completions (100 XP each) in parallel
    // Expected total XP: 5 * 50 + 5 * 100 = 750 XP.
    // Starting XP is 0 (reset in beforeEach).

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(awardXp(testFirebaseUid, "focus_session_completed", {}));
      promises.push(awardXp(testFirebaseUid, "course_completed", {}));
    }

    // Fire all 10 concurrent reward updates in parallel
    const results = await Promise.all(promises);

    // Fetch the final document from the database
    const finalStudent = await db.collection("users").findOne({ firebaseUid: testFirebaseUid });

    console.log("MIXED CONCURRENCY RESULTS:");
    console.log("Final database totalXp:", finalStudent.totalXp);
    console.log("Final database currentLevel:", finalStudent.currentLevel);

    // Expected total XP: 750 XP
    expect(finalStudent.totalXp).toBe(750);

    // Verify correct level recalculation
    // Level = floor(sqrt(XP / 50)) + 1
    // floor(sqrt(750 / 50)) + 1 = floor(sqrt(15)) + 1 = 3 + 1 = 4.
    expect(finalStudent.currentLevel).toBe(4);
  });
});
