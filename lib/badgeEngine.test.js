/**
 * lib/badgeEngine.test.js
 * 
 * Test utilities and examples for badge engine functions.
 * Use these to verify badge calculations work correctly.
 */

import {
  calculateConsecutiveAttendance,
  calculateEarlyBirdCount,
  calculateAttendancePercentage,
  calculateBadgeProgress,
  getNewlyUnlockedBadges,
} from "./badgeEngine";

/**
 * Generate mock attendance records for testing
 */
export function generateMockAttendanceRecords(type = "perfect") {
  const today = new Date();
  const records = [];

  switch (type) {
    case "perfect":
      // Generate 30 consecutive weekday records
      for (let i = 0; i < 40; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          records.push({
            userId: "test-user",
            date: date.toISOString().split("T")[0],
            timestamp: date.toISOString(),
            status: "present",
            confidenceScore: 0.95,
          });

          if (records.length === 30) break;
        }
      }
      break;

    case "early_bird":
      // Generate 10 early morning records
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i * 5);
        date.setHours(7, Math.random() * 59, 0); // Before 8:00 AM

        records.push({
          userId: "test-user",
          date: date.toISOString().split("T")[0],
          timestamp: date.toISOString(),
          status: "present",
          confidenceScore: 0.95,
        });
      }
      break;

    case "consistency":
      // Generate records for 95% attendance over semester
      const semesterDays = 120; // Roughly 24 weeks of weekdays
      const requiredDays = Math.ceil(semesterDays * 0.95);

      for (let i = 0; i < requiredDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        records.push({
          userId: "test-user",
          date: date.toISOString().split("T")[0],
          timestamp: date.toISOString(),
          status: "present",
          confidenceScore: 0.95,
        });
      }
      break;

    default:
      return [];
  }

  return records;
}

/**
 * Test badge calculations
 */
export function testBadgeCalculations() {
  console.log("🧪 Testing Badge Calculations\n");

  // Test 1: Perfect Attendance
  console.log("Test 1: Perfect Attendance Badge");
  const perfectRecords = generateMockAttendanceRecords("perfect");
  const perfectConsecutive = calculateConsecutiveAttendance(perfectRecords);
  console.log(`  Consecutive days: ${perfectConsecutive}`);
  console.log(`  Badge unlocked: ${perfectConsecutive >= 30 ? "✓" : "✗"}`);

  // Test 2: Early Bird
  console.log("\nTest 2: Early Bird Badge");
  const earlyRecords = generateMockAttendanceRecords("early_bird");
  const earlyCount = calculateEarlyBirdCount(earlyRecords);
  console.log(`  Early arrivals: ${earlyCount}`);
  console.log(`  Badge unlocked: ${earlyCount >= 10 ? "✓" : "✗"}`);

  // Test 3: Consistency Champion
  console.log("\nTest 3: Consistency Champion Badge");
  const consistencyRecords = generateMockAttendanceRecords("consistency");
  const percentage = calculateAttendancePercentage(consistencyRecords);
  console.log(`  Attendance %: ${percentage}%`);
  console.log(`  Badge unlocked: ${percentage >= 95 ? "✓" : "✗"}`);

  // Test 4: Overall progress
  console.log("\nTest 4: Overall Badge Progress");
  const allRecords = [...perfectRecords, ...earlyRecords, ...consistencyRecords];
  const progress = calculateBadgeProgress(allRecords);
  console.log(`  Perfect Attendance: ${progress.PERFECT_ATTENDANCE.progress}/${30}`);
  console.log(`  Early Bird: ${progress.EARLY_BIRD.progress}/${10}`);
  console.log(`  Consistency Champion: ${progress.CONSISTENCY_CHAMPION.progress}%/${100}%`);

  console.log("\n✅ All tests completed!");
}

/**
 * Run specific badge calculation test
 */
export function testSpecificBadge(badgeType) {
  const records = generateMockAttendanceRecords(badgeType);
  const progress = calculateBadgeProgress(records);

  switch (badgeType) {
    case "perfect":
      return {
        name: "Perfect Attendance",
        progress: progress.PERFECT_ATTENDANCE.progress,
        threshold: 30,
        unlocked: progress.PERFECT_ATTENDANCE.unlocked,
      };
    case "early_bird":
      return {
        name: "Early Bird",
        progress: progress.EARLY_BIRD.progress,
        threshold: 10,
        unlocked: progress.EARLY_BIRD.unlocked,
      };
    case "consistency":
      return {
        name: "Consistency Champion",
        progress: progress.CONSISTENCY_CHAMPION.progress,
        threshold: 95,
        unlocked: progress.CONSISTENCY_CHAMPION.unlocked,
      };
    default:
      return null;
  }
}

/**
 * Example usage for testing
 */
export function runAllTests() {
  try {
    testBadgeCalculations();

    // Test individual badges
    const perfectTest = testSpecificBadge("perfect");
    const earlyTest = testSpecificBadge("early_bird");
    const consistencyTest = testSpecificBadge("consistency");

    console.log("\n📊 Individual Badge Tests:");
    console.log(perfectTest);
    console.log(earlyTest);
    console.log(consistencyTest);

    return {
      perfect: perfectTest,
      earlyBird: earlyTest,
      consistency: consistencyTest,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return null;
  }
}

// Export for use in browser console or tests
if (typeof window !== "undefined") {
  window.badgeTests = {
    runAllTests,
    testBadgeCalculations,
    testSpecificBadge,
    generateMockAttendanceRecords,
  };
}
