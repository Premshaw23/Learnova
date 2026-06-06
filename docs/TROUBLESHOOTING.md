# Troubleshooting Guide

Common setup errors and how to fix them. If your issue is not listed here, open a [GitHub Discussion](https://github.com/Premshaw23/Learnova/discussions) or check [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Table of Contents

- [Environment Variables](#1-environment-variables)
- [Firebase](#2-firebase)
- [MongoDB](#3-mongodb)
- [Face API — Model Files](#4-face-api--model-files)
- [Vercel Blob](#5-vercel-blob)
- [General Next.js / Build Errors](#6-general-nextjs--build-errors)
- [Still Stuck?](#7-still-stuck)

---

## 1. Environment Variables

### Missing or wrong `.env.local`

**Symptom:** App crashes on startup, blank page, or `undefined` values in the console.

**Fix:**

1. Copy the example file and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
2. Make sure the file is named exactly `.env.local` — not `.env`, `.env.local.example`, or anything else.
3. Every variable must have a value. Never leave placeholders like `your_api_key` in place.
4. Restart the dev server after any change:
   ```bash
   # stop the server (Ctrl+C), then:
   npm run dev
   ```

### Complete `.env.local` reference

```env
# ── Firebase ──────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# ── MongoDB ───────────────────────────────────────────────
MONGODB_URI=

# ── Vercel Blob ───────────────────────────────────────────
BLOB_READ_WRITE_TOKEN=

# ── EmailJS ───────────────────────────────────────────────
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
```

> **Important:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secret keys (MongoDB URI, Blob token) under a `NEXT_PUBLIC_` prefix.

### Variable not picked up after editing

Next.js caches env values at startup. After editing `.env.local` you **must** restart the dev server — a hot-reload is not enough.

---

## 2. Firebase

### Setup checklist

Before debugging auth errors, verify each of these in the [Firebase Console](https://console.firebase.google.com):

- [ ] **Authentication is enabled** — Firebase Console → Build → Authentication → Sign-in method → Email/Password is turned **On**
- [ ] **App domain is authorised** — Authentication → Settings → Authorised domains includes `localhost` (for local dev) and your production domain
- [ ] **Project ID matches** — the `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in `.env.local` exactly matches the Project ID shown in Firebase Console → Project settings
- [ ] **Web app is registered** — Project settings → Your apps → a Web app (`</>`) exists and its config matches your env variables

---

### `auth/invalid-api-key`

**Cause:** `NEXT_PUBLIC_FIREBASE_API_KEY` is wrong or missing.

**Fix:** Copy the API key from Firebase Console → Project settings → Your apps → SDK setup and configuration. Paste it into `.env.local` and restart the server.

---

### `auth/configuration-not-found` or `auth/operation-not-allowed`

**Cause:** The sign-in method (e.g. Email/Password) is not enabled in Firebase.

**Fix:** Firebase Console → Authentication → Sign-in method → enable Email/Password.

---

### `auth/unauthorized-domain`

**Cause:** The domain you are running on is not in Firebase's authorised list.

**Fix:** Firebase Console → Authentication → Settings → Authorised domains → Add domain. For local development add `localhost`.

---

### `FirebaseError: Firebase: No Firebase App '[DEFAULT]' has been created`

**Cause:** `lib/firebaseConfig.js` is not being imported before Firebase is used, or the import path is wrong.

**Fix:** Make sure `lib/firebaseConfig.js` is imported at the top of every file that calls Firebase, and that the path resolves correctly. Check your `jsconfig.json` path aliases if you use them.

---

## 3. MongoDB

### Connection debugging steps

1. **Check the URI format.** A valid Atlas URI looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```
   A local URI looks like:
   ```
   mongodb://localhost:27017/<dbname>
   ```

2. **URL-encode special characters** in the password. Characters like `@`, `#`, `$`, `/` will break the URI. Encode them — e.g. `@` → `%40`.

3. **Whitelist your IP in Atlas.** MongoDB Atlas → Network Access → Add IP Address. For development add `0.0.0.0/0` (allow all) temporarily; use a specific IP in production.

4. **Check Atlas user permissions.** Database Access → your user should have at least `readWrite` on the target database.

---

### `MongoServerError: bad auth`

**Cause:** Wrong username or password in the URI.

**Fix:** Reset the database user password in Atlas → Database Access, update `MONGODB_URI`, and restart the server.

---

### `MongoNetworkError: connection timed out`

**Cause:** Your IP is not whitelisted, or the cluster is paused (Atlas free tier pauses after inactivity).

**Fix:**
- Whitelist your IP (see step 3 above).
- In Atlas, click **Resume** if the cluster is paused.

---

### `MONGODB_URI is not defined`

**Cause:** The variable is missing from `.env.local` or the server has not been restarted since it was added.

**Fix:** Add `MONGODB_URI=your_connection_string` to `.env.local` and restart the dev server.

---

## 4. Face API — Model Files

### `Error: Failed to load model from URL`  /  `404 on model JSON`

Face API.js loads model weights from the `/public` folder at runtime. If the files are missing, face recognition will not work.

**Fix:**

1. Download the Face API model files from the [face-api.js models repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights).
2. Place them in `public/models/`:
   ```
   public/
   └── models/
       ├── face_recognition_model-weights_manifest.json
       ├── face_recognition_model-shard1
       ├── tiny_face_detector_model-weights_manifest.json
       ├── tiny_face_detector_model-shard1
       ├── face_landmark_68_model-weights_manifest.json
       └── face_landmark_68_model-shard1
       └── ... (other models as needed)
   ```
3. Verify the path used in `components/FaceRecognizer.js` matches — it should be `/models`, not `./models` or an absolute path.

---

### Camera permission denied / no video stream

**Fix:**
- Allow camera access in your browser when prompted.
- Make sure you are on `http://localhost` or an `https://` origin — browsers block camera access on plain `http` for non-localhost origins.

---

### Face not detected / recognition always fails

**Fix:**
- Ensure adequate lighting.
- The registered face image and the live feed should use the same camera angle and resolution where possible.
- If running in a VM or WSL, the webcam may not be passed through — test on a physical machine or browser directly.

---

## 5. Vercel Blob

### `BlobAccessError: No token provided`

**Cause:** `BLOB_READ_WRITE_TOKEN` is missing or empty.

**Fix:**
1. Go to your Vercel dashboard → Storage → your Blob store → `.env.local` tab.
2. Copy the `BLOB_READ_WRITE_TOKEN` value.
3. Add it to `.env.local` and restart the server.

---

### `BlobAccessError: Token does not have write access`

**Cause:** The token is read-only.

**Fix:** In Vercel → Storage → Blob → Tokens, create a token with **Read & Write** permissions and replace the existing token in `.env.local`.

---

### Blob uploads fail in local development

**Cause:** Vercel Blob requires a valid token even locally — it always calls the Vercel API.

**Fix:** Make sure `BLOB_READ_WRITE_TOKEN` is set in `.env.local`. There is no offline/mock mode for Vercel Blob.

---

## 6. General Next.js / Build Errors

### `Module not found: Can't resolve '...'`

**Fix:** Run `npm install` to make sure all dependencies are installed. If you recently pulled changes, dependencies may have been added.

---

### `Error: hydration failed` / content mismatch

**Cause:** Server-rendered HTML differs from what React renders on the client — often caused by browser extensions, dynamic data, or improper use of `window`/`localStorage` on the server.

**Fix:** Wrap browser-only code in a `useEffect` hook or use `dynamic(() => import(...), { ssr: false })` for components that rely on browser APIs.

---

### Port 3000 already in use

```bash
# Find and kill the process using port 3000
# macOS / Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

Or run on a different port:
```bash
npm run dev -- -p 3001
```

---

### Build succeeds locally but fails on Vercel

**Common causes:**
- Environment variables not added to the Vercel dashboard (Settings → Environment Variables).
- Case-sensitive import paths — Linux (Vercel) is case-sensitive, Windows/macOS may not be.
- Missing `npm run build` test locally before pushing.

**Fix:** Always run `npm run build` locally before opening a PR to catch build errors early.

---

## 7. Still Stuck?

If none of the above resolves your issue:

1. **Search existing issues** — [github.com/Premshaw23/Learnova/issues](https://github.com/Premshaw23/Learnova/issues)
2. **Open a Discussion** — [github.com/Premshaw23/Learnova/discussions](https://github.com/Premshaw23/Learnova/discussions) — include your error message, OS, Node.js version (`node -v`), and the steps you have already tried.
3. **For security vulnerabilities** — do not open a public issue; follow the process in [SECURITY.md](../SECURITY.md).
