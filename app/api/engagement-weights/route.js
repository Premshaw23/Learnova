import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { success, jsonError } from "@/lib/api-response";
import { normalizeEngagementWeights, DEFAULT_ENGAGEMENT_WEIGHTS } from "@/lib/engagementScore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const engagementWeightsSchema = z.object({
  attendance: z.number().min(0).max(1).optional(),
  activity: z.number().min(0).max(1).optional(),
  assignment: z.number().min(0).max(1).optional(),
  academic: z.number().min(0).max(1).optional(),
});

export const GET = withErrorHandler(async (request) => {
  const { payload, profile } = await requireRole(request, ["admin", "institute"]);
  const targetInstituteId = payload.role === "admin" ? request.nextUrl.searchParams.get("instituteId") || profile?.uid : profile?.uid;
  const db = await connectDb();
  const settings = await db.collection("settings").findOne({ userId: targetInstituteId });
  const weights = settings?.institute?.engagementWeights || DEFAULT_ENGAGEMENT_WEIGHTS;

  return success({ weights });
});

export const PATCH = withErrorHandler(async (request) => {
  const { payload, profile } = await requireRole(request, ["admin", "institute"]);
  const body = await parseJSON(request, 1024 * 10);
  const parsed = engagementWeightsSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid engagement weights", 400);
  }

  const normalized = normalizeEngagementWeights(parsed.data);
  const targetInstituteId = payload.role === "admin" ? body.instituteId || profile?.uid : profile?.uid;
  const db = await connectDb();

  await db.collection("settings").updateOne(
    { userId: targetInstituteId },
    {
      $set: {
        "institute.engagementWeights": normalized,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return success({ weights: normalized });
});
