import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(req, context) {
  try {
    const { sessionId } = context.params;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await connectDb();

    // Mark session as completed / abandoned
    const result = await db.collection("quiz_sessions").updateOne(
      { _id: sessionId },
      {
        $set: {
          completed: true,
          abandoned: true,
          abandonedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quiz session abandoned",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Quiz session abandon error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to abandon quiz session" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
