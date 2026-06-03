/**
 * Maintenance Mode Utility
 * Checks whether the application is currently running under administrative maintenance windows.
 */

export function isMaintenanceModeActive(request) {
  // Check global environment flag
  const isEnabled = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1";
  
  if (!isEnabled) {
    return false;
  }

  // Bypass checks for admins using custom verification header / cookies
  if (request) {
    const bypassCookie = request.cookies?.get?.("learnova_maintenance_bypass")?.value;
    const bypassHeader = request.headers?.get?.("x-learnova-maintenance-bypass");
    
    // The bypass key must be configured via the MAINTENANCE_BYPASS_KEY environment
    // variable. A hardcoded fallback value is visible to anyone with repository
    // access and allows maintenance mode to be bypassed without authorization.
    // Refuse to grant bypass access if the key is not set in the environment.
    const secretBypassKey = process.env.MAINTENANCE_BYPASS_KEY;
    if (!secretBypassKey) {
      // No bypass key configured — deny bypass regardless of what the caller sends.
      return true;
    }
    if (bypassCookie === secretBypassKey || bypassHeader === secretBypassKey) {
      return false;
    }
  }

  return true;
}
