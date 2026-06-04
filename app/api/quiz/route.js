import { jsonSuccess, jsonError } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/error-handler";
import { AppError, ValidationError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const quizSchema = z.object({
  content: z.string().min(50, "Lesson content is too short"),
});

export async function POST(request) {
  try {
    const decodedToken =
      await authenticateRequest(request);

    const rateLimitResult =
      await checkRateLimit(decodedToken.uid);

    if (!rateLimitResult.allowed) {
      return jsonError(
        "Too many requests. Please try again later.",
        429
      );
    }

    const body = await request.json();

    const validation =
      quizSchema.safeParse(body);

    if (!validation.success) {
      const firstError =
        validation.error.issues?.[0]?.message ||
        "Invalid request payload";

      throw new ValidationError(firstError);
    }

    const lessonContent =
      validation.data.content.trim();

    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new AppError(
        "Groq API key is not configured",
        500
      );
    }

    const timeoutMs = parseInt(
      process.env.GROQ_TIMEOUT || "30000",
      10
    );

    const controller =
      new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    let response;

    try {
      response = await fetch(
        GROQ_API_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content:
                  "You generate educational quizzes in valid JSON format only.",
              },
              {
                role: "user",
                content: `
Generate a quiz from the lesson below.

Requirements:
- 5 MCQ questions
- 3 True/False questions
- Return ONLY valid JSON

Format:

{
  "questions": [
    {
      "type": "mcq",
      "question": "",
      "options": ["", "", "", ""],
      "answer": ""
    }
  ]
}

Lesson:
${lessonContent}
                `,
              },
            ],
            max_tokens: 1200,
            temperature: 0.7,
          }),
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData =
        await response
          .json()
          .catch(() => ({}));

      return jsonError(
        errorData?.error?.message ||
          "Groq API request failed",
        response.status
      );
    }

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      return jsonError(
        "AI generated an empty response",
        502
      );
    }

    let quizData;

    try {
      quizData = JSON.parse(content);
    } catch {
      return jsonError(
        "Invalid quiz response from AI",
        500
      );
    }

    return jsonSuccess(quizData);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(
        error.message,
        error.statusCode
      );
    }

    if (error instanceof ValidationError) {
      return jsonError(
        error.message,
        400
      );
    }

    if (error.name === "AbortError") {
      return jsonError(
        "Gateway Timeout: AI response took too long.",
        504
      );
    }

    console.error(
      "Quiz API route error:",
      error
    );

    return jsonError(
      "Internal server error",
      500
    );
  }
}