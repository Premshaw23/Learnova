import { jsonSuccess, jsonError } from "@/lib/api-response";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { callGroq } from "@/lib/ai/groq";
import { requireAuth } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  await requireAuth(request);

  const analytics = await parseJSON(request);

  const {
    totalFocusMinutes = 0,
    averageSessionDuration = 0,
    completedFocusSessions = 0,
    focusStreak = 0,
    consistencyScore = 0,
    peakFocusHours = "Unknown",
  } = analytics;

  // Clamp numeric inputs to prevent prompt injection and unreasonable values
  const sanitized = {
    totalFocusMinutes: Math.min(Math.max(Number(totalFocusMinutes) || 0, 0), 100000),
    averageSessionDuration: Math.min(Math.max(Number(averageSessionDuration) || 0, 0), 1440),
    completedFocusSessions: Math.min(Math.max(Number(completedFocusSessions) || 0, 0), 10000),
    focusStreak: Math.min(Math.max(Number(focusStreak) || 0, 0), 365),
    consistencyScore: Math.min(Math.max(Number(consistencyScore) || 0, 0), 100),
    peakFocusHours: typeof peakFocusHours === "string" ? peakFocusHours.slice(0, 100) : "Unknown",
  };

  if (
  sanitized.totalFocusMinutes === 0 &&
  sanitized.completedFocusSessions === 0
) {
  return jsonSuccess({
    strength:
      "You have successfully started using the productivity dashboard.",
    improvement:
      "Complete your first focus session to unlock deeper insights.",
    recommendation:
      "Try a 25-minute focus session today to begin building consistency.",
  });
}

  const prompt = `
You are an expert productivity coach.

Analyze the following productivity metrics:

Total Focus Time: ${sanitized.totalFocusMinutes} minutes
Average Session Duration: ${sanitized.averageSessionDuration} minutes
Completed Focus Sessions: ${sanitized.completedFocusSessions}
Focus Streak: ${sanitized.focusStreak} days
Consistency Score: ${sanitized.consistencyScore}%
Peak Focus Hours: ${sanitized.peakFocusHours}

Return ONLY valid JSON.

Format:

{
  "strength": "one concise strength",
  "improvement": "one concise improvement area",
  "recommendation": "one actionable recommendation"
}

Do not include markdown.
Do not include explanations.
Do not wrap JSON in code blocks.
`;

  const aiResponse = await callGroq(prompt);

  let insights;

  try {
    insights = JSON.parse(aiResponse);
  } catch {
    return jsonError(
      "AI returned an invalid response format.",
      500
    );
  }

  return jsonSuccess(insights);
});