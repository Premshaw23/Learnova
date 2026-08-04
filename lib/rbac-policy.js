export const PUBLIC_API_PATHS = new Set([
  "/api/auth/csrf",
  "/api/auth/reset-password",
  "/api/health",
]);

// Public API path prefixes — every sub-path is publicly accessible. Used for
// endpoints that are public by design, such as the iCal subscription feed
// (protected by a high-entropy token embedded in the URL) and the infra
// health-check family (/api/health, /api/health/db, /api/health/rate-limit).
export const PUBLIC_API_PREFIXES = ["/api/timetable/ical", "/api/health"];

// API path prefixes whose authentication is performed inside the route handler
// rather than by the edge middleware (e.g. Vercel cron jobs that authenticate
// via CRON_SECRET through authorizeCronRequest).
export const SERVICE_API_PREFIXES = ["/api/cron"];

const API_ROUTE_RULES = [
  { pattern: /^\/api\/student(?:\/|$)/, roles: ["student", "admin"] },
  { pattern: /^\/api\/teacher(?:\/|$)/, roles: ["teacher", "admin"] },
  { pattern: /^\/api\/admin(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/api\/institute(?:\/|$)/, roles: ["institute", "admin"] },
  { pattern: /^\/api\/parent(?:\/|$)/, roles: ["parent", "admin"] },
  {
    pattern: /^\/api\/analytics\/attendance-risk(?:\/|$)/,
    roles: ["teacher", "institute", "admin"],
  },
  {
    pattern: /^\/api\/attendance\/settings(?:\/|$)/,
    roles: ["teacher", "admin"],
  },
  { pattern: /^\/api\/attendance\/record(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/sync(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/validate-passcode(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/heatmap(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/activities(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/cleanup(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/me(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/session(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/set-role(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/check-groq-config(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/complaints(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/conversations(?:\/|$)/, authOnly: true },
  {
    pattern: /^\/api\/flashcards(?:\/|$)/,
    roles: ["student", "teacher", "admin"],
  },
  { pattern: /^\/api\/groq(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/images(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/labels(?:\/|$)/, roles: ["admin", "teacher", "student"] },
  { pattern: /^\/api\/notifications(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/notifications\/seed(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/api\/notices(?:\/|$)/, roles: ["teacher", "admin", "staff"] },
  {
    pattern: /^\/api\/productivity(?:\/|$)/,
    roles: ["student", "teacher", "admin"],
  },
  { pattern: /^\/api\/settings(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/stats(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/upload\/avatar(?:\/|$)/, authOnly: true },
  {
    pattern: /^\/api\/upload\/certificate(?:\/|$)/,
    roles: ["teacher", "admin"],
  },
  {
    pattern: /^\/api\/achievements(?:\/|$)/,
    authOnly: true,
  },
];

function normalizeRoles(allowedRoles) {
  if (!allowedRoles) return [];
  return Array.isArray(allowedRoles)
    ? allowedRoles.filter(Boolean)
    : [allowedRoles];
}

function getApiRouteRule(pathname) {
  if (!pathname || !pathname.startsWith("/api/")) {
    return null;
  }

  if (PUBLIC_API_PATHS.has(pathname)) {
    return { public: true };
  }

  if (
    PUBLIC_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return { public: true };
  }

  if (
    SERVICE_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return { service: true };
  }

  // Collect every rule that matches and prefer the most specific one
  // (longest matching pattern). This prevents a generic rule listed before a
  // specific one from silently shadowing it (e.g. /api/notifications vs
  // /api/notifications/seed).
  let bestRule = null;
  let bestLength = -1;

  for (const rule of API_ROUTE_RULES) {
    const match = pathname.match(rule.pattern);
    if (!match) continue;
    // Length of the matched substring — the longer the match, the more
    // specific the rule.
    const matchedLength = (match[0] || "").length;
    if (matchedLength > bestLength) {
      bestRule = rule;
      bestLength = matchedLength;
    }
  }

  return bestRule || { authOnly: true };
}

export { API_ROUTE_RULES, normalizeRoles };
export default getApiRouteRule;
