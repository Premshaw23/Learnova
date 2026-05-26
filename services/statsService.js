export { getWeekdaysSince } from "@/lib/dateUtils";

export const initializeUserStats = async (userId) => {
  if (!userId) return;
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize" }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initialize stats");
    }
  } catch (error) {
    console.error("Error initializing user stats:", error);
    throw error;
  }
};

export const updateUserStat = async (userId, statField, value = 1) => {
  if (!userId) return;
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", statField, value }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update stat");
    }
  } catch (error) {
    console.error("Error updating user stat:", error);
    throw error;
  }
};

export const recalculateAttendanceRate = async (userId) => {
  if (!userId) return;
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recalculateAttendance" }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to recalculate attendance rate");
    }
    const data = await response.json();
    return data.data?.rate;
  } catch (error) {
    console.error("Error recalculating attendance rate:", error);
    throw error;
  }
};
