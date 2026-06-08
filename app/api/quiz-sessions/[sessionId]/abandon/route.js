import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req, { params }) => {
  const payload = await requireAuth(req);
  const { sessionId } = await params;

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: "Session ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const db = await connectDb();

  const session = await db
    .collection("quiz_sessions")
    .findOne({ _id: sessionId });
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.userId !== payload.uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.collection("quiz_sessions").deleteOne({ _id: sessionId });

  return new Response(
    JSON.stringify({ success: true, message: "Session abandoned" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
