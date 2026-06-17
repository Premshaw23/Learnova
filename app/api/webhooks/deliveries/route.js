import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import { listDeliveries } from "@/lib/models/webhookDeliveryModel";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  await requireRole(request, ["admin"]);

  const { searchParams } = new URL(request.url);
  const filter = {};
  if (searchParams.get("webhookId")) filter.webhookId = searchParams.get("webhookId");
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const skip = parseInt(searchParams.get("skip") || "0", 10);

  const deliveries = await listDeliveries(filter, { limit, skip });
  return jsonSuccess({ deliveries });
});
