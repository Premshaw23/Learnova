import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { AppError } from "@/lib/errors";

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
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const decodedToken = await requireAuth(request);
    let userId = decodedToken.uid || decodedToken.sub;

    const body = await request.json();
    const { userMessage, botMessage } = body;

    if (!userMessage || !botMessage) {
      return NextResponse.json(
        { error: "Validation Error: Missing messages." },
        { status: 400 }
      );
    }

    const db = await connectDb();
    const conversation = {
      userId,
      userMessage,
      botMessage,
      timestamp: new Date().toISOString(),
    };

    const result = await db.collection("conversations").insertOne(conversation);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...conversation },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
