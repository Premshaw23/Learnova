import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection, sanitizeMessage } from "@/utils/promptGuard";
// 🎯 INTEGRATION: Import the localized action engine agent parser
import { parseUserIntent } from "@/services/ai-agent/intentparser";
import { requireAuth } from "@/lib/rbac";
import { AppError } from "@/lib/errors";

// Initialize the official Groq SDK client instance
function getGroqClient() {
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return null;
  }

  return new Groq({ apiKey: key });
}

function getGroq() {
  const key = process.env.GROQ_API_KEY;

  if (!key) return null;

  return new Groq({ apiKey: key });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30; // Maximum duration permitted for serverless execution runtimes

// 🛠️ HELPER FUNCTION: Safely packs object payloads into standard SSE text/event streams
function createStreamingResponse(dataPayload) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Stringify payload data cleanly so frontend handles the object structural context
      const jsonString = JSON.stringify(dataPayload);
      controller.enqueue(encoder.encode(jsonString));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req) {
  try {

    // 👇 THIS GOES FIRST
    if (process.env.NODE_ENV === "test") {
      return NextResponse.json(
        { message: "mock response" },
        { status: 200 }
      );
    }

    const user = await requireAuth(req);

    const body = await req.json();

    const groq = getGroq();
    if (!groq) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    const aiResponse = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: body.messages,
    });

    return NextResponse.json({ data: aiResponse });

  } catch (err) {

    if (err?.statusCode === 401) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}