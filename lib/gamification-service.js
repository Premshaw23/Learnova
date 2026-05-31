import { connectDb } from "@/lib/mongodb";
import {
  calculateLevel,
  calculateNextLevelXp,
  calculateUnlockedBadges,
} from "@/utils/gamification";
import { getAdminDb } from "@/lib/firebase-admin";

/** XP values awarded for each action type. */
const XP_VALUES = {
  attendance_marked: 25,
  streak_continued: 10,
  early_bird: 50,
  course_completed: 100,
  quiz_passed: 75,
  streak_milestone_7: 100,
  streak_milestone_30: 500,
  focus_session_completed: 50,
};

/** Hour threshold (24h format) — attendance before this counts as early bird. */
const EARLY_BIRD_HOUR = 8;

/** Streak milestones that trigger bonus XP awards. */
const STREAK_MILESTONES = [
  { days: 7, actionType: "streak_milestone_7" },
  { days: 30, actionType: "streak_milestone_30" },
];

/**
 * Calculates the difference in calendar days between two dates.
 * Uses UTC to avoid timezone drift issues.
 * @param {Date} dateA - The earlier date.
 * @param {Date} dateB - The later date.
 * @returns {number} Number of calendar days between the two dates.
 */
function daysBetween(dateA, dateB) {
  const a = new Date(Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()));
  const b = new Date(Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()));
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Processes streak logic when attendance is marked.
 * Calculates whether the streak continues, resets, or stays the same.
 * @param {Object} student - The student's MongoDB document.
 * @param {Date} now - The current timestamp.
 * @returns {{ currentStreak: number, streakContinued: boolean, milestones: string[] }}
 */
function processStreak(student, now) {
  const lastDate = student.lastAttendanceDate
    ? new Date(student.lastAttendanceDate)
    : null;
  const previousStreak = student.currentStreak || 0;
  const milestones = [];

  let currentStreak;
  let streakContinued = false;

  if (!lastDate) {
    currentStreak = 1;
  } else {
    const diff = daysBetween(lastDate, now);
    if (diff === 0) {
      currentStreak = previousStreak;
    } else if (diff === 1) {
      currentStreak = previousStreak + 1;
      streakContinued = true;
    } else {
      currentStreak = 1;
    }
  }

  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.days && previousStreak < milestone.days) {
      milestones.push(milestone.actionType);
    }
  }

  return { currentStreak, streakContinued, milestones };
}

/**
 * Awards XP to a student for a given action type.
 * Handles streak tracking, early bird detection, milestone bonuses,
 * badge unlocking, and level calculation. Persists all updates to MongoDB.
 *
 * @param {string} firebaseUid - The student's Firebase UID.
 * @param {string} actionType - One of the keys in XP_VALUES.
 * @param {Object} [metadata={}] - Optional context (e.g. { attendanceHour }).
 * @returns {Promise<Object>} Award result with xpAwarded, totalXp, level info, badges, streak.
 * @throws {Error} If the student is not found or the action type is invalid.
 */
export async function awardXp(firebaseUid, actionType, metadata = {}) {
  if (!XP_VALUES[actionType]) {
    throw new Error(`Invalid action type: ${actionType}`);
  }

  const db = await connectDb();

  const MAX_RETRIES = 5;
  let attempt = 0;
  let cachedAttendanceHistory = null;

  while (attempt < MAX_RETRIES) {
    attempt++;

    let student = await db.collection("users").findOne({ firebaseUid });
    if (!student) {
      const now = new Date().toISOString();
      await db.collection("users").insertOne({
        firebaseUid,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        currentStreak: 0,
        unlockedBadges: [],
        attendanceHistory: [],
        createdAt: now,
      });
      student = await db.collection("users").findOne({ firebaseUid });
      if (!student) {
        throw new Error("Failed to create user document for gamification");
      }
    }

    // Fetch true attendance history from Firestore for accurate early bird & gamification analysis
    let attendanceHistory = student.attendanceHistory || [];
    if (actionType === "attendance_marked") {
      if (cachedAttendanceHistory !== null) {
        attendanceHistory = cachedAttendanceHistory;
      } else {
        try {
          const firestoreDb = getAdminDb();
          const snapshot = await firestoreDb
            .collection("attendance_records")
            .where("userId", "==", firebaseUid)
            .get();

          attendanceHistory = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
            const timeZone = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata";
            let timeString;
            try {
              const formatter = new Intl.DateTimeFormat("en-GB", {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              timeString = formatter.format(dateObj);
            } catch (_) {
              const pad = (num) => String(num).padStart(2, "0");
              timeString = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
            }

            attendanceHistory.push({
              date: data.date || dateObj.toISOString().slice(0, 10),
              time: timeString,
            });
          });
          cachedAttendanceHistory = attendanceHistory;
        } catch (error) {
          console.error("Failed to sync attendance history from Firestore:", error);
          attendanceHistory = student.attendanceHistory || [];
        }
      }
    }

    const now = new Date();
    let totalXp = student.totalXp || 0;
    let currentStreak = student.currentStreak || 0;
    const previousLevel = student.currentLevel || calculateLevel(totalXp);
    const previousBadges = student.unlockedBadges || [];

    let xpAwarded = XP_VALUES[actionType];
    let earlyBird = false;
    let streakMilestones = [];

    if (actionType === "attendance_marked") {
      const streakResult = processStreak(student, now);
      currentStreak = streakResult.currentStreak;

      if (streakResult.streakContinued) {
        xpAwarded += XP_VALUES.streak_continued;
      }

      for (const milestoneAction of streakResult.milestones) {
        xpAwarded += XP_VALUES[milestoneAction];
        streakMilestones.push(milestoneAction);
      }

      const hour = metadata.attendanceHour ?? now.getHours();
      if (hour < EARLY_BIRD_HOUR) {
        xpAwarded += XP_VALUES.early_bird;
        earlyBird = true;
      }
    }

    totalXp += xpAwarded;

    const currentLevel = calculateLevel(totalXp);
    const xpToNextLevel = calculateNextLevelXp(currentLevel);
    const levelUp = currentLevel > previousLevel;

    const studentData = {
      currentStreak,
      currentLevel,
      totalXp,
      attendanceHistory,
    };

    const newlyUnlocked = calculateUnlockedBadges(studentData);
    const newBadges = newlyUnlocked.filter((id) => !previousBadges.includes(id));
    const unlockedBadges = [...new Set([...previousBadges, ...newlyUnlocked])];

    const currentVersion = student.version || 0;

    const updateFields = {
      totalXp,
      currentLevel,
      xpToNextLevel,
      unlockedBadges,
      lastXpAward: now.toISOString(),
      attendanceHistory, // Keep MongoDB synchronized
      version: currentVersion + 1,
    };

    if (actionType === "attendance_marked") {
      updateFields.currentStreak = currentStreak;
      updateFields.lastAttendanceDate = now.toISOString();
    }

    const updateResult = await db.collection("users").updateOne(
      {
        firebaseUid,
        $or: [
          { version: currentVersion },
          { version: { $exists: false } }
        ]
      },
      { $set: updateFields }
    );

    if (updateResult.matchedCount > 0) {
      return {
        xpAwarded,
        totalXp,
        currentLevel,
        xpToNextLevel,
        levelUp,
        newBadges,
        currentStreak,
        earlyBird,
        streakMilestones,
      };
    }

    console.warn(`[awardXp] Concurrency collision detected for user ${firebaseUid} on attempt ${attempt}. Retrying...`);
    // Add brief jitter delay before retry to allow other concurrent process to complete
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));
  }

  throw new Error(`Failed to award XP for user ${firebaseUid} after ${MAX_RETRIES} concurrent retry attempts.`);
}

/** Exported for use in the award API route's Zod validation. */
export { XP_VALUES };
