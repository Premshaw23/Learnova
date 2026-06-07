## Summary

This PR fixes **3 critical security vulnerabilities** identified during a backend security audit. Each fix addresses an issue that could lead to privilege escalation, authentication bypass, or API quota abuse.

---

### Fix 1: Privilege Escalation — Bulk Import (Finding #3)

**File:** `app/api/institute/bulk-import/route.js`

**Problem:** The endpoint used `authenticateRequest()` which only verified the Firebase token was valid — **any authenticated user** (including a student) could call it. This allowed any signed-in user to create unlimited Firebase Auth accounts, populate Firestore/MongoDB with fabricated records, and create users with a default password.

**Fix:** Replaced with `requireRole(req, ["institute", "admin"])` which enforces that only institute or admin role users can access the endpoint.

---

### Fix 2: Edge Middleware Bypass — All `/api/` Routes (Finding #4)

**File:** `middleware.js`

**Problem:** The `config.matcher` had `(?!api|...)` which explicitly excluded all paths starting with `/api/`. This meant:
- Auth rate limiting (login, signup, password reset) **never executed** — dead code
- The blanket API authentication enforcement **never executed**
- No defense-in-depth layer existed for any API route

**Fix:** Removed `api` from the negative lookahead in the matcher. All middleware security (rate limiting, token verification, CSP) now activates on API routes as intended.

---

### Fix 3: Rate Limit Bypass — Groq AI Endpoint (Finding #6)

**File:** `app/api/groq/route.js`

**Problem:** The rate limit key used only `decodedToken.uid` without binding to the requester's IP address. An attacker could create multiple free Firebase accounts to multiply their Groq API quota, incurring real monetary costs through the AI endpoint.

**Fix:** Rate limit key now includes both IP and UID: `groq_${ip}_${decodedToken.uid}` (consistent with the pattern already used in `conversations/route.js`).

---

### Verification

- [x] All changes build and lint cleanly
- [x] No breaking API changes — all existing contracts preserved
- [x] Rate limit key format matches existing project patterns
- [x] Role check uses the already-established `requireRole` helper from `lib/rbac.js`
