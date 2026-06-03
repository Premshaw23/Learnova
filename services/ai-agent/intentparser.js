// services/ai-agent/intentMatcher.js

/**
 * Clean, dependency-free pattern matcher.
 * Safely parsed by both Client and Server environments.
 */
export function matchUserIntent(prompt, context = {}) {
  if (!prompt || typeof prompt !== "string") {
    return { matched: false };
  }

  const lower = prompt.toLowerCase().trim();

  // 1. FETCH LOW ATTENDANCE PATTERN
  if (
    lower.includes("attendance") &&
    (lower.includes("under") ||
      lower.includes("below") ||
      lower.includes("less"))
  ) {
    const numberMatch = prompt.match(/\b\d+/);
    const parsedThreshold = numberMatch ? parseInt(numberMatch[0], 10) : 75;
    const args = { threshold: parsedThreshold };
    if (context.instituteId) {
      args.instituteId = context.instituteId;
    }
    return {
      matched: true,
      tool: "fetch_low_attendance_students",
      args,
    };
  }

  // 2. CHECK ROOM AVAILABILITY PATTERN
  if (
    lower.includes("room") ||
    lower.includes("lab") ||
    lower.includes("available") ||
    lower.includes("free")
  ) {
    const roomMatch = prompt.match(/([a-zA-Z]+-\d+|\b\d{3}\b)/i);
    if (roomMatch) {
      const targetRoom = roomMatch[0].toUpperCase();
      const dateMatch = prompt.match(/\d{4}-\d{2}-\d{2}/);
      const targetDate = dateMatch
        ? dateMatch[0]
        : new Date().toISOString().split("T")[0];
      return {
        matched: true,
        tool: "check_room_availability",
        args: { roomId: targetRoom, date: targetDate },
      };
    }
  }

  // 3. TRIGGER STUDENT ALERT PATTERN
  if (
    lower.includes("alert") ||
    lower.includes("warn") ||
    lower.includes("notify")
  ) {
    const idMatches = prompt.match(/(STU-?\d+|\b\d{4}\b)/gi) || [];
    const targetStudentIds =
      idMatches.length > 0
        ? idMatches.map((id) => id.toUpperCase())
        : ["STU-2049"];
    const messageQuoteMatch = prompt.match(/"([^"]+)"/);
    const alertPayloadMessage = messageQuoteMatch
      ? messageQuoteMatch[1]
      : "Urgent academic alert: Please review your profile panel notifications link.";
    return {
      matched: true,
      tool: "trigger_student_alert",
      args: { studentIds: targetStudentIds, message: alertPayloadMessage },
    };
  }

  return { matched: false };
}

export async function parseUserIntent(prompt, context = {}) {
  const match = matchUserIntent(prompt, context);
  if (!match.matched) {
    return JSON.stringify({
      status: "error",
      error: "Could not parse user intent",
    });
  }
  const result = {
    status: "success",
    tool: match.tool,
    data: match.args,
  };

  if (match.tool === "check_room_availability") {
    result.roomId = match.args.roomId;
    result.date = match.args.date;
  } else if (match.tool === "trigger_student_alert") {
    result.notifiedCount = match.args.studentIds
      ? match.args.studentIds.length
      : 0;
  }

  return JSON.stringify(result);
}
