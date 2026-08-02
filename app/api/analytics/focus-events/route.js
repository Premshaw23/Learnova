import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req, ["student"]);
  const userId = decodedToken.uid;

  const body = await req.json();
  const { contextId, contextType, durationSeconds } = body;

  if (!contextId || !contextType || durationSeconds === undefined) {
    return jsonError("Missing required fields", 400);
  }

  const db = await connectDb();

  await db.collection("focus_distractions").insertOne({
    studentId: userId,
    contextId,
    contextType,
    durationSeconds,
    timestamp: new Date(),
  });

  return jsonSuccess({ message: "Distraction event logged successfully" });
});

export const GET = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req, ["teacher", "admin"]);
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const contextId = searchParams.get("contextId");

  const query = {};
  if (studentId) query.studentId = studentId;
  if (contextId) query.contextId = contextId;

  const db = await connectDb();
  const events = await db
    .collection("focus_distractions")
    .find(query)
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();

  return jsonSuccess({ events });
});
