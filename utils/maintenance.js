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
    
    const secretBypassKey = process.env.MAINTENANCE_BYPASS_KEY;
    if (bypassCookie === secretBypassKey || bypassHeader === secretBypassKey) {
      return false;
    }
  }

  return true;
}
