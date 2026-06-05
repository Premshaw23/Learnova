import { randomUUID } from "crypto";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const body = await parseJSON(request);

  const { chunks } = body;

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return jsonError("No chunks provided", 400);
  }

  if (!chunks.every((c) => c && typeof c.pageContent === "string")) {
    return jsonError("Each chunk must have a pageContent string", 400);
  }

  const sessionId = randomUUID();

  const db = await connectDb();

  await db.collection("studyai_sessions").insertOne({
    sessionId,
    userId: decodedToken.uid,
    chunks,
    createdAt: new Date(),
  });

  return jsonSuccess({
    sessionId,
  });
});
