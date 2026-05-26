import { db } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getCountFromServer,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export function getWeekdaysSince(startDate) {
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = new Date();
  let weekdays = 0;

  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekday >= 1 && weekday <= 5) {
      weekdays += 1;
    }
  }

  return Math.max(weekdays, 1);
}

/**
 * Initializes a new user's statistics document in Firestore with default zero values.
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<void>} Resolves when the stats document has been written.
 * @example
 * await initializeUserStats('user_abc123');
 * // Creates { 'Courses Enrolled': 0, 'Attendance Rate': '0%', ... } in Firestore
 */
export const initializeUserStats = async (userId) => {
  if (!userId) return;
  const statsRef = doc(db, "userStats", userId);

  const defaultStats = {
    "Courses Enrolled": 0,
    "Attendance Rate": "0%",
    "Assignments Done": 0,
    "Study Hours": 0,
    lastUpdated: new Date(),
  };

  try {
    await setDoc(statsRef, defaultStats);
  } catch (error) {
    console.error("Error initializing user stats:", error);
    throw error;
  }
};

/**
 * Increments a specific statistic field for a user in Firestore.
 * Creates the stats document first if it does not yet exist.
 * @param {string} userId - The unique ID of the user.
 * @param {string} statField - The stat field name (must match dashboard labels, e.g. 'Courses Enrolled').
 * @param {number} [value=1] - The amount to increment; can be negative to decrement.
 * @returns {Promise<void>} Resolves when the stat has been updated.
 * @example
 * await updateUserStat('user_abc123', 'Courses Enrolled', 1);
 * await updateUserStat('user_abc123', 'Study Hours', 2);
 */
export const updateUserStat = async (userId, statField, value = 1) => {
  if (!userId) return;
  const statsRef = doc(db, "userStats", userId);

  try {
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      await initializeUserStats(userId);
    }

    await updateDoc(statsRef, {
      [statField]: increment(value),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Error updating user stat:", error);
    throw error;
  }
};

/**
 * Recomputes and persists a user's attendance rate as a percentage
 * based on their attendance_records relative to total weekdays since the start of the year.
 * @param {string} userId - The Firebase Auth user ID.
 * @returns {Promise<number|undefined>} The calculated attendance percentage (0–100), or undefined on early return.
 * @throws {Error} If the Firestore update fails.
 * @example
 * const rate = await recalculateAttendanceRate('user_abc123');
 * // rate is e.g. 87
 */
export const recalculateAttendanceRate = async (userId) => {
  if (!userId || !db) {
    return;
  }

  const statsRef = doc(db, "userStats", userId);
  const attendanceQuery = query(
    collection(db, "attendance_records"),
    where("userId", "==", userId),
  );

  try {
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await initializeUserStats(userId);
    }

    const countSnapshot = await getCountFromServer(attendanceQuery);
    const presentDays = countSnapshot.data().count;

    const userSnap = await getDoc(doc(db, "users", userId));
    let startDate = new Date(new Date().getFullYear(), 0, 1);
    if (userSnap.exists() && userSnap.data().createdAt) {
      // createdAt might be a Firestore Timestamp or a string
      const createdAt = userSnap.data().createdAt;
      startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    }

    const totalDays = getWeekdaysSince(startDate);
    const rate = Math.min(100, Math.round((presentDays / totalDays) * 100));

    await updateDoc(statsRef, {
      "Attendance Rate": `${rate}%`,
      attendancePresentDays: presentDays,
      lastUpdated: new Date(),
    });

    return rate;
  } catch (error) {
    throw error;
  }
};
