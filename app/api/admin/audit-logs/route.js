import { jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const actorUid = searchParams.get('actorUid');
  const action = searchParams.get('action');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);

  const query = {};

  if (actorUid) {
    query['actor.uid'] = actorUid;
  }
  if (action) {
    query.action = action;
  }
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const db = await connectDb();
  const logs = await db.collection("audit_logs")
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection("audit_logs").countDocuments(query);

  return jsonSuccess({
    logs,
    pagination: {
      total,
      limit,
      skip
    }
  });
});
