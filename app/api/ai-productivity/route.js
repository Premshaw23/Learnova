import { jsonSuccess, jsonError } from "@/lib/api-response";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { callGroq } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const analytics = await parseJSON(request);

  const {
    totalFocusMinutes = 0,
    averageSessionDuration = 0,
    completedFocusSessions = 0,
    focusStreak = 0,
    consistencyScore = 0,
    peakFocusHours = "Unknown",
  } = analytics;

  if (
  totalFocusMinutes === 0 &&
  completedFocusSessions === 0
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

Total Focus Time: ${totalFocusMinutes} minutes
Average Session Duration: ${averageSessionDuration} minutes
Completed Focus Sessions: ${completedFocusSessions}
Focus Streak: ${focusStreak} days
Consistency Score: ${consistencyScore}%
Peak Focus Hours: ${peakFocusHours}

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