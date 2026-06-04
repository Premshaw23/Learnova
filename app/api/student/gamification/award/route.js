import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ForbiddenError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/student/gamification/award
 *
 * Restricts the XP award endpoint.
 * Direct client-side/student-facing requests to award XP are forbidden to prevent abuse.
 * XP awards should only be triggered as side effects of verified backend operations
 * (like marking attendance via /api/attendance/record).
 */
export const POST = withErrorHandler(async (request) => {
  // Restrict endpoint access to admin users to prevent student gamification abuse/exploits
  await requireRole(request, ["admin"]);

  // Even for administrators, direct manual XP awards are disabled via this route.
  // XP awards must only be triggered as side effects of verified backend operations.
  throw new ForbiddenError("Direct client-side XP awards are disabled.");
});
