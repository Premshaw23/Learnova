import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { terminateAllUserSessions } from "@/lib/sessionManager";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  // Only admins can forcibly terminate sessions for other users
  const decodedToken = await requireAuth(request);

  const body = await parseJSON(request);
  const { targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json(
      { success: false, error: "Missing targetUserId" },
      { status: 400 }
    );
  }

  // Terminate all sessions for the user across all devices
  await terminateAllUserSessions(targetUserId);

  await logAudit({
    req: request,
    actor: { uid: decodedToken.uid, email: decodedToken.email || 'unknown', role: decodedToken.role || 'admin' },
    action: "session.terminate",
    target: { type: "user", id: targetUserId },
    details: { message: `Terminated all sessions for user ${targetUserId}` },
    success: true
  });

  return NextResponse.json({
    success: true,
    message: `All active sessions for user ${targetUserId} have been terminated.`,
  });
});
