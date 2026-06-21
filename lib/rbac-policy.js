export const PUBLIC_API_PATHS = new Set([
  "/api/auth/csrf",
  "/api/auth/reset-password",
  "/api/health",
]);

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

  return (
    API_ROUTE_RULES.find((rule) => rule.pattern.test(pathname)) || {
      authOnly: true,
    }
  );
}

export { API_ROUTE_RULES, normalizeRoles };
export default getApiRouteRule;
