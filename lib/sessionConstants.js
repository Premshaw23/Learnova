// Single source of truth for how long a session lives, in seconds.
//
// This value is used both for:
//   - the `authToken`/`sessionId` cookie `maxAge` (app/api/auth/session/route.js)
//   - the Redis `session:{sessionId}` TTL and `user:sessions:{userId}` set
//     expiry (lib/sessionManager.js)
//
// These two had previously been set independently (1h cookie vs 24h Redis
// TTL), which meant a client's cookies could expire while the corresponding
// Redis session remained valid and visible to admin tooling for up to 23
// more hours, with no way for the legitimate user to terminate it
// themselves. Keeping both derived from this single constant guarantees they
// can't drift apart again.
export const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours