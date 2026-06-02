
const STORAGE_KEY = "learnova_recent_activity";

export function getRecentActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("getRecentActivities error", e);
    return [];
  }
}

export function addRecentActivity(activity, limit = 10) {
  try {
    if (!activity || !activity.id) return getRecentActivities();
    const list = getRecentActivities();
    const newEntry = {
      ...activity,
      timestamp: activity.timestamp || Date.now(),
    };

    // Prevent duplicate consecutive entries (same id and path)
    const last = list[0];
    if (last && last.id === newEntry.id && last.path === newEntry.path) {
      return list;
    }

    const updated = [newEntry, ...list].slice(0, limit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("addRecentActivity error", e);
    return [];
  }
}

export function clearRecentActivities() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("clearRecentActivities error", e);
  }
}

export default {
  getRecentActivities,
  addRecentActivity,
  clearRecentActivities,
};
