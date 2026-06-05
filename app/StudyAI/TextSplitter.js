//  Install (already installed from loader step):
//    npm install @langchain/community @langchain/core

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ─────────────────────────────────────────────
//  CHUNK PROFILES
//  Different study material needs different chunk sizes.
//  Export these so the UI can let users pick a profile,
//  or you can hard-code one for now.
// ─────────────────────────────────────────────

export const CHUNK_PROFILES = {
  // Dense academic PDFs, textbooks, research papers
  academic: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },

  // Lecture notes, articles, blog posts
  notes: {
    chunkSize: 700,
    chunkOverlap: 120,
  },

  // Short summaries, pasted paragraphs
  brief: {
    chunkSize: 400,
    chunkOverlap: 80,
  },
};

// Default profile — safe for most study material
const DEFAULT_PROFILE = "academic";

const SEPARATORS = ["\n\n", "\n", ". ", ", ", " ", ""];

/**
 * Split LangChain Documents into smaller chunks.
 * Preserves and enriches metadata on every chunk.
 *
 * @param   {Document[]}  docs     Output from loadDocument() / loadFromPaste()
 * @param   {string}      profile  "academic" | "notes" | "brief"  (default: "academic")
 * @returns {Promise<Document[]>}  Chunked documents with full metadata
 *
 * @example
 * const docs   = await loadDocument(file);
 * const chunks = await splitDocuments(docs, "notes");
 *
 * console.log(chunks.length);
 * // chunks[0].pageContent → "The mitochondria is..."  (≤1000 chars)
 * // chunks[0].metadata    → { source, page, fileType, chunkIndex, totalChunks }
 */
export async function splitDocuments(docs, profile = DEFAULT_PROFILE) {
  if (!docs?.length) throw new Error("No documents to split.");

  const { chunkSize, chunkOverlap } =
    CHUNK_PROFILES[profile] ?? CHUNK_PROFILES[DEFAULT_PROFILE];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: SEPARATORS,
  });

  // splitDocuments() takes Document[] and returns Document[]
  // It carries each doc's metadata forward to every chunk it produces
  const rawChunks = await splitter.splitDocuments(docs);

  // Enrich metadata: add chunkIndex + totalChunks so the retriever
  // and Claude can reference exact positions in the original document
  const enriched = enrichMetadata(rawChunks);

  return enriched;
}

//  METADATA ENRICHMENT
//  Adds chunkIndex and totalChunks to every chunk.
//  Groups by source file so indexes restart per document
//  (useful if the user uploads multiple files later).

function enrichMetadata(chunks) {
  // Group chunk indexes by source filename
  const countBySource = {};

  chunks.forEach((chunk) => {
    const src = chunk.metadata?.source ?? "unknown";
    countBySource[src] = (countBySource[src] ?? 0) + 1;
  });

  const indexBySource = {};

  return chunks.map((chunk) => {
    const src = chunk.metadata?.source ?? "unknown";
    indexBySource[src] = (indexBySource[src] ?? 0) + 1;

    return {
      ...chunk,
      metadata: {
        ...chunk.metadata, // source, page, fileType from loader
        chunkIndex: indexBySource[src], // e.g. 3  (this is the 3rd chunk)
        totalChunks: countBySource[src], // e.g. 42 (file has 42 chunks total)
      },
    };
  });
}

//  INSPECT HELPER  (dev / debug only)
//  Prints a summary of the chunks — useful during
//  development to tune chunkSize and chunkOverlap.

/**
 * Log a readable summary of chunks to the console.
 * Call this during development to verify split quality.
 *
 * @param {Document[]} chunks
 */
export function inspectChunks(chunks) {
  const lengths = chunks.map((c) => c.pageContent.length);
  const avgLen = Math.round(
    lengths.reduce((a, b) => a + b, 0) / lengths.length
  );
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);

  // Preview first 3 chunks
  chunks.slice(0, 3).forEach((chunk, i) => {
    console.group(`Chunk ${i + 1} — page ${chunk.metadata.page}`);

    console.groupEnd();
  });
}
