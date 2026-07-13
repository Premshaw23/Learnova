import { jsonSuccess, jsonError } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { connectDb } from "@/lib/mongodb";

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });
  }

  return embeddings;
}

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const body = await parseJSON(request);

  const { sessionId, query } = body;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return jsonError("Invalid sessionId", 400);
  }

  if (!query?.trim()) {
    return jsonError("Missing query", 400);
  }

  const db = await connectDb();

  const session = await db
    .collection("studyai_sessions")
    .findOne({ sessionId, userId: decodedToken.uid });

  if (!session) {
    return jsonError("Session expired", 404);
  }

  try {
    const vectorStore = await MemoryVectorStore.fromDocuments(
      session.chunks,
      getEmbeddings()
    );

    const docs = await vectorStore.similaritySearch(query, 4);

    return jsonSuccess({ docs });
  } catch (err) {
    console.error("RETRIEVE ERROR:", err);

    return jsonError(err.message || "Retrieve failed", 500);
  }
});
