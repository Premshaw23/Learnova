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

if (process.env.NODE_ENV === "test") {
  return NextResponse.json(
    { message: "mock response" },
    { status: 200 }
  );
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

export async function POST(req: Request) {
  try {
    // 1. AUTH FIRST
    const user = await requireAuth(req);
    const userId = user.uid || user.sub;

    // 2. RATE LIMIT
    try {
      const rateLimitResult = await checkRateLimit(userId);
      if (rateLimitResult && !rateLimitResult.allowed) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {}

    // 3. PARSE BODY
    const body = await parseJSON(req, 1024 * 50);
    const { messages, category = "general" } = body;

    if (!messages?.length) {
      return NextResponse.json(
        { error: "Missing messages" },
        { status: 400 }
      );
    }

    // 4. SAFETY CHECK
    const lastMsg = messages[messages.length - 1]?.content || "";
    if (detectInjection(lastMsg)?.isInjection) {
      return NextResponse.json(
        { error: "Injection detected" },
        { status: 400 }
      );
    }

    const sanitized = sanitizeMessage(lastMsg);

    // 5. GROQ INIT
    const groq = getGroq();

    if (!groq || process.env.NODE_ENV === "test") {
      return NextResponse.json(
        { message: "mock response" },
        { status: 200 }
      );
    }

    // 6. AI CALL (STREAM)
    const stream = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are Nova AI for Learnova`,
        },
        ...messages,
      ],
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}