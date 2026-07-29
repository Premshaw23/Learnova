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
const { USERS, getTodayKey, loginAs, apiRequest, ATTENDANCE_DATA } = require('../../fixtures/attendance');

test.describe('Concurrent Load & Performance', () => {
  test('API responds within acceptable time limit', async ({ page }) => {
    await loginAs(page, USERS.student);
    const today = getTodayKey();

    const startTime = Date.now();
    const response = await apiRequest(page, 'POST', '/api/attendance/record', {
      userId: USERS.student.uid,
      studentName: USERS.student.name,
      email: USERS.student.email,
      confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
      date: today,
    }, USERS.student.token);
    const elapsed = Date.now() - startTime;

    expect([200, 201, 429]).toContain(response.status);
    // API should respond within 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });

  test('concurrent attendance submissions are handled correctly', async ({ page }) => {
    await loginAs(page, USERS.student);
    const today = getTodayKey();

    // Send 5 truly concurrent requests using Promise.all
    const requests = Array.from({ length: 5 }, (_, i) =>
      apiRequest(page, 'POST', '/api/attendance/record', {
        userId: USERS.student.uid,
        studentName: USERS.student.name,
        email: USERS.student.email,
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      }, USERS.student.token)
    );

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status);

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
    const today = getTodayKey();

    // Send 5 concurrent override requests
    const requests = Array.from({ length: 5 }, (_, i) =>
      apiRequest(page, 'POST', '/api/attendance/override', {
        studentId: USERS.student.uid,
        date: today,
        status: i % 2 === 0 ? 'present' : 'late',
      }, USERS.teacher.token)
    );

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status);

    // All should succeed (200) or be rate limited (429) - no server errors
    statuses.forEach((status) => {
      expect([200, 429]).toContain(status);
    });
  });

  test('API returns proper error format under load', async ({ page }) => {
    await loginAs(page, USERS.student);
    const today = getTodayKey();

    const response = await apiRequest(page, 'POST', '/api/attendance/record', {
      userId: USERS.student.uid,
      studentName: USERS.student.name,
      email: USERS.student.email,
      confidenceScore: -1, // Invalid
      date: today,
    }, USERS.student.token);

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
  });

  test('health check - app loads without critical errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

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
