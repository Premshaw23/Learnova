/**
 * Generates dynamic motivational reminder cards based on real user dashboard data
 * All data must come from actual user activity, NOT hardcoded or mock values
 */

export const generateMotivationalReminders = ({
  attendancePercentage = 0,
  streakDays = 0,
  recentActivityCount = 0,
  profileCompletion = 0,
  pendingRequests = 0,
  hasUpcomingClass = false,
  role = "student",
  missedAttendance = 0,
  presentCount = 0,
  totalAttendanceRecords = 0,
  currentLevel = 1,
  unlockedBadgesCount = 0,
} = {}) => {
  const cards = [];
  const attendanceScore = Number(attendancePercentage) || 0;

  // CONDITION 1: Check attendance performance with real data
  if (attendanceScore >= 90 && streakDays >= 5) {
    cards.push({
      id: "attendance-strong",
      tone: "positive",
      title: "🏆 Great attendance consistency",
      description: `Your attendance is at ${attendanceScore}% and your streak is ${streakDays} days. Keep that momentum going!`,
      metric: `${attendanceScore}% + ${streakDays} day streak`,
    });
  } else if (attendanceScore >= 80 && attendanceScore < 90) {
    cards.push({
      id: "attendance-solid",
      tone: "positive",
      title: "🔥 Keep your streak alive",
      description: `Attendance is ${attendanceScore}%. A little focus today keeps your progress on track.`,
      metric: `${attendanceScore}% current`,
    });
  } else if (attendanceScore >= 75 && attendanceScore < 80) {
    cards.push({
      id: "attendance-warning",
      tone: "warning",
      title: "📌 Maintain your attendance pace",
      description: `Your attendance is ${attendanceScore}%. Stay consistent to keep your record strong.`,
      metric: `${attendanceScore}% current`,
    });
  } else if (attendanceScore > 0 && attendanceScore < 75) {
    cards.push({
      id: "attendance-risk",
      tone: "alert",
      title: "🔥 Your attendance streak is at risk",
      description: `Only ${attendanceScore}% attendance so far. Re-engage today to protect your record.`,
      metric: `${attendanceScore}% - needs improvement`,
    });
  }

  // CONDITION 2: Missed attendance detection from real data
  if (missedAttendance > 0) {
    const alertTone = missedAttendance > 1 ? "alert" : "warning";
    cards.push({
      id: "missed-attendance",
      tone: alertTone,
      title: "📌 Missed attendance detected",
      description: `There ${missedAttendance === 1 ? "is" : "are"} ${missedAttendance} ${
        missedAttendance === 1 ? "absence" : "absences"
      } in recent activity. Stay consistent this week.`,
      metric: `${missedAttendance} missed`,
    });
  }

  // CONDITION 3: Profile completion status
  if (profileCompletion < 100 && profileCompletion >= 80) {
    cards.push({
      id: "profile-completion",
      tone: "warning",
      title: "📝 Complete your profile setup",
      description: `Your profile is ${profileCompletion}% complete. A full profile helps the system personalize your progress.`,
      metric: `${profileCompletion}% done`,
    });
  }

  // CONDITION 4: Low participation detection from real activity data
  if (recentActivityCount < 3 && recentActivityCount > 0) {
    cards.push({
      id: "activity-nudge",
      tone: "warning",
      title: "🚀 Participate in activities this week",
      description: `Only ${recentActivityCount} recent activit${recentActivityCount === 1 ? "y" : "ies"} found. Add more sessions to stay active and engaged.`,
      metric: `${recentActivityCount} activities`,
    });
  }

  // CONDITION 5: Streak encouragement with real data
  if (streakDays >= 3 && attendanceScore >= 70) {
    cards.push({
      id: "streak-encouragement",
      tone: "positive",
      title: "🎯 Keep your learning streak alive",
      description: `You have a ${streakDays}-day streak. A small win today keeps the streak growing.`,
      metric: `${streakDays} day streak`,
    });
  }

  // CONDITION 6: Pending requests/notices
  if (pendingRequests > 0) {
    cards.push({
      id: "pending-attention",
      tone: "neutral",
      title: "📢 Check newly added notices",
      description: `There ${pendingRequests === 1 ? "is" : "are"} ${pendingRequests} pending update${
        pendingRequests === 1 ? "" : "s"
      } or request${pendingRequests === 1 ? "" : "s"} awaiting review. Stay on top of them.`,
      metric: `${pendingRequests} pending`,
    });
  }

  // CONDITION 7: No upcoming class encouragement
  if (!hasUpcomingClass && role === "student") {
    cards.push({
      id: "class-nudge",
      tone: "neutral",
      title: "🔔 No upcoming classes yet",
      description: "Plan your next learning session and keep the momentum going even between classes.",
      metric: "Free time to prepare",
    });
  }

  // CONDITION 8: Gamification achievement milestone
  if (currentLevel >= 5 && unlockedBadgesCount > 0) {
    cards.push({
      id: "achievement-milestone",
      tone: "positive",
      title: "⭐ You're reaching milestones",
      description: `You've unlocked ${unlockedBadgesCount} badge${unlockedBadgesCount === 1 ? "" : "s"} and reached Level ${currentLevel}. Impressive progress!`,
      metric: `Level ${currentLevel} + ${unlockedBadgesCount} badges`,
    });
  }

  // CONDITION 9: Early bird achievement
  if (presentCount > 0 && totalAttendanceRecords > 0) {
    const presentPercentage = Math.round(
      (presentCount / totalAttendanceRecords) * 100
    );
    if (presentPercentage > 80) {
      cards.push({
        id: "consistency-champion",
        tone: "positive",
        title: "✨ You're a consistency champion",
        description: `${presentPercentage}% of your attendance is on-time. Your discipline is inspiring!`,
        metric: `${presentPercentage}% on-time`,
      });
    }
  }

  // CONDITION 10: Default positive message if no conditions triggered
  if (cards.length === 0) {
    cards.push({
      id: "default",
      tone: "positive",
      title: "🏆 Keep up the great work",
      description: "Your dashboard looks healthy. Continue the good habits and stay consistent.",
      metric: "All systems go",
    });
  }

  // Return max 4 most relevant cards (prioritize alerts, then warnings, then positive)
  return cards
    .sort((a, b) => {
      const toneOrder = { alert: 0, warning: 1, neutral: 2, positive: 3 };
      return toneOrder[a.tone] - toneOrder[b.tone];
    })
    .slice(0, 4);
};
