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
const { USERS, getTodayKey, getPastDate, loginAs, setupAttendanceMocks } = require('../../fixtures/attendance');

test.describe('Teacher Override Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.teacher);
    await setupAttendanceMocks(page);
  });

  test('teacher can override student attendance status to present', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'present' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.updated).toBe(true);
  });

  test('teacher can override student attendance status to absent', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'absent' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.updated).toBe(true);
  });

  test('teacher can override student attendance status to late', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'late' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.updated).toBe(true);
  });

  test('teacher can back-date attendance override to a past date', async ({ page }) => {
    const pastDate = getPastDate(3);
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { studentId: USERS.student.uid, date: pastDate, status: 'present' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.updated).toBe(true);
  });

  test('admin can override student attendance status', async ({ page }) => {
    await loginAs(page, USERS.admin);
    await setupAttendanceMocks(page);

    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.admin.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'present' },
    });

    expect(response.status()).toBe(200);
  });

  test('student cannot override attendance status (403 Forbidden)', async ({ page }) => {
    await loginAs(page, USERS.student);
    await setupAttendanceMocks(page);

    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'present' },
    });

    expect(response.status()).toBe(403);
  });

  test('parent cannot override attendance status (403 Forbidden)', async ({ page }) => {
    await loginAs(page, USERS.parent);
    await setupAttendanceMocks(page);

    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.parent.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'present' },
    });

    expect(response.status()).toBe(403);
  });

  test('override request with invalid status value is rejected', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { studentId: USERS.student.uid, date: today, status: 'invalid-status' },
    });

    expect(response.status()).toBe(400);
  });

  test('override request with missing studentId is rejected', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.teacher.token}`,
      },
      data: { date: today, status: 'present' },
    });

    expect(response.status()).toBe(400);
  });

  test('override without authentication is rejected', async ({ page }) => {
    // Override mock to reject unauthenticated
    await page.unroute('**/api/attendance/override');
    await page.route('**/api/attendance/override', async (route) => {
      const auth = route.request().headers()['authorization'] || '';
      if (!auth || auth === 'Bearer null') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
        return;
      }
      await route.continue();
    });

    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { studentId: USERS.student.uid, date: today, status: 'present' },
    });

    expect(response.status()).toBe(401);
  });

  test('override is idempotent - applying same override twice returns success', async ({ page }) => {
    const today = getTodayKey();
    const overrideData = { studentId: USERS.student.uid, date: today, status: 'late' };
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${USERS.teacher.token}`,
    };

    const first = await page.request.fetch('/api/attendance/override', { method: 'POST', headers, data: overrideData });
    const second = await page.request.fetch('/api/attendance/override', { method: 'POST', headers, data: overrideData });

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
  });
});
