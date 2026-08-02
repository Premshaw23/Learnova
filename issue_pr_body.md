## Summary

This PR adds a comprehensive end-to-end (E2E) test suite for the attendance pipeline, addressing issue #4223. The attendance system is the core feature of Learnova, and this test suite validates the complete workflow from student check-in through teacher verification to parent dashboard display.

## Changes

### New Files
- `tests/fixtures/attendance.js` - Test fixtures with mock user accounts, API helpers, and common data
- `tests/e2e/attendance/student-flow.spec.js` - Student attendance flow tests (9 tests)
- `tests/e2e/attendance/teacher-override.spec.js` - Teacher override flow tests (11 tests)
- `tests/e2e/attendance/parent-dashboard.spec.js` - Parent dashboard flow tests (6 tests)
- `tests/e2e/attendance/offline-sync.spec.js` - Offline sync flow tests (6 tests)
- `tests/e2e/attendance/concurrent-load.spec.js` - Concurrent load tests (5 tests)

### Modified Files
- `playwright.config.js` - Updated for CI compatibility (webServer optional on CI)
- `package.json` - Added missing `@upstash/redis` dependency (pre-existing bug fix)
- `package-lock.json` - Updated lockfile

## Test Coverage

### Student Attendance Flow (9 tests)
- Record attendance with valid credentials
- Duplicate prevention (alreadyRecorded response)
- Reject low confidence score (<60)
- Reject non-numeric confidence score
- Reject student submitting for another user
- Reject student back-dating attendance
- Reject unauthenticated requests
- Handle missing required fields
- Passcode validation endpoint

### Teacher Override Flow (11 tests)
- Override to present/absent/late status
- Back-date attendance override
- Admin override capability
- Student/parent cannot override (403)
- Invalid status/missing fields rejection
- Rate limiting
- Idempotent override application

### Parent Dashboard Flow (6 tests)
- Access parent dashboard
- Fetch dashboard data
- View student attendance records
- Unauthenticated access blocked
- Student cannot access parent endpoint
- Console error monitoring

### Offline Sync Flow (6 tests)
- Online API response
- Offline/online transition
- IndexedDB availability
- Service worker registration
- Offline indicator component
- Sync status badge

### Concurrent Load Tests (5 tests)
- API response time (<5s)
- Concurrent attendance submissions (Promise.all)
- Concurrent override requests
- Error format under load
- Health check (no critical errors)

## Issue Reference
Closes #4223

## Labels
`testing`, `e2e-tests`, `attendance`
