import { insertAuditLog } from "@/lib/models/auditLogModel";

export async function logAuditEvent({
  actor,
  action,
  target,
  details,
  request,
  success = true,
}) {
  const ip =
    request?.headers?.get("x-forwarded-for") ||
    request?.headers?.get("x-real-ip") ||
    null;
  const userAgent = request?.headers?.get("user-agent") || null;

  await insertAuditLog({
    actor: {
      uid: actor.uid,
      email: actor.email || null,
      role: actor.role || null,
    },
    action,
    target: target || null,
    details: details || {},
    ip,
    userAgent,
    success,
  });
}
