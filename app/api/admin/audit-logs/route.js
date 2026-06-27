import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import { queryAuditLogs } from "@/lib/models/auditLogModel";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  await requireRole(request, ["admin"]);

  const { searchParams } = new URL(request.url);
  const filter = {};
  if (searchParams.get("actorUid")) filter.actorUid = searchParams.get("actorUid");
  if (searchParams.get("action")) filter.action = searchParams.get("action");
  if (searchParams.get("targetType")) filter.targetType = searchParams.get("targetType");
  if (searchParams.get("startDate")) filter.startDate = searchParams.get("startDate");
  if (searchParams.get("endDate")) filter.endDate = searchParams.get("endDate");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const skip = parseInt(searchParams.get("skip") || "0", 10);

  const logs = await queryAuditLogs(filter, { limit, skip });
  return jsonSuccess({ logs });
});
