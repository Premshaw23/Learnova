# Issue #4 — Cross-Database Consistency Failures Between Firestore and MongoDB Leave Users in Unrecoverable Broken States

**Severity:** Critical  
**Subsystem:** Registration + Role Assignment + Gamification + Attendance  
**Tags:** data-loss, consistency, firestore, mongodb, registration

---

## Description

The application splits its data across two database systems — Firebase Firestore (auth profiles, attendance, notices, settings) and MongoDB (registration, gamification, labels, productivity, exceptions). There is **no distributed transaction or compensating action mechanism** across these systems. Several critical write paths can partially fail, leaving user accounts in unrecoverable broken states where data exists in one system but not the other.

The most impactful case: when MongoDB sync fails during role assignment (`POST /api/auth/set-role`), the error is silently logged and the response returns HTTP 201 success. The user exists in Firebase Auth and Firestore but has **no MongoDB document**. Any subsequent attempt to earn XP, use biometric labels, or query gamification data fails silently or throws an unrecoverable error.

---

## Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `app/api/auth/set-role/route.js` | 89–120 | MongoDB sync failure silently swallowed; user has no MongoDB doc |
| `lib/gamification-service.js` | 222–252 | `updateOne` has no upsert; missing doc causes infinite retry then throw |
| `app/api/register/route.js` | 381–394, 443 | TOCTOU race between `findOne` duplicate check and `insertOne` (partially mitigated by unique index) |
| `app/api/attendance/record/route.js` | (check dual-write fix PR #1602) | Even after PR #1602, Firestore write and MongoDB awardXp are not in a distributed transaction |
| `app/api/attendance/sync/route.js` | (same) | Same dual-write gap |

---

## Root Cause

### Bug A — set-role silently swallows MongoDB sync failure

`app/api/auth/set-role/route.js:87–120`:

```js
// Sync user to MongoDB so gamification (awardXp) and biometric labels
// endpoints can locate the student by their Firebase UID.
try {
  const mongoDB = await connectDb();
  const now = new Date().toISOString();
  await mongoDB.collection("users").updateOne(
    { firebaseUid: decodedToken.uid },
    { $set: { ... }, $setOnInsert: { ... } },
    { upsert: true }
  );
} catch (mongoErr) {
  // MongoDB sync is non-blocking — Firestore is the primary store.
  // Log the error but do not fail the registration flow.
  console.error("[set-role] MongoDB user sync failed:", mongoErr.message);
}

return jsonSuccess({ userProfile }, 201);  // returns 201 even on MongoDB failure
```

When MongoDB sync fails:
- Firestore user profile IS created (Firestore `set()` call at line 82–85).
- Firebase custom claims ARE set (line 64).
- MongoDB user document is NOT created.
- The API returns **HTTP 201 Success**.

### Bug B — awardXp has no upsert, fails for missing documents

`lib/gamification-service.js:222–231`:

```js
const updateResult = await db.collection("users").updateOne(
  { firebaseUid, $or: [
    { version: currentVersion },
    { version: { $exists: false } }
  ]},
  { $set: updateFields }
  // No upsert: true
);

if (updateResult.matchedCount > 0) { /* success */ }
// Otherwise retry... after MAX_RETRIES attempts, throw
```

If the user has no MongoDB document (due to Bug A), `matchedCount` is always 0. The retry loop runs `MAX_RETRIES` times and then throws: `"Failed to award XP for user X after N concurrent retry attempts."`

This exception propagates up to attendance recording routes, breaking the attendance marking flow.

### Bug C — Registration creates MongoDB doc but not Firestore profile

`app/api/register/route.js` creates a MongoDB document (with face descriptor, name, email, rollNo) but does NOT create a Firestore user profile. The Firestore profile is created in a **separate API call** to `POST /api/auth/set-role`. If the user calls register but never calls set-role (or set-role fails), they exist in MongoDB but not in Firestore:

- Attendance recording (which queries Firestore) fails.
- Role-based dashboard access (which reads custom claims + Firestore) fails.
- The user can't mark attendance, access dashboards, or use most features.

---

## Impact

- **Unrecoverable user states**: Users with Firestore profile but no MongoDB doc, or MongoDB doc but no Firestore profile.
- **Broken gamification**: XP earned through attendance marking is permanently lost. The `awardXp` function throws after retries, propagating up to break the attendance recording endpoint itself.
- **Broken attendance**: If `awardXp` throws during attendance recording (either the `record` or `sync` route), the attendance event fails entirely even though the Firestore write succeeded.
- **Labels/biometric lookup fails**: The labels API and FaceRecognizer query MongoDB. Users without MongoDB docs won't appear in searches, breaking face-based attendance.
- **No operator visibility**: MongoDB sync failures in set-role only produce a `console.error` log message. No monitoring, no alerting, no automatic retry, no admin notification.

---

## Reproduction Steps

1. **MongoDB missing user (Firestore exists only)**:
   - As a new user, call `POST /api/auth/set-role` with valid token and role.
   - Simulate MongoDB failure (e.g., restart MongoDB or add a transient network delay).
   - Observe: API returns 201 success, user exists in Firestore but NOT in MongoDB.
   - Call `POST /api/attendance/record` to mark attendance.
   - Observe: Firestore attendance is recorded, but gamification XP award fails → entire request returns 500.
   - Call `GET /api/labels?search=me` → user is not found (queries MongoDB).

2. **MongoDB-only user (no Firestore)**:
   - Register via `POST /api/register` with face photo and valid token.
   - Do NOT call `POST /api/auth/set-role` (or the call fails).
   - Observe: User exists in MongoDB with face descriptor but has no Firestore profile.
   - Attempt to mark attendance → fails because attendance queries Firestore.

---

## Suggested Fix

### Phase 1 — Make set-role MongoDB sync resilient
- Replace the silent catch in `app/api/auth/set-role/route.js:116–120` with a retry loop (3 attempts with exponential backoff, 500ms base).
- If all retries fail, **return HTTP 500** with clear error message and compensation: the Firestore profile and auth claims should be rolled back (delete user from Firestore, remove custom claims).
- Add a `rollbackOnFailure` helper that undoes partial writes when the cross-system operation cannot complete.

### Phase 2 — Add idempotent reconciliation endpoint
- Create `POST /api/admin/reconcile-user` that takes a Firebase UID and ensures the user exists in both Firestore and MongoDB.
- Add a cron job or webhook that runs reconciliation periodically.
- Add a self-service "retry sync" button in the user profile/settings UI.

### Phase 3 — Make awardXp resilient to missing documents
- Change `lib/gamification-service.js:222–231` to use `updateOne` with `upsert: true` for the initial gamification document creation.
- Initialize default values (totalXp: 0, currentLevel: 1, etc.) in the upsert.
- Keep the version-based OCC for subsequent writes to prevent race conditions.

### Phase 4 — Add cross-system consistency checks
- Add a startup health check that verifies a sample of users exist in both databases.
- Add a migration script to find and fix orphaned records (Firestore-only or MongoDB-only).
- Add structured logging (JSON with fields `firestoreUid`, `mongoCount`, `action`) to all cross-system write paths.

---

## Files Requiring Changes

1. `app/api/auth/set-role/route.js` — Add retry + rollback for MongoDB sync failure.
2. `lib/gamification-service.js` — Add upsert fallback for missing documents.
3. `app/api/admin/reconcile/route.js` or similar — New reconciliation endpoint.
4. New cross-system consistency checker utility.
5. Tests for partial-failure scenarios.
