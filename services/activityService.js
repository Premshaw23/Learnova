import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";

/**
 * Logs a new user activity entry to the Firestore `activities` collection.
 * @param {string} userId - The unique ID of the user performing the activity.
 * @param {Object} activityData - Activity details.
 * @param {string} activityData.title - Human-readable title of the activity.
 * @param {string} [activityData.type='course'] - Category of the activity (e.g. 'course', 'quiz').
 * @param {number} [activityData.progress=0] - Completion progress as a percentage (0–100).
 * @returns {Promise<void>} Resolves when the activity has been written to Firestore.
 * @example
 * await logActivity('user_abc123', { title: 'Intro to React', type: 'course', progress: 50 });
 */

export const logActivity = async (userId, activityData) => {
  if (!userId) return;

  try {
    const docRef = await addDoc(collection(db, "activities"), {
      userId,
      title: activityData.title,
      type: activityData.type || "course",
      progress: activityData.progress || 0,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

/**
 * Fetches all logged activities for a specific user.
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of activities
 */
export const getUserActivities = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
};

/**
 * Removes an activity by ID (used for optimistic rollback or explicit deletion).
 * @param {string} activityId - The ID of the document to delete
 */
export const removeActivity = async (activityId) => {
  if (!activityId) return;
  try {
    await deleteDoc(doc(db, "activities", activityId));
  } catch (error) {
    console.error("Error removing activity:", error);
    throw error;
  }
};
