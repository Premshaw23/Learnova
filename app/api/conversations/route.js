import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🤖 Groq client
function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

export async function GET(request) {
  try {
    const decodedToken = await requireAuth(request);
    let userId = decodedToken.uid || decodedToken.sub;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const db = await connectDb();
    const conversations = await db
      .collection("conversations")
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    conversations.reverse();
    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // 🔐 1. AUTH
    let user;
    try {
      user = await requireAuth(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📦 2. PARSE REQUEST
    const body = await req.json();
    if (!body?.messages && !body?.userMessage) {
      return NextResponse.json({ error: "Invalid request: messages required" }, { status: 400 });
    }

    // 🧪 3. TEST MODE MOCK
    if (process.env.NODE_ENV === "test") {
      return NextResponse.json({ message: "mock response", user }, { status: 200 });
    }

    // 🤖 4. INIT GROQ
    const groq = getGroq();
    if (!groq) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 🧠 5. AI CALL
    const aiResponse = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: body.messages,
    });

    return NextResponse.json({ data: aiResponse, user });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
