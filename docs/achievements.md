# Student Achievement & Digital Certificate Management

Issue #3352 — production achievement and certificate system for Learnova.

## MongoDB Schema (`achievements` collection)

| Field | Type | Description |
|-------|------|-------------|
| `achievementId` | string (UUID) | Unique identifier |
| `studentId` | string | Firebase UID of student |
| `studentName` | string | Display name |
| `instituteId` | string \| null | Institute scope |
| `title` | string | Achievement title |
| `description` | string | Details |
| `category` | enum | Academic, Sports, Technical, Cultural, Leadership, Community Service, Competition, Other |
| `certificateUrl` | string \| null | Vercel Blob URL |
| `achievementDate` | ISO string | Date of achievement |
| `issuedBy` | `{ uid, name }` | Creator |
| `verificationStatus` | enum | Pending, Verified, Rejected |
| `verifiedBy` | `{ uid, name }` \| null | Verifier |
| `remarks` | string \| null | Verify/reject notes |
| `createdAt` | ISO string | Created timestamp |
| `updatedAt` | ISO string | Updated timestamp |

### Indexes

- `achievementId` (unique)
- `studentId` + `achievementDate`
- `instituteId` + `achievementDate`
- `verificationStatus`
- `category`

## API Endpoints

| Route | Method | Roles | Description |
|-------|--------|-------|-------------|
| `/api/achievements` | POST | teacher, admin | Create achievement |
| `/api/achievements/[id]` | PUT | teacher, admin | Update achievement |
| `/api/achievements/[id]` | DELETE | teacher, admin | Delete achievement |
| `/api/achievements/[id]/verify` | PATCH | teacher, admin | Verify or reject |
| `/api/achievements/student/[studentId]` | GET | student*, teacher, admin, parent† | List student achievements |
| `/api/achievements/institute` | GET | institute, admin | Institute-scoped list |
| `/api/achievements/parent/[studentId]` | GET | parent† | Parent child view + stats |
| `/api/achievements/analytics` | GET | teacher, institute, admin | Analytics aggregates |
| `/api/upload/certificate` | POST | teacher, admin | Upload PDF/PNG/JPG |

\* Students may only access their own `studentId`.  
† Parents must have an active `parent_student_links` Firestore document.

### Query Parameters (list endpoints)

- `search` — title or student name
- `category` — filter by category
- `status` — Pending | Verified | Rejected
- `from` / `to` — date range (ISO strings)
- `instituteId` — admin-only institute filter

## Role Permissions

| Action | Student | Teacher | Parent | Institute | Admin |
|--------|---------|---------|--------|-----------|-------|
| View own achievements | ✅ | — | — | — | ✅ |
| View child achievements | — | — | ✅ (linked) | — | ✅ |
| View institute achievements | — | ✅ | — | ✅ | ✅ |
| Create / update / delete | — | ✅‡ | — | — | ✅ |
| Verify / reject | — | ✅‡ | — | — | ✅ |
| Upload certificate | — | ✅ | — | — | ✅ |
| Analytics | — | ✅‡ | — | ✅ | ✅ |

‡ Scoped to same institute as the student.

## Upload Flow

1. Teacher selects PDF, PNG, or JPG (max 5MB).
2. `POST /api/upload/certificate` validates magic bytes and uploads to Vercel Blob under `certificates/{uid}/`.
3. Returned `url` is included in `POST /api/achievements`.
4. Students/parents preview via modal (iframe for PDF, img for images) and download via blob URL.

## Notifications

MongoDB `notifications` collection — `type: "achievement"`:

- Achievement created → student notified
- Verified → student + linked parents
- Rejected → student (with remarks)

## Frontend Components

- `components/achievements/StudentAchievementsPanel.jsx` — Student dashboard
- `components/achievements/TeacherAchievementPanel.jsx` — Teacher dashboard tab
- `components/achievements/AdminAchievementDashboard.jsx` — Admin tab
- `components/achievements/ParentAchievementsPanel.jsx` — Parent tab
- `components/achievements/InstituteAchievementPanel.jsx` — Institute tab
- `components/achievements/AchievementAnalytics.jsx` — Recharts analytics

> **Note:** `components/AchievementSection.jsx` is the separate attendance gamification badge system — not part of this feature.
