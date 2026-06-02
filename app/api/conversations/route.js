import { NextResponse } from "next/server";
<<<<<<< HEAD
import { Groq } from "groq-sdk";
=======
import { connectDb } from "@/lib/mongodb";
>>>>>>> upstream/master
import { requireAuth } from "@/lib/rbac";

<<<<<<< HEAD
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🤖 Groq client
function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
=======
export const dynamic = "force-dynamic";

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

    // Reverse to return chronological order for the frontend
    conversations.reverse();

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
>>>>>>> upstream/master
}

export async function POST(req) {
  try {
<<<<<<< HEAD
    // 🔐 1. AUTH (TOP PRIORITY)
    let user;
    try {
      user = await requireAuth(req);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 📦 2. PARSE REQUEST
    const body = await req.json();

    if (!body?.messages) {
      return NextResponse.json(
        { error: "Invalid request: messages required" },
        { status: 400 }
      );
    }

    // 🧪 3. TEST MODE MOCK
    if (process.env.NODE_ENV === "test") {
      return NextResponse.json(
        { message: "mock response", user },
        { status: 200 }
      );
    }

    // 🤖 4. INIT GROQ
    const groq = getGroq();

    if (!groq) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    // 🧠 5. AI CALL
    const aiResponse = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: body.messages,
    });

    // ✅ 6. RESPONSE
    return NextResponse.json({
      data: aiResponse,
      user,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
=======
    const decodedToken = await requireAuth(request);
    let userId = decodedToken.uid || decodedToken.sub;

    const body = await request.json();
    const { userMessage, botMessage } = body;

    if (!userMessage || !botMessage) {
      return NextResponse.json({ error: "Validation Error: Missing messages." }, { status: 400 });
    }

    const db = await connectDb();
    const conversation = {
      userId,
      userMessage,
      botMessage,
      timestamp: new Date().toISOString(),
    };

    const result = await db.collection("conversations").insertOne(conversation);

    return NextResponse.json({ success: true, data: { _id: result.insertedId, ...conversation } });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
>>>>>>> upstream/master
  }
}