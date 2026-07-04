export { getWeekdaysSince } from "@/lib/dateUtils";

export const initializeUserStats = async (userId) => {
  if (!userId) return;

  // Stats initialization is best-effort. Failures here should not break
  // primary user flows (signup/login). Log for observability and return
  // a structured result so callers can optionally react without catching.
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize" }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const error = new Error(err.error || "Failed to initialize stats");
      console.error("Error initializing user stats:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error initializing user stats:", error);
    return { success: false, error };
  }
};

export const updateUserStat = async (userId, statField, value = 1) => {
  if (!userId) return;

  // Updating lightweight user statistics is best-effort. Log failures and
  // return a structured result instead of throwing so that UI flows are
  // not interrupted by monitoring/analytics outages.
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", statField, value }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const error = new Error(err.error || "Failed to update stat");
      console.error("Error updating user stat:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user stat:", error);
    return { success: false, error };
  }
};

export const recalculateAttendanceRate = async (userId) => {
  if (!userId) return;

  // Attendance rate recalculation is useful but non-critical. Return `null`
  // on failure so callers can continue using the existing UI behavior.
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recalculateAttendance" }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const error = new Error(err.error || "Failed to recalculate attendance rate");
      console.error("Error recalculating attendance rate:", error);
      return null;
    }

    const data = await response.json();
    return data.data?.rate ?? null;
  } catch (error) {
    console.error("Error recalculating attendance rate:", error);
    return null;
  }
};
