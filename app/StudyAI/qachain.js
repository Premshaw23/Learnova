import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { retrieve } from "./Retriever.js";

function formatContext(chunks) {
  if (!chunks?.length) {
    return "No relevant content found.";
  }

  return chunks
    .map((chunk, i) => {
      const { source, page } = chunk.metadata || {};

      return `[Chunk ${i + 1}${source ? ` - ${source}` : ""}${
        page ? ` - Page ${page}` : ""
      }]
${chunk.pageContent}`;
    })
    .join("\n\n");
}
// How many past turns to keep in memory.
// Each turn = 1 HumanMessage + 1 AIMessage.
// Keeps the prompt lean — older turns are dropped.
const MAX_HISTORY_TURNS = 6;

//  CONVERSATION HISTORY
//  Stored as LangChain BaseMessage[] so it feeds
//  directly into MessagesPlaceholder in the prompt.
//  Exported so your UI can display the chat log.

let conversationHistory = [];

/**
 * Reset conversation memory (e.g. when user uploads a new document).
 */
export function clearHistory() {
  conversationHistory = [];
}

/**
 * Get a copy of the current conversation history.
 * Use this to render the chat log in your UI.
 *
 * @returns {{ role: "user"|"assistant", content: string }[]}
 */
export function getHistory() {
  return conversationHistory.map((msg) => ({
    role: msg instanceof HumanMessage ? "user" : "assistant",
    content: msg.content,
  }));
}

const QA_SYSTEM_PROMPT = `You are an intelligent study assistant. 
You help students understand their uploaded study material.

Answer questions using ONLY the context provided below from the document.
If the answer is not in the context, say "I couldn't find that in the document."
Always mention which page the information comes from when possible.
Keep answers clear, concise, and student-friendly.

--- DOCUMENT CONTEXT ---
{context}
------------------------`;

const qaPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", QA_SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
]);

//  QUICK ACTION PROMPT TEMPLATES
//  Each action has its own focused system prompt.
//  These do NOT use RAG — they receive the full
//  formatted context (all top-k chunks) directly.
const QUICK_ACTION_PROMPTS = {
  summarise: `You are a study assistant. Summarise the following document content
clearly and concisely. Use short paragraphs. Highlight the most important ideas.
Write in plain English that a student can understand quickly.`,

  keypoints: `You are a study assistant. Extract the key points from the following
document content. Return them as a numbered list. Each point should be one clear,
complete sentence. Focus on facts, definitions, and concepts worth memorising.`,

  flashcards: `You are a study assistant. Generate 8–10 flashcards from the following
document content. Format each flashcard exactly like this:

Q: [question]
A: [answer]

Focus on important definitions, formulas, dates, and concepts.`,

  simplify: `You are a study assistant. Rewrite the following document content
in much simpler language. Explain it as if you are talking to a student who is
encountering this topic for the first time. Use analogies where helpful.
Avoid jargon — if you must use a technical term, immediately explain it.`,
};

const quickActionTemplate = ChatPromptTemplate.fromMessages([
  ["system", "{systemPrompt}"],
  ["human", "Here is the document content:\n\n{context}"],
]);

//  ASK QUESTION  —  RAG-powered conversational Q&A
/**
 * Answer a student's question using retrieved document context.
 * Maintains conversation history across multiple questions.
 *
 * @param   {string}                question   The student's question
 * @param   {VectorStoreRetriever}  retriever  From buildRetriever()
 * @returns {Promise<string>}                  AI answer
 *
 * @example
 * const answer = await askQuestion(
 *   "What is the second law of thermodynamics?",
 *   retriever
 * );
 */

export async function askQuestion(question, sessionId) {
  if (!question?.trim()) {
    throw new Error("Question is empty.");
  }

  if (!sessionId) {
    throw new Error("Retriever not initialised.");
  }

  const relevantChunks = await retrieve(question, sessionId);

  const context = formatContext(relevantChunks);

  // Keep only recent conversation history
  const trimmedHistory = conversationHistory.slice(-(MAX_HISTORY_TURNS * 2));

  // Build LangChain prompt messages
  const promptMessages = await qaPromptTemplate.formatMessages({
    context,
    history: trimmedHistory,
    question,
  });

  // Convert messages into ONE string for /api/groq
  const promptText = promptMessages.map((msg) => msg.content).join("\n\n");

  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: promptText,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error || "Failed to get response from Groq");
  }

  const data = await response.json();

  const answer =
    data?.data?.message || data?.message || "No response generated.";

  // Save conversation history
  conversationHistory.push(new HumanMessage(question));
  conversationHistory.push(new AIMessage(answer));

  return answer;
}

//  QUICK ACTIONS
//  Summarise / Key Points / Flashcards / Simplify
//  Uses top-k retrieved chunks as the content to act on.

/**
 * Run a quick action on the document content.
 *
 * @param   {"summarise"|"keypoints"|"flashcards"|"simplify"}  action
 * @param   {VectorStoreRetriever}  retriever  From buildRetriever()
 * @param   {string}  topic  Optional topic to focus on (e.g. "chapter 3", "Newton's laws")
 * @returns {Promise<string>}
 *
 * @example
 * const summary    = await quickAction("summarise",  retriever);
 * const keyPoints  = await quickAction("keypoints",  retriever, "chapter 2");
 * const flashcards = await quickAction("flashcards", retriever);
 * const simple     = await quickAction("simplify",   retriever, "the derivation on page 5");
 */
export async function quickAction(action, sessionId, topic = "") {
  if (!QUICK_ACTION_PROMPTS[action]) {
    throw new Error(
      `Unknown action "${action}". Use: summarise | keypoints | flashcards | simplify`
    );
  }
  if (!sessionId) throw new Error("session not initialised.");

  // Use the topic as the retrieval query, or fall back to the action name
  const query = topic || action;
  const relevantChunks = await retrieve(query, sessionId);
  const context = formatContext(relevantChunks);

  const prompt = await quickActionTemplate.formatMessages({
    systemPrompt: QUICK_ACTION_PROMPTS[action],
    context,
  });

  const promptText = prompt.map((msg) => msg.content).join("\n\n");

  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: promptText,
    }),
  });

  const data = await response.json();

  return data?.data?.message || data?.message || "No response generated.";
}
