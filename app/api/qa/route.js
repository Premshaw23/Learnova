import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { success, jsonError } from "@/lib/api-response";
import { publishEvent } from "@/lib/ssePublisher";
import { callGroq } from "@/lib/ai/groq";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const askSchema = z.object({
  action: z.literal("ask"),
  sessionId: z.string().min(1),
  content: z.string().min(1).max(500),
});

const upvoteSchema = z.object({
  action: z.literal("upvote"),
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
});

const answerSchema = z.object({
  action: z.literal("answer"),
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
});

const createSessionSchema = z.object({
  action: z.literal("create"),
  title: z.string().min(1).max(200),
});

const endSessionSchema = z.object({
  action: z.literal("end"),
  sessionId: z.string().min(1),
});

const actionSchema = z.discriminatedUnion("action", [
  createSessionSchema,
  askSchema,
  upvoteSchema,
  answerSchema,
  endSessionSchema,
]);

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonError("Missing sessionId parameter", 400);
  }

  const db = await connectDb();
  const session = await db.collection("qa_sessions").findOne({ _id: new ObjectId(sessionId) });
  if (!session) {
    return jsonError("Q&A session not found", 404);
  }

  const questions = await db
    .collection("qa_questions")
    .find({ sessionId })
    .sort({ upvotes: -1, createdAt: 1 })
    .toArray();

  return success({ session, questions });
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const body = await parseJSON(request, 1024 * 50);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid request payload", 400);
  }

  const db = await connectDb();
  const now = new Date();

  if (parsed.data.action === "create") {
    // Check if caller is teacher or admin
    if (!["teacher", "admin"].includes(decodedToken.role)) {
      return jsonError("Forbidden: Only teachers and admins can start Q&A sessions", 403);
    }

    const sessionRecord = {
      title: parsed.data.title,
      hostId: decodedToken.uid,
      status: "active",
      createdAt: now,
      endedAt: null,
      summary: null,
    };

    const result = await db.collection("qa_sessions").insertOne(sessionRecord);
    return success({ sessionId: result.insertedId, session: sessionRecord }, 201);
  }

  const { sessionId } = parsed.data;
  const session = await db.collection("qa_sessions").findOne({ _id: new ObjectId(sessionId) });
  if (!session) {
    return jsonError("Q&A Session not found", 404);
  }

  if (parsed.data.action === "end") {
    if (session.hostId !== decodedToken.uid && decodedToken.role !== "admin") {
      return jsonError("Forbidden: Only session host can end Q&A session", 403);
    }

    if (session.status === "ended") {
      return jsonError("Session already ended", 400);
    }

    // Fetch all questions to summarize
    const questions = await db
      .collection("qa_questions")
      .find({ sessionId })
      .toArray();

    let summary = "No questions were submitted during this session.";
    if (questions.length > 0) {
      const questionsText = questions
        .map((q, idx) => `${idx + 1}. [Upvotes: ${q.upvotes}] ${q.content}`)
        .join("\n");

      const prompt = `Here is a list of student questions submitted during a live lecture session:\n\n${questionsText}\n\nAnalyze these questions and generate a concise summary of the "Key Knowledge Gaps" (e.g., frequently asked concepts, common sources of confusion) for the instructor. Keep it structured and actionable.`;

      try {
        summary = await callGroq(prompt, [], decodedToken.uid, { context: "Q&A Session Summary" });
      } catch (err) {
        summary = `Failed to generate AI summary: ${err.message}`;
      }
    }

    await db.collection("qa_sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { status: "ended", endedAt: now, summary } }
    );

    await publishEvent(`qa:${sessionId}`, "session_ended", { summary });

    return success({ success: true, summary });
  }

  if (session.status !== "active") {
    return jsonError("Session is not active", 400);
  }

  if (parsed.data.action === "ask") {
    const questionRecord = {
      sessionId,
      content: parsed.data.content,
      studentId: decodedToken.uid,
      studentName: decodedToken.name || "Student",
      upvotes: 0,
      upvotedBy: [],
      isAnswered: false,
      createdAt: now,
    };

    const result = await db.collection("qa_questions").insertOne(questionRecord);
    questionRecord._id = result.insertedId;

    await publishEvent(`qa:${sessionId}`, "question_added", questionRecord);

    return success({ question: questionRecord }, 201);
  }

  if (parsed.data.action === "upvote") {
    const { questionId } = parsed.data;
    const question = await db.collection("qa_questions").findOne({ _id: new ObjectId(questionId) });
    if (!question) {
      return jsonError("Question not found", 404);
    }

    if (question.upvotedBy.includes(decodedToken.uid)) {
      return jsonError("Already upvoted", 400);
    }

    const updated = await db.collection("qa_questions").findOneAndUpdate(
      { _id: new ObjectId(questionId) },
      {
        $inc: { upvotes: 1 },
        $push: { upvotedBy: decodedToken.uid },
      },
      { returnDocument: 'after' }
    );

    const newUpvotes = updated.upvotes;
    await publishEvent(`qa:${sessionId}`, "question_upvoted", { questionId, upvotes: newUpvotes });

    return success({ success: true, upvotes: newUpvotes });
  }

  if (parsed.data.action === "answer") {
    const { questionId } = parsed.data;
    if (session.hostId !== decodedToken.uid && decodedToken.role !== "admin") {
      return jsonError("Forbidden: Only session host can mark questions as answered", 403);
    }

    await db.collection("qa_questions").updateOne(
      { _id: new ObjectId(questionId) },
      { $set: { isAnswered: true } }
    );

    await publishEvent(`qa:${sessionId}`, "question_answered", { questionId });

    return success({ success: true });
  }

  return jsonError("Unhandled action", 400);
});
