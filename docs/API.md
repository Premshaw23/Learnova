# API Reference

All endpoints are Next.js App Router route handlers under `app/api/`. Every request must include a valid Firebase ID token in the `Authorization` header unless stated otherwise.

```
Authorization: Bearer <firebase_id_token>
```

Rate limiting is applied per IP and per user on all endpoints. Exceeding the limit returns `429 Too Many Requests`.

---

## Table of Contents

- [Auth](#auth)
- [Register](#register)
- [Attendance](#attendance)
- [Notices](#notices)
- [Stats](#stats)
- [Student — Gamification](#student--gamification)
- [Upload](#upload)
- [Health](#health)
- [Institute](#institute)
- [Admin](#admin)
- [Parent](#parent)
- [Courses](#courses)
- [Notifications](#notifications)
- [Productivity](#productivity)
- [Quiz Sessions](#quiz-sessions)
- [Study AI](#study-ai)
- [Timetable](#timetable)
- [Groq / AI](#groq--ai)
- [Cron Jobs](#cron-jobs)
- [Other Endpoints](#other-endpoints)
- [Common Response Shapes](#common-response-shapes)
- [Error Codes](#error-codes)

---

## Auth

### `GET /api/auth/me`
Returns the current user's role from Firestore and compares it to the JWT claim. Use this to detect stale JWT roles after a role change.

**Auth required:** Yes — any authenticated user

**Response `200`**
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "emailVerified": true,
  "role": "student",
  "jwtRole": "student",
  "rolesInSync": true
}
```

---

### `POST /api/auth/session`
Creates a stateful Redis session and sets `authToken` + `sessionId` as `httpOnly` cookies.

**Auth required:** Yes  
**Header required:** `Authorization: Bearer <token>`

**Response `200`**
```json
{
  "success": true,
  "uid": "firebase_uid"
}
```

Sets cookies:
- `authToken` — Firebase ID token (httpOnly, 1 hour)
- `sessionId` — Redis session ID (httpOnly, 1 hour)

---

### `DELETE /api/auth/session`
Terminates the Redis session and clears both auth cookies.

**Auth required:** Yes

**Response `200`**
```json
{ "success": true }
```

---

### `GET /api/auth/csrf`
Returns a CSRF token for form submissions.

**Auth required:** No

---

### `POST /api/auth/set-role`
Sets the role custom claim on the user's Firebase token.

**Auth required:** Yes — admin only

**Request body**
```json
{
  "uid": "firebase_uid",
  "role": "student | teacher | admin | staff | parent"
}
```

---

### `POST /api/auth/reset-password`
Triggers a Firebase password reset email.

**Auth required:** No

**Request body**
```json
{ "email": "user@example.com" }
```

---

### `DELETE /api/auth/cleanup`
Removes stale or orphaned auth records.

**Auth required:** Yes — admin only

---

## Register

### `POST /api/register`
Registers a new user with their face photo. Uploads the image to Vercel Blob and writes the user record to MongoDB. Supports idempotency keys to prevent duplicate submissions on retry.

**Auth required:** Yes — authenticated user can only register themselves  
**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 100 chars |
| `rollNo` | string | Yes | Max 50 chars, must be unique |
| `email` | string | Yes | Must match the authenticated user's email |
| `photo` | file | Yes | JPEG / PNG / WebP, max 5 MB |
| `faceDescriptor` | string | No | JSON-serialised 128-D float array from Face API.js |
| `idempotencyKey` | string | No | Unique key to safely retry without duplicate registration |

**Response `201`**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "mongo_object_id",
    "name": "Jane Doe",
    "rollNo": "CS2024001",
    "email": "jane@example.com"
  }
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Missing/invalid fields or invalid face descriptor |
| `403` | Trying to register for a different user |
| `409` | Roll number or email already registered |
| `413` | File exceeds 5 MB |
| `415` | Invalid image content (magic bytes mismatch) |
| `429` | Rate limit exceeded |

---

## Attendance

### `POST /api/attendance/record`
Records attendance for a student after face recognition. Confidence score must be ≥ 60.

**Auth required:** Yes — student (own record only) or teacher / admin

**Request body**
```json
{
  "userId": "firebase_uid",
  "studentName": "Jane Doe",
  "email": "jane@example.com",
  "confidenceScore": 87,
  "date": "2026-06-06"
}
```

`date` is optional — defaults to today's local date.

**Response `201`**
```json
{ "success": true, "alreadyRecorded": false }
```

**Response `200`** (already marked present today)
```json
{ "success": true, "alreadyRecorded": true }
```

---

### `GET /api/attendance/heatmap`
Returns attendance data formatted for a calendar heatmap.

**Auth required:** Yes — student (own data) or teacher / admin

---

### `GET /api/attendance/settings`  
### `POST /api/attendance/settings`
Get or update institute attendance settings (e.g. minimum attendance threshold).

**Auth required:** Yes — teacher / admin

---

### `POST /api/attendance/sync`
Syncs attendance records between Firestore and MongoDB.

**Auth required:** Yes — admin

---

### `POST /api/attendance/validate-passcode`
Validates a teacher-generated passcode for manual attendance entry.

**Auth required:** Yes — student

**Request body**
```json
{ "passcode": "ABC123" }
```

---

### `GET /api/attendance-warnings`
Returns a list of students below the minimum attendance threshold.

**Auth required:** Yes — teacher / admin

---

## Notices

### `POST /api/notices`
Creates and publishes a new notice. Writes to Firestore, syncs to MongoDB, and publishes to Redis for real-time SSE delivery.

**Auth required:** Yes — teacher / admin / staff only

**Request body**
```json
{
  "title": "Exam Schedule Released",
  "content": "Semester exams begin 10 July 2026.",
  "category": "academic"
}
```

**Response `200`**
```json
{
  "success": true,
  "notice": {
    "id": "firestore_doc_id",
    "title": "Exam Schedule Released",
    "content": "Semester exams begin 10 July 2026.",
    "author": "Prof. Smith",
    "authorId": "firebase_uid",
    "authorRole": "teacher",
    "instituteId": "inst_abc",
    "createdAt": "2026-06-06T10:00:00.000Z"
  }
}
```

---

### `GET /api/notices/stream`
Server-Sent Events (SSE) stream for real-time notice delivery.

**Auth required:** Yes  
**Response:** `text/event-stream`

---

## Stats

### `GET /api/stats`
Returns the current user's academic stats from Firestore.

**Auth required:** Yes — any authenticated user

**Response `200`**
```json
{
  "success": true,
  "stats": {
    "Courses Enrolled": 4,
    "Attendance Rate": "87%",
    "Assignments Done": 12,
    "Study Hours": 34,
    "lastUpdated": "2026-06-06T10:00:00.000Z"
  }
}
```

Returns `{ "stats": null }` if not yet initialised.

---

### `POST /api/stats`
Updates or initialises stats. Three actions are supported.

**Auth required:** Yes — any authenticated user

**Action: `initialize`** — creates default stats document
```json
{ "action": "initialize" }
```

**Action: `update`** — increments a stat field
```json
{
  "action": "update",
  "statField": "Study Hours",
  "value": 2
}
```
Allowed `statField` values: `Courses Enrolled`, `Assignments Done`, `Study Hours`  
`value` is clamped to ±100.

**Action: `recalculateAttendance`** — recalculates attendance rate from records
```json
{ "action": "recalculateAttendance" }
```

---

## Student — Gamification

### `GET /api/student/gamification`
Returns the authenticated student's XP, level, streak, and badges.

**Auth required:** Yes — student / admin

**Response `200`**
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "totalXp": 1240,
    "currentLevel": 3,
    "xpToNextLevel": 500,
    "unlockedBadges": ["first_attendance", "week_streak"],
    "lastAttendanceDate": "2026-06-05"
  }
}
```

---

### `POST /api/student/gamification/award`
Awards XP or a badge to a student.

**Auth required:** Yes — teacher / admin

**Request body**
```json
{
  "studentUid": "firebase_uid",
  "xp": 50,
  "badge": "perfect_week"
}
```

---

## Upload

### `POST /api/upload/avatar`
Uploads a profile avatar to Vercel Blob and updates the user's image URL in MongoDB.

**Auth required:** Yes — any authenticated user (own avatar only)  
**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | Yes | JPEG / PNG / WebP, max 5 MB |

**Response `200`**
```json
{
  "success": true,
  "data": { "url": "https://blob.vercel-storage.com/avatars/uid/..." }
}
```

---

## Health

### `GET /api/health`
Returns the health status of all backend dependencies. No authentication required. Used by uptime monitors and CI/CD pipelines.

**Auth required:** No

**Response `200` (healthy)**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "responseTimeMs": 42,
  "version": "1.0.0",
  "checks": {
    "mongodb": { "status": "healthy", "latencyMs": 12 },
    "firebase": { "status": "healthy", "latencyMs": 8 },
    "redis": { "status": "healthy", "latencyMs": 5 }
  }
}
```

**Response `503`** if all checks are unhealthy. Status is `"degraded"` if some (but not all) checks fail.

---

### `GET /api/health/rate-limit`
Returns current rate limit status for the requesting IP.

**Auth required:** No

---

## Institute

### `GET /api/institute/stats`
Returns institution-wide statistics.

**Auth required:** Yes — admin / institute role

---

### `GET /api/institute/attendance-requests`  
### `POST /api/institute/attendance-requests`
Lists or creates attendance exception requests.

**Auth required:** Yes — teacher / admin

---

### `POST /api/institute/bulk-import`
Bulk imports students via CSV or JSON payload.

**Auth required:** Yes — admin only

---

## Admin

### `GET /api/admin/stats`
Returns platform-wide admin statistics.

**Auth required:** Yes — admin only

---

### `GET /api/admin/parent-student-link`  
### `POST /api/admin/parent-student-link`
Manages parent–student account linking.

**Auth required:** Yes — admin only

---

### `POST /api/admin/reconcile`
Reconciles data inconsistencies between Firestore and MongoDB.

**Auth required:** Yes — admin only

---

### `POST /api/admin/reconciliation-job`
Triggers a scheduled reconciliation job manually.

**Auth required:** Yes — admin only

---

### `DELETE /api/admin/sessions/terminate`
Force-terminates a user's active session.

**Auth required:** Yes — admin only

**Request body**
```json
{ "sessionId": "redis_session_id" }
```

---

## Parent

### `GET /api/parent/dashboard`
Returns the parent's dashboard summary including linked students.

**Auth required:** Yes — parent role

---

### `GET /api/parent/student/[studentId]/attendance`
Returns attendance records for a linked student.

**Auth required:** Yes — parent (linked to student only)

---

### `GET /api/parent/student/[studentId]/grades`
Returns grade data for a linked student.

**Auth required:** Yes — parent (linked to student only)

---

### `GET /api/parent/student/[studentId]/notices`
Returns notices relevant to a linked student.

**Auth required:** Yes — parent (linked to student only)

---

## Courses

### `GET /api/courses`  
### `POST /api/courses`
Lists all courses or creates a new course.

**Auth required:** Yes — student (GET), teacher / admin (POST)

---

### `GET /api/courses/curriculum/[courseId]`  
### `PUT /api/courses/curriculum/[courseId]`
Gets or updates the curriculum for a specific course.

**Auth required:** Yes — teacher / admin

---

### `POST /api/courses/curriculum/sync`
Syncs curriculum data.

**Auth required:** Yes — admin

---

## Notifications

### `GET /api/notifications`  
### `POST /api/notifications`
Lists notifications for the current user or creates a new notification.

**Auth required:** Yes — any authenticated user (GET), admin / teacher (POST)

---

### `POST /api/notifications/seed`
Seeds test notification data (development only).

**Auth required:** Yes — admin

---

## Productivity

### `GET /api/productivity`  
### `POST /api/productivity`
Gets or logs productivity data for the current user.

**Auth required:** Yes — any authenticated user

---

### `GET /api/productivity/session`  
### `POST /api/productivity/session`
Gets or creates a productivity session (e.g. study timer session).

**Auth required:** Yes — any authenticated user

---

### `POST /api/ai-productivity`
Generates AI-powered productivity recommendations using Groq.

**Auth required:** Yes — any authenticated user

---

## Quiz Sessions

### `POST /api/quiz-sessions/create`
Creates a new quiz session.

**Auth required:** Yes — student

**Request body**
```json
{
  "courseId": "course_abc",
  "quizId": "quiz_123"
}
```

---

### `GET /api/quiz-sessions`
Lists quiz sessions for the current user.

**Auth required:** Yes — student

---

### `POST /api/quiz-sessions/answer`
Submits an answer for the current question in a session.

**Auth required:** Yes — student

---

### `POST /api/quiz-sessions/submit`
Submits and finalises a quiz session.

**Auth required:** Yes — student

---

### `GET /api/quiz-sessions/[sessionId]/progress`
Returns progress for a specific quiz session.

**Auth required:** Yes — student (own session only)

---

### `POST /api/quiz-sessions/[sessionId]/abandon`
Abandons an in-progress quiz session.

**Auth required:** Yes — student (own session only)

---

## Study AI

### `POST /api/StudyAI/embed`
Generates and stores embeddings for study material.

**Auth required:** Yes — teacher / admin

**Request body**
```json
{
  "content": "Text content to embed...",
  "courseId": "course_abc"
}
```

---

### `POST /api/StudyAI/retrieve`
Retrieves relevant study material using semantic search.

**Auth required:** Yes — student / teacher

**Request body**
```json
{
  "query": "What is supervised learning?",
  "courseId": "course_abc"
}
```

---

## Timetable

### `POST /api/timetable/sync`
Syncs the timetable data.

**Auth required:** Yes — teacher / admin

---

### `GET /api/timetable/ical/[token]/feed.ics`
Returns the timetable as an iCal feed. The `token` is a user-specific calendar token.

**Auth required:** No (token in URL acts as auth)  
**Response:** `text/calendar`

---

## Groq / AI

### `POST /api/groq`
Sends a prompt to the Groq LLM and returns the AI response. Powers the in-app chatbot.

**Auth required:** Yes — any authenticated user

**Request body**
```json
{
  "messages": [
    { "role": "user", "content": "Explain recursion in simple terms." }
  ]
}
```

---

### `GET /api/check-groq-config`
Verifies that the Groq API key is configured correctly.

**Auth required:** Yes — admin

---

## Cron Jobs

These endpoints are called by Vercel Cron on a schedule. They should not be called manually in production.

### `POST /api/cron/attendance-risk`
Scans for students at attendance risk and triggers warnings.

**Auth required:** Vercel Cron secret header

---

### `POST /api/cron/attendance-warnings`
Sends attendance warning notifications to at-risk students.

**Auth required:** Vercel Cron secret header

---

## Other Endpoints

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `GET /api/activities` | GET | Lists activities | Any |
| `POST /api/activities` | POST | Creates an activity | Teacher / Admin |
| `GET /api/analytics/attendance-risk` | GET | Attendance risk analytics | Teacher / Admin |
| `GET /api/complaints` | GET | Lists complaints | Admin |
| `POST /api/complaints` | POST | Submits a complaint | Any |
| `GET /api/conversations` | GET | Lists AI chat conversations | Any |
| `POST /api/conversations` | POST | Creates a conversation | Any |
| `GET /api/exceptions/list` | GET | Lists attendance exceptions | Teacher / Admin |
| `POST /api/exceptions/create` | POST | Creates an exception | Teacher / Admin |
| `PUT /api/exceptions/update` | PUT | Updates an exception | Teacher / Admin |
| `GET /api/exceptions/all` | GET | Lists all exceptions | Admin |
| `GET /api/flashcards` | GET | Lists flashcards | Student |
| `POST /api/flashcards` | POST | Creates flashcards | Student |
| `GET /api/images` | GET | Lists uploaded images | Teacher / Admin |
| `GET /api/labels` | GET | Lists face recognition labels | Teacher / Admin |
| `GET /api/settings` | GET | Gets user settings | Any |
| `PUT /api/settings` | PUT | Updates user settings | Any |

---

## Common Response Shapes

### Success
```json
{
  "success": true,
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Error Codes

| Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthenticated — missing or invalid Firebase token |
| `403` | Forbidden — insufficient role or attempting to access another user's data |
| `404` | Resource not found |
| `409` | Conflict — resource already exists (e.g. duplicate registration) |
| `413` | Payload too large |
| `415` | Unsupported media type |
| `429` | Rate limit exceeded — slow down and retry |
| `500` | Internal server error |
| `502` | Upstream service error (e.g. saga/transaction failure) |
| `503` | Service unavailable (returned by `/api/health` when all checks fail) |
