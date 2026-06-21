/**
 * Build vector store on server and return sessionId
 */
export async function buildRetriever(chunks, onProgress = () => {}) {
  if (!chunks?.length) {
    throw new Error("No chunks to embed.");
  }

  onProgress({
    stage: "Building vector store",
    percent: 20,
  });

  const response = await fetch("/api/StudyAI/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chunks,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  onProgress({
    stage: "Vector store ready",
    percent: 100,
  });

  return data.data.sessionId;
}

/**
 * Retrieve chunks from server-side vector store
 */
export async function retrieve(query, sessionId) {
  if (!query?.trim()) {
    throw new Error("Query is empty.");
  }

  if (!sessionId) {
    throw new Error("Session not initialized.");
  }

  const response = await fetch("/api/StudyAI/retrieve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      sessionId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  return data.data.docs;
}
