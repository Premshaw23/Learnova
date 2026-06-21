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
