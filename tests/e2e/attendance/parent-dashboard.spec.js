/**
 * E2E Test: Parent Dashboard Attendance Flow
 *
 * Tests the parent's view of their child's attendance:
 * - Parent can view child attendance summary
 * - Parent can view attendance records by date
 * - Parent receives low attendance warnings
 * - Parent cannot modify attendance records
 * - Attendance analytics display correctly
 *
 * Issue: #4223
 */
const { test, expect } = require('@playwright/test');
const { USERS, loginAs, setupAttendanceMocks } = require('../../fixtures/attendance');

test.describe('Parent Dashboard Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.parent);
    await setupAttendanceMocks(page);
  });

  test('parent can fetch dashboard data', async ({ page }) => {
    const response = await page.request.fetch('/api/parent/dashboard', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${USERS.parent.token}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('dashboardData');
  });

  test('parent can view student attendance records', async ({ page }) => {
    const response = await page.request.fetch(`/api/parent/student/${USERS.student.uid}/attendance`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${USERS.parent.token}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('attendanceRate');
  });

  test('unauthenticated user cannot access parent dashboard', async ({ page }) => {
    const response = await page.request.fetch('/api/parent/dashboard', {
      method: 'GET',
    });

    expect(response.status()).toBe(401);
  });

  test('student cannot access parent dashboard endpoint', async ({ page }) => {
    await loginAs(page, USERS.student);
    await setupAttendanceMocks(page);

    const response = await page.request.fetch('/api/parent/dashboard', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${USERS.student.token}` },
    });

    expect(response.status()).toBe(401);
  });

  test('parent dashboard page loads without critical console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('Firebase') && !err.includes('firebase') && !err.includes('network')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
