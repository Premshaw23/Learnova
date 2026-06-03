import { jsonSuccess, jsonError } from "@/lib/api-response";
import {
  authenticateRequest,
  parseJSON,
  withErrorHandler,
} from "@/lib/error-handler";
import { callGroq } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 10;

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const rateLimitResult = await checkRateLimit(decodedToken.uid);

  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const analytics = await parseJSON(request, MAX_BODY_BYTES);

  const {
    totalFocusMinutes = 0,
    averageSessionDuration = 0,
    completedFocusSessions = 0,
    focusStreak = 0,
    consistencyScore = 0,
    peakFocusHours = "Unknown",
  } = analytics;

  if (totalFocusMinutes === 0 && completedFocusSessions === 0) {
    return jsonSuccess({
      strength:
        "You have successfully started using the productivity dashboard.",
      improvement:
        "Complete your first focus session to unlock deeper insights.",
      recommendation:
        "Try a 25-minute focus session today to begin building consistency.",
      weeklyGoal: "Complete at least 5 focus sessions this week.",
      focusPattern: "Not enough productivity data is available yet.",
      nextAction: "Start your first focus session today.",
      productivityScore: 10,
    });
  }

  const prompt = `
You are an expert productivity coach and study mentor.

Analyze the following productivity metrics:

Total Focus Time: ${totalFocusMinutes} minutes
Average Session Duration: ${averageSessionDuration} minutes
Completed Focus Sessions: ${completedFocusSessions}
Focus Streak: ${focusStreak} days
Consistency Score: ${consistencyScore}%
Peak Focus Hours: ${peakFocusHours}

Provide detailed productivity insights.

Return ONLY valid JSON.

Format:

{
"strength": "one concise strength",
"improvement": "one concise improvement area",
"recommendation": "one actionable recommendation",
"weeklyGoal": "specific measurable goal for next 7 days",
"focusPattern": "analysis of focus behavior",
"nextAction": "immediate next step user should take",
"productivityScore": 0
}

Rules:

* productivityScore must be between 0 and 100
* weeklyGoal must be measurable and actionable
* focusPattern should be concise
* nextAction should be a single clear action
* Return valid JSON only
* No markdown
* No explanations
* No code blocks
  `;

  const aiResponse = await callGroq(prompt);

  let insights;

  try {
    insights = JSON.parse(aiResponse);
  } catch {
    return jsonError("AI returned an invalid response format.", 500);
  }

  return jsonSuccess(insights);
});
