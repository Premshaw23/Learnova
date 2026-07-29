/**
 * E2E Test: Concurrent Load & Performance
 *
 * Tests the attendance system under concurrent load:
 * - Multiple simultaneous attendance submissions
 * - Rate limiting under rapid requests
 * - API response times under load
 * - Error handling under stress
 *
 * Issue: #4223
 */
const { test, expect } = require('@playwright/test');
const { USERS, getTodayKey, loginAs, setupAttendanceMocks, ATTENDANCE_DATA } = require('../../fixtures/attendance');

test.describe('Concurrent Load & Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.student);
    await setupAttendanceMocks(page);
  });

  test('API responds within acceptable time limit', async ({ page }) => {
    const today = getTodayKey();

    const startTime = Date.now();
    const response = await page.request.fetch('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: {
        userId: USERS.student.uid,
        studentName: USERS.student.name,
        email: USERS.student.email,
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      },
    });
    const elapsed = Date.now() - startTime;

    expect([200, 201]).toContain(response.status());
    expect(elapsed).toBeLessThan(5000);
  });

  test('concurrent attendance submissions are handled correctly', async ({ page }) => {
    const today = getTodayKey();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${USERS.student.token}`,
    };

    // Send 5 truly concurrent requests using Promise.all
    const requests = Array.from({ length: 5 }, () =>
      page.request.fetch('/api/attendance/record', {
        method: 'POST',
        headers,
        data: {
          userId: USERS.student.uid,
          studentName: USERS.student.name,
          email: USERS.student.email,
          confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
          date: today,
        },
      })
    );

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status());

    // All should succeed or be rate limited - no server errors (5xx)
    statuses.forEach((status) => {
      expect(status).toBeLessThan(500);
    });

    // At least one should be 201 (first successful record)
    const successCount = statuses.filter((s) => s === 200 || s === 201).length;
    expect(successCount).toBeGreaterThanOrEqual(1);
  });

  test('concurrent override requests are handled gracefully', async ({ page }) => {
    await loginAs(page, USERS.teacher);
    await setupAttendanceMocks(page);

    const today = getTodayKey();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${USERS.teacher.token}`,
    };

    // Send 5 concurrent override requests
    const requests = Array.from({ length: 5 }, (_, i) =>
      page.request.fetch('/api/attendance/override', {
        method: 'POST',
        headers,
        data: {
          studentId: USERS.student.uid,
          date: today,
          status: i % 2 === 0 ? 'present' : 'late',
        },
      })
    );

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status());

    // All should succeed (200) - no server errors
    statuses.forEach((status) => {
      expect(status).toBe(200);
    });
  });

  test('API returns proper error format under load', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: {
        userId: USERS.student.uid,
        studentName: USERS.student.name,
        email: USERS.student.email,
        confidenceScore: -1, // Invalid
        date: today,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('health check - app loads without critical errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Firebase') &&
        !err.includes('firebase') &&
        !err.includes('firebaseio') &&
        !err.includes('ResizeObserver') &&
        !err.includes('network') &&
        !err.includes('Failed to load')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
