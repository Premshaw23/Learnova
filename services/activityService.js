import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export const logActivity = async (userId, activityData) => {
  if (!userId) return;
  try {
    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: activityData.title,
        type: activityData.type,
        progress: activityData.progress,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to log activity");
    }
    const data = await response.json();
    return data.data?.id;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

export const getUserActivities = async (userId) => {
  if (!userId) return [];
  try {
    const response = await fetch(`/api/activities?userId=${userId}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to get activities");
    }
    const data = await response.json();
    return data.data?.activities || [];
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
};

/**
 * Flexible activity record used by the heatmap.
 * @typedef {{ date: string; count: number }} ActivityRecord
 */

/**
 * Fetches aggregated activity counts grouped by day.
 * @param {string} userId
 * @returns {Promise<ActivityRecord[]>}
 */
export const getUserActivity = async (userId) => {
  if (!userId) return [];

  const rawActivities = await getUserActivities(userId);

  const grouped = rawActivities.reduce((acc, item) => {
    const timestamp =
      item.timestamp instanceof Date
        ? item.timestamp
        : new Date(item.timestamp);

    if (Number.isNaN(timestamp.getTime())) {
      return acc;
    }

    const dateKey = timestamp.toISOString().slice(0, 10);

    acc[dateKey] = (acc[dateKey] || 0) + 1;

    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Removes an activity by ID (used for optimistic rollback or explicit deletion).
 * @param {string} activityId - The ID of the document to delete
 */
export const removeActivity = async (activityId) => {
  if (!activityId) return;
  try {
    const response = await fetch(`/api/activities?id=${activityId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to remove activity");
    }
  } catch (error) {
    console.error("Error removing activity:", error);
    throw error;
  }
};

export const updateActivityProgress = async (activityId, progress) => {
  if (!activityId) return;
  try {
    const docRef = doc(db, "activities", activityId);
    await updateDoc(docRef, { progress });
  } catch (error) {
    console.error("Error updating activity progress:", error);
    throw error;
  }
};

/**
 * Deterministic pseudo-random number generator based on a string seed
 */
const getDeterministicRandom = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

/**
 * Gets student activity. Attempts to retrieve real activities from Firestore via
 * getUserActivity. If no real data is found, falls back to seeding a realistic
 * 365-day mock data set.
 */
export const getStudentActivity = async (studentId) => {
  if (!studentId) return [];

  try {
    const realActivities = await getUserActivity(studentId);
    if (realActivities && realActivities.length > 0) {
      return realActivities;
    }
  } catch (error) {
    console.warn(
      "Failed to fetch real student activity, using mock fallback:",
      error
    );
  }

  // Fallback to deterministic mock data
  const mockActivities = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = getLocalDateString(date);
    const seed = `${studentId}-${dateString}`;

    // Force active state for the last 3 days to guarantee a streak presentation
    if (i <= 2) {
      const countRand = getDeterministicRandom(seed + "-count");
      const count = Math.floor(countRand * 3) + 1; // 1 to 3
      mockActivities.push({
        date: dateString,
        count,
      });
      continue;
    }

    const rand = getDeterministicRandom(seed);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const probability = isWeekend ? 0.25 : 0.65;

    if (rand < probability) {
      const countRand = getDeterministicRandom(seed + "-count");
      let count = 1;
      if (countRand < 0.45) {
        count = 1;
      } else if (countRand < 0.8) {
        count = Math.floor(getDeterministicRandom(seed + "-count2") * 2) + 2; // 2 or 3
      } else if (countRand < 0.95) {
        count = Math.floor(getDeterministicRandom(seed + "-count2") * 2) + 4; // 4 or 5
      } else {
        count = Math.floor(getDeterministicRandom(seed + "-count2") * 3) + 6; // 6+
      }

      mockActivities.push({
        date: dateString,
        count,
      });
    }
  }

  return mockActivities.sort((a, b) => a.date.localeCompare(b.date));
};
