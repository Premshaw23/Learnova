import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
        await addDoc(collection(db, "activities"), {
            userId,
            title: activityData.title,
            type: activityData.type || "course",
            progress: activityData.progress || 0,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging activity to Firestore:", error);
    }
};