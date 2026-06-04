import { randomUUID } from "crypto";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import {
  parseJSON,
  withErrorHandler,
} from "@/lib/error-handler";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const body = await parseJSON(request);

  const { chunks } = body;

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return jsonError("No chunks provided", 400);
  }

  const sessionId = randomUUID();

  const db = await connectDb();

  await db.collection("studyai_sessions").insertOne({
    sessionId,
    chunks,
    createdAt: new Date(),
  });

  return jsonSuccess({
    sessionId,
  });
});