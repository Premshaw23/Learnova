import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/rbac";
import { terminateAllUserSessions } from "@/lib/sessionManager";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  // Only admins can forcibly terminate sessions for other users
  await requireAdmin(request);

  const body = await parseJSON(request);
  const { targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json({ success: false, error: "Missing targetUserId" }, { status: 400 });
  }

  // Terminate all sessions for the user across all devices
  await terminateAllUserSessions(targetUserId);

  return NextResponse.json({
    success: true,
    message: `All active sessions for user ${targetUserId} have been terminated.`
  });
});
