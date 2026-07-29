## Description

The attendance system is the core feature of Learnova, yet it lacks comprehensive end-to-end testing. Currently there are only unit tests for a few attendance routes, but no E2E tests that validate the complete attendance workflow from student check-in through teacher verification to parent dashboard display.

## Why This Is Important

- **122 API routes** exist but only **96 test files** cover the entire codebase
- The attendance pipeline spans multiple services: Face Recognition, GPS Validation, Passcode Verification, Firestore/MongoDB writes, Real-time sync, Parent notifications
- Without E2E tests, regressions in the attendance flow can go unnoticed until production
- The recent fixes for attendance issues (#4061, #4039, #4038, #4037) show the pattern of recurring bugs that E2E tests would catch

## Proposed Implementation

### 1. Test Framework Setup
- Add Playwright E2E tests for the attendance flow
- Create test fixtures with mock student/teacher/parent accounts
- Set up test database with seeded data

### 2. Core Test Scenarios
- **Student Attendance Flow**: Face recognition -> GPS verification -> Passcode entry -> Confirmation
- **Teacher Override Flow**: Teacher manually adjusts attendance -> Audit log created
- **Parent Dashboard Flow**: Parent views attendance summary -> Weekly digest email
- **Offline Sync Flow**: Queue attendance offline -> Sync when online -> Conflict resolution
- **Edge Cases**: Late arrival, early departure, multiple sessions, timezone handling

### 3. Integration Tests
- Attendance -> Gamification badge award (issue #4071)
- Attendance -> Analytics risk calculation
- Attendance -> Email alerts for low attendance

### 4. Performance Tests
- Concurrent attendance submissions (100+ students)
- Real-time SSE stream under load
- Database write latency monitoring

## Files to Modify/Create
- `tests/e2e/attendance/` - New E2E test directory
- `tests/fixtures/attendance.js` - Test fixtures
- `playwright.config.js` - Update configuration
- `tests/e2e/attendance/student-flow.spec.js`
- `tests/e2e/attendance/teacher-override.spec.js`
- `tests/e2e/attendance/parent-dashboard.spec.js`
- `tests/e2e/attendance/offline-sync.spec.js`
- `tests/e2e/attendance/concurrent-load.spec.js`

## Expected Impact

- **Test Coverage**: Increase attendance module coverage from ~30% to 90%+
- **Bug Prevention**: Catch regressions before production deployment
- **Developer Confidence**: Enable safe refactoring of attendance code
- **Documentation**: Tests serve as living documentation of expected behavior
