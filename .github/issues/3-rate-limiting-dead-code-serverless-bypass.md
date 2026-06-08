# Issue #3 — Rate Limiting Dead Code in Middleware + In-Memory Bypass on Serverless

**Severity:** High  
**Subsystem:** Middleware + Rate Limit Library  
**Tags:** security, rate-limiting, serverless, dead-code

---

## Description

The application has two layers of rate limiting, both of which are ineffective on Vercel serverless:

1. **Middleware rate limiting (`middleware.js`):** The entire auth-rate-limiting code block (lines 128–152) is dead code because the middleware matcher regex (line 296–298) excludes all `/api/*` paths. The middleware never executes for any API route.
2. **Library rate limiting (`lib/rateLimit.js`):** When MongoDB is unavailable (cold start), it silently falls back to a per-invocation in-memory `Map`. On Vercel serverless Node.js functions, each cold-start invocation gets a fresh Map with no prior state, effectively disabling rate limiting until the MongoDB connection is established.

Authentication endpoints (login, signup, forgot-password, verify-otp) have no route-level rate limit files — they were expected to be protected by the middleware, which never runs.

---

## Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `middleware.js` | 7–42, 128–152 | Rate limiting code never executes (matcher excludes `/api/*`) |
| `middleware.js` | 295–298 | Matcher pattern `/((?!api\|...).*)` excludes all API routes |
| `lib/rateLimit.js` | 59–110 | MongoDB-backed limiter silently falls back to per-invocation Map on failure |
| `lib/rateLimit.js` | 15–57 | `checkRateLimitFallback` uses in-memory Map with per-invocation scope |
| `app/api/auth/reset-password/route.js` | 2, 19–22 | Has per-route rate limiting (one of the few that does) |
| Various API route files | — | Most routes rely on `checkRateLimit` which has the fallback problem |

---

## Root Cause

### Bug A — Middleware matcher excludes API routes

`middleware.js:295–298`:

```js
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};
```

The negative lookahead `(?!api|...)` means the middleware only runs for paths that do **not** start with `api`, `_next/static`, etc. Lines 128–152 contain:

```js
if (isAuthRoute(pathname)) {
  const { allowed, remaining, retryAfter } = rateLimit(ip, pathname);
  if (!allowed) { /* return 429 */ }
}
```

`isAuthRoute` checks for `/api/auth/login`, `/api/auth/signup`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/verify-otp` — paths the middleware **never receives**. This code is entirely dead.

Notably, these paths (`/api/auth/login`, `/api/auth/signup`, `/api/auth/forgot-password`, `/api/auth/verify-otp`) **do not even have route handler files in `app/api/auth/`**. Only `set-role`, `cleanup`, and `reset-password` exist as routes. The middleware was rate-limiting phantom endpoints.

### Bug B — In-memory fallback is per-invocation on serverless

`lib/rateLimit.js:15–57`:

```js
const fallbackRateLimitMap = new Map();  // module-level — per serverless instance

function checkRateLimitFallback(userId) {
  // Reads/writes fallbackRateLimitMap
  // On Vercel cold start: this Map starts empty
  // All requests in the first batch pass through without limit
}
```

On Vercel serverless Node.js runtime:
- A "serverless function instance" processes one request at a time but may handle multiple requests sequentially (warm instances).
- On cold start, `fallbackRateLimitMap` is a fresh empty Map.
- The first N requests (where N = `MAX_REQUESTS_PER_WINDOW` = 10) will all bypass rate limiting because the Map is empty.
- After the MongoDB client connects (which takes 1–3s on cold start), the DB-backed limiter takes over.
- But in the critical first window, unlimited requests can hit auth/register endpoints.

### Bug C — Catch block swallows fallback silently

`lib/rateLimit.js:102–109`:

```js
} catch (err) {
  console.warn("[rate-limit] MongoDB unavailable, using in-memory fallback ...");
  return checkRateLimitFallback(userId);
}
```

The fallback is invoked silently on ANY error — not just connection failures, but also transient MongoDB errors (network blips, replica set elections, throttling). On Vercel's shared MongoDB Atlas tier, these are common. During these events, rate limiting degrades to per-invocation tracking with no warning to operators.

---

## Impact

- **Auth endpoints effectively have no rate limiting on cold starts**, enabling brute-force password attacks, registration spam, and enumeration attacks.
- **Dead code in middleware** creates a false sense of security. Anyone reviewing `middleware.js` would believe rate limiting is in place.
- **No monitoring signal** — the fallback happens silently via `console.warn` which is invisible in production log aggregation.
- **Attack window widens with traffic** — higher traffic = more cold starts = more requests bypassing rate limits.

---

## Reproduction Steps

1. **Middleware dead code**: Review `middleware.js:295–298` matcher. Confirm it uses negative lookahead `(?!api|...)`. Check that `middleware.js:128–152` (`isAuthRoute` + `rateLimit`) exists. Observe the matcher excludes all `/api/*` paths.
2. **Serverless bypass**: Deploy to Vercel. Force a cold start (wait for idle or use a new instance). Send 10 rapid requests to any protected endpoint. Observe all 10 succeed. The in-memory fallback Map is fresh per cold start.

---

## Suggested Fix

### Phase 1 — Remove dead middleware code
- Remove lines 7–42 (rate limit constants, functions) and lines 128–152 (rate limiting block) from `middleware.js`.
- The middleware should focus on CSP headers, route protection (already handled by individual routes), and auth redirects.

### Phase 2 — Replace in-memory fallback with resilient backend
- Add a Redis/Pizzly/Vercel KV backend for cross-instance rate limit state sharing.
- If a shared backend is not feasible, use the `@upstash/ratelimit` SDK (designed for serverless edge and Node.js runtimes) which uses HTTP-based Redis without persistent connections.
- Alternatively, use Vercel KV (Redis) directly.

### Phase 3 — Add circuit breaker and monitoring
- If MongoDB is unavailable for rate limiting, emit a metric/log event to an observability platform rather than silently degrading.
- Add a health-check endpoint that reports rate-limiting backend status.
- Fail open vs. fail closed decision: currently it fails open (all requests allowed) — document this trade-off explicitly.

### Phase 4 — Audit all routes for rate limit coverage
- Verify each auth-adjacent route (`/api/auth/*`, `/api/register`) has per-route rate limiting.
- Remove the phantom routes from `AUTH_RATE_LIMITED_PATHS` that don't exist as route handlers.

---

## Files Requiring Changes

1. `middleware.js` — Remove dead rate limiting code (lines 7–42, 128–152), optionally update matcher.
2. `lib/rateLimit.js` — Replace in-memory fallback with Vercel KV/Upstash backend, add circuit breaker.
3. `.env.example` — Document `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` or similar.
4. Potentially multiple API route files — audit and add missing per-route rate limiting.
