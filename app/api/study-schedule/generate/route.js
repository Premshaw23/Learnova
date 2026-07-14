import { jsonSuccess, jsonError } from "@/lib/api-response";
import { authenticateRequest, withErrorHandler } from "@/lib/error-handler";
import { callGroq } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const rateLimitResult = await checkRateLimit(`schedule_gen_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  // Use mock data to feed into the prompt until actual syllabus/deadlines endpoints are available
  const upcomingDeadlines = [
    { subject: "Mathematics", task: "Calculus Assignment", daysLeft: 3 },
    { subject: "Physics", task: "Mechanics Lab Report", daysLeft: 5 },
  ];
  
  const performanceGaps = [
    { subject: "Physics", issue: "Missed 2 recent classes" },
    { subject: "Computer Science", issue: "Low engagement in last session" }
  ];

  const prompt = `
You are an expert AI Study Coach. Generate a customized weekly study schedule for a student based on the following context:

Upcoming Deadlines:
${JSON.stringify(upcomingDeadlines, null, 2)}

Performance Gaps & Areas Needing Attention:
${JSON.stringify(performanceGaps, null, 2)}

Create a balanced 7-day study timetable (Monday to Sunday) that allocates time to meet the deadlines and catch up on the performance gaps, while ensuring the student does not burn out.

Return ONLY a valid JSON object in the exact format below, with no markdown formatting, no explanations, and no code block backticks.

Format:
{
  "weeklyGoal": "Overall focus for the week",
  "schedule": [
    {
      "day": "Monday",
      "blocks": [
        { "time": "17:00 - 18:30", "subject": "Physics", "topic": "Catch up on Mechanics", "type": "Review" },
        { "time": "19:00 - 20:30", "subject": "Mathematics", "topic": "Calculus Assignment", "type": "Homework" }
      ]
    },
    ... (continue for all 7 days)
  ]
}
`;

  const aiResponse = await callGroq(prompt);

  let scheduleData;
  try {
    // Sometimes LLMs return markdown block anyway, so strip if present
    const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    scheduleData = JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Failed to parse AI response:", aiResponse);
    return jsonError("Failed to generate schedule. Please try again.", 500);
  }

  return jsonSuccess(scheduleData);
});
