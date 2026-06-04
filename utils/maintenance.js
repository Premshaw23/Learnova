/**
 * Maintenance Mode Utility
 * Checks whether the application is currently running under administrative maintenance windows.
 * Maintenance bypass requires explicitly configured environment variable - no hardcoded defaults.
 */

export function isMaintenanceModeActive(request) {
  // Check global environment flag
  const isEnabled = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1";

  if (!isEnabled) {
    return false;
  }

  // Bypass checks for admins using custom verification header or cookies
  // Requires MAINTENANCE_BYPASS_KEY to be explicitly configured in environment
  // No hardcoded defaults - if not configured, maintenance mode cannot be bypassed
  if (request && process.env.MAINTENANCE_BYPASS_KEY) {
    const bypassCookie = request.cookies?.get?.("learnova_maintenance_bypass")?.value;
    const bypassHeader = request.headers?.get?.("x-learnova-maintenance-bypass");

    // Use constant-time comparison to prevent timing attacks
    const secretBypassKey = process.env.MAINTENANCE_BYPASS_KEY;
    const cookieMatches = bypassCookie ? constantTimeEqual(bypassCookie, secretBypassKey) : false;
    const headerMatches = bypassHeader ? constantTimeEqual(bypassHeader, secretBypassKey) : false;

    if (cookieMatches || headerMatches) {
      // Log bypass usage for security audit
      console.log(`[SECURITY] Maintenance bypass used via ${cookieMatches ? "cookie" : "header"}`);
      return false;
    }
  }

  return true;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Compares two strings without leaking information via execution time
 */
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Strings must be same length, otherwise comparison fails immediately
  if (a.length !== b.length) {
    return false;
  }

  // Compare each character without early exit
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
