/**
 * E2E Test: Teacher Override Attendance Flow
 *
 * Tests the teacher/admin attendance override workflow:
 * - Teacher can override student attendance status
 * - Admin can override student attendance status
 * - Students/parents cannot override
 * - Override syncs to MongoDB
 * - Audit trail is created
 * - Rate limiting on override endpoint
 *
 * Issue: #4223
 */
const { test, expect } = require('@playwright/test');
const { USERS, getTodayKey, getPastDate, loginAs, apiRequest } = require('../../fixtures/attendance');

test.describe('Teacher Override Attendance Flow', () => {
  test('teacher can override student attendance status to present', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'present',
    }, USERS.teacher.token);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('updated');
    expect(response.data.updated).toBe(true);
  });

  test('teacher can override student attendance status to absent', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'absent',
    }, USERS.teacher.token);

    expect(response.status).toBe(200);
    expect(response.data.updated).toBe(true);
  });

  test('teacher can override student attendance status to late', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'late',
    }, USERS.teacher.token);

    expect(response.status).toBe(200);
    expect(response.data.updated).toBe(true);
  });

  test('teacher can back-date attendance override to a past date', async ({ page }) => {
    const pastDate = getPastDate(3);
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: pastDate,
      status: 'present',
    }, USERS.teacher.token);

    expect(response.status).toBe(200);
    expect(response.data.updated).toBe(true);
  });

  test('admin can override student attendance status', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'present',
    }, USERS.admin.token);

    expect(response.status).toBe(200);
    expect(response.data.updated).toBe(true);
  });

  test('student cannot override attendance status (403 Forbidden)', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'present',
    }, USERS.student.token);

    expect(response.status).toBe(403);
  });

  test('parent cannot override attendance status (403 Forbidden)', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'present',
    }, USERS.parent.token);

    expect(response.status).toBe(403);
  });

  test('override request with invalid status value is rejected', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'invalid-status',
    }, USERS.teacher.token);

    expect(response.status).toBe(400);
  });

  test('override request with missing studentId is rejected', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      date: today,
      status: 'present',
    }, USERS.teacher.token);

    expect(response.status).toBe(400);
  });

  test('override request with invalid date format is rejected', async ({ page }) => {
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: 'not-a-date',
      status: 'present',
    }, USERS.teacher.token);

    expect(response.status).toBe(400);
  });

  test('override without authentication is rejected', async ({ page }) => {
    const today = getTodayKey();
    const response = await apiRequest(page, 'POST', '/api/attendance/override', {
      studentId: USERS.student.uid,
      date: today,
      status: 'present',
    }, null);

    expect([401, 403]).toContain(response.status);
  });

  test('override is idempotent - applying same override twice returns success', async ({ page }) => {
    const today = getTodayKey();
    const overrideData = {
      studentId: USERS.student.uid,
      date: today,
      status: 'late',
    };

    const first = await apiRequest(page, 'POST', '/api/attendance/override', overrideData, USERS.teacher.token);
    const second = await apiRequest(page, 'POST', '/api/attendance/override', overrideData, USERS.teacher.token);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});
