import { jsonSuccess, jsonError } from "@/lib/api-response";
import {
  parseJSON,
  withErrorHandler,
} from "@/lib/error-handler";

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
  const body = await parseJSON(request);

  const { sessionId, query } = body;

  if (!sessionId) {
    return jsonError("Missing sessionId", 400);
  }

  if (!query?.trim()) {
    return jsonError("Missing query", 400);
  }

  const db = await connectDb();

  const session = await db
    .collection("studyai_sessions")
    .findOne({ sessionId });

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

  return jsonError(
    err.message || "Retrieve failed",
    500
  );
}
});