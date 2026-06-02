# Issue #2 — Biometric Face Descriptors / User Images Accessible Without Authorization (IDOR)

**Severity:** Critical  
**Subsystem:** Images API + Labels API + Image Service  
**Tags:** security, privacy, IDOR, biometric-data, RBAC

---

## Description

The `GET /api/images` endpoint returns any user's uploaded facial photograph given only their MongoDB ObjectId, with **no ownership or role check**. Combined with the `GET /api/labels` endpoint that allows any authenticated student to search all users and determine who has a photo, this enables any authenticated user to enumerate and download the facial images of every user in the system.

Facial images are biometric data. Unauthorized access violates privacy regulations (GDPR Art. 9 — special category data) and the application's own privacy promises.

---

## Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `app/api/images/route.js` | 19–32 | `GET` handler calls only `requireAuth`, no ownership/RBAC check |
| `lib/images/imagesService.js` | 81–97 | `getUserImageFromDb` returns image for any valid ObjectId with no caller verification |
| `app/api/labels/route.js` | 24, 46–62 | Allows any student to search all users; returns `hasImage` flag enabling enumeration |

---

## Root Cause

### Bug A — GET /api/images has no authorization scope

`app/api/images/route.js:19–32`:

```js
export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  await requireAuth(request);                        // line 23 — ONLY checks auth, not ownership
  const imageUrl = await getUserImageFromDb({ id }); // line 25 — returns ANY user's image
  return new NextResponse(imageBuffer, { ... });
});
```

`requireAuth` only verifies that a valid Firebase token is present. It does **not** check:
- Whether the requester owns the image they're requesting.
- Whether the requester has the role required to view images.
- Whether the requester belongs to the same institution as the target user.

### Bug B — getUserImageFromDb has no caller context

`lib/images/imagesService.js:81–97`:

```js
export async function getUserImageFromDb({ id }) {
  const objectId = validateImageRequestId(id);
  const db = await connectDb();
  const users = db.collection("users");
  const user = await users.findOne(
    { _id: objectId },
    { projection: { image: 1 } }  // no restriction on who can query
  );
  if (!user?.image) throw new NotFoundError("Image not found");
  return user.image;
}
```

The function takes only `{ id }` — it has no way to verify the caller. It trusts the caller has already authorized.

### Bug C — Labels API enables enumeration

`app/api/labels/route.js:24`:

```js
await requireRole(request, ["admin", "teacher", "student"]);
```

Any **student** can search all users. The projection returns `_id`, `name`, `email`, `image` (line 48–54), then maps to `hasImage: !!image` (line 58–61). This gives an attacker the `_id` needed for Bug A, plus confirmation the target has a photo.

---

## Impact

- **Any authenticated user (including students) can download any other user's facial photograph** by guessing or enumerating MongoDB ObjectIds. ObjectIds are sequential with machine/host/process IDs, making them trivially enumerable in practice.
- **Biometric data exfiltration**: Facial images from the registration/face-recognition pipeline are exposed. These are privacy-sensitive biometric data points.
- **Privacy regulation violation**: GDPR Art. 9, India's DPDP Act 2023, and similar regulations classify facial images as sensitive biometric data requiring explicit consent and strict access controls.
- **No audit trail**: The endpoint has no logging of who accessed whose image.
- **Labels API provides the enumeration vector**: any student can list all users and check `hasImage`.

---

## Reproduction Steps

1. As a student user, open DevTools and call `GET /api/labels?search=teacher@example.com` to obtain the target's MongoDB `_id`.
2. Call `GET /api/images?id=<target._id>` with any valid auth token.
3. Observe that the response returns the target user's facial photograph.
4. Repeat with random ObjectIds to enumerate all users with photos.

---

## Suggested Fix

### Phase 1 — Add ownership check to GET /api/images
- Modify `app/api/images/route.js` GET handler to compare the requested user with `decodedToken.uid`.
- Add a `firebaseUid` field lookup: verify the caller owns the image before returning it.
- Add role-based exception: teachers may view images of their own students; admins may view any image (with audit logging).

### Phase 2 — Add institution scoping to labels API
- Modify `app/api/labels/route.js` to scope the query by the caller's institution.
- Students should only see users from their own institution.
- Remove the `hasImage` flag from the response for non-admin roles, or make it conditional.

### Phase 3 — Add audit logging to images GET
- Log `decodedToken.uid`, requested `id`, and timestamp for every image access.
- Add rate limiting to prevent bulk enumeration.

### Phase 4 — Strengthen getUserImageFromDb
- Accept a `callerUid` parameter and verify ownership before returning the image URL.
- Or, split the function: one for self-image access, another for authorized cross-user access.

---

## Files Requiring Changes

1. `app/api/images/route.js` — Add ownership check, audit logging.
2. `lib/images/imagesService.js` — Accept caller context, enforce ownership.
3. `app/api/labels/route.js` — Add institution scoping, conditional `hasImage`.
4. `lib/rbac.js` — Potentially add institution-aware helper.
5. Tests for new authorization logic.
