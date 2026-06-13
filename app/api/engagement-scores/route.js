import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { success, jsonError } from "@/lib/api-response";
import { calculateEngagementScore, getEngagementTrend } from "@/lib/engagementScore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const engagementScoreSchema = z.object({
  studentId: z.string().min(1),
  attendanceScore: z.number().min(0).max(100),
  activityScore: z.number().min(0).max(100),
  assignmentScore: z.number().min(0).max(100),
  academicScore: z.number().min(0).max(100),
  weights: z
    .object({
      attendance: z.number().min(0).max(1).optional(),
      activity: z.number().min(0).max(1).optional(),
      assignment: z.number().min(0).max(1).optional(),
      academic: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

const querySchema = z.object({
  studentId: z.string().optional(),
  limit: z.preprocess((value) => Number(value), z.number().int().min(1).max(50).optional()),
  top: z.union([z.string(), z.boolean()]).optional(),
});

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    studentId: searchParams.get("studentId") || undefined,
    limit: searchParams.get("limit") || undefined,
    top: searchParams.get("top") || undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid query parameters", 400);
  }

  const { studentId, limit = 12, top } = parsed.data;
  const db = await connectDb();
  const role = decodedToken.role;

  if (top) {
    if (!["teacher", "institute", "admin"].includes(role)) {
      return jsonError("Forbidden: insufficient permissions", 403);
    }

    const records = await db
      .collection("engagement_scores")
      .find({})
      .sort({ overallScore: -1, calculatedAt: -1 })
      .limit(limit)
      .toArray();

    return success({ rankings: records });
  }

  const targetStudentId = studentId || decodedToken.uid;

  if (role === "student" && targetStudentId !== decodedToken.uid) {
    return jsonError("Forbidden: students may only view their own engagement data", 403);
  }

  const scoresCursor = db
    .collection("engagement_scores")
    .find({ studentId: targetStudentId })
    .sort({ calculatedAt: -1 })
    .limit(limit);

  const history = await scoresCursor.toArray();
  const trend = getEngagementTrend(history);
  const latest = history[0] || null;

  return success({ latest, history, trend });
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const requestBody = await parseJSON(request, 1024 * 20);
  const parsed = engagementScoreSchema.safeParse(requestBody);

  if (!parsed.success) {
    return jsonError("Invalid engagement score payload", 400);
  }

  const { studentId, attendanceScore, activityScore, assignmentScore, academicScore, weights } = parsed.data;

  if (decodedToken.role === "student" && decodedToken.uid !== studentId) {
    return jsonError("Forbidden: students may only create their own engagement score", 403);
  }

  const scorePayload = calculateEngagementScore(
    { attendanceScore, activityScore, assignmentScore, academicScore },
    weights
  );
  const db = await connectDb();
  const record = {
    studentId,
    attendanceScore: scorePayload.attendanceScore,
    activityScore: scorePayload.activityScore,
    assignmentScore: scorePayload.assignmentScore,
    academicScore: scorePayload.academicScore,
    overallScore: scorePayload.overallScore,
    category: getEngagementCategory(scorePayload.overallScore),
    weights: scorePayload.weights,
    calculatedAt: new Date(),
  };

  const result = await db.collection("engagement_scores").insertOne(record);
  return success({ id: result.insertedId, record }, 201);
});
