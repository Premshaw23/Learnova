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
    const response = await fetch("/api/activities");
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
