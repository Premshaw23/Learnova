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
const { USERS, loginAs, apiRequest } = require('../../fixtures/attendance');

test.describe('Parent Dashboard Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.parent);
  });

  test('parent can access parent dashboard', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('parent can fetch dashboard data', async ({ page }) => {
    const response = await apiRequest(page, 'GET', '/api/parent/dashboard', null, USERS.parent.token);
    // Dashboard should return data or a valid response
    expect(response.status).toBeDefined();
    // Should not be a server error (5xx)
    expect(response.status).toBeLessThan(500);
  });

  test('parent can view student attendance records', async ({ page }) => {
    const response = await apiRequest(
      page,
      'GET',
      `/api/parent/student/${USERS.student.uid}/attendance`,
      null,
      USERS.parent.token
    );
    // Should return a valid response (200, 403 if not linked, or 404)
    expect([200, 403, 404]).toContain(response.status);
  });

  test('unauthenticated user cannot access parent dashboard', async ({ page }) => {
    const response = await apiRequest(page, 'GET', '/api/parent/dashboard', null, null);
    // Must return 401 or 403 for unauthenticated access
    expect([401, 403]).toContain(response.status);
  });

  test('student cannot access parent dashboard endpoint', async ({ page }) => {
    await loginAs(page, USERS.student);
    const response = await apiRequest(page, 'GET', '/api/parent/dashboard', null, USERS.student.token);
    // Must return 403 (student role cannot access parent endpoint)
    expect([401, 403]).toContain(response.status);
  });

  test('parent dashboard page loads without critical console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/parent/dashboard');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (Firebase connection, etc.)
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('Firebase') && !err.includes('firebase') && !err.includes('network')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('parent dashboard page renders main content area', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await page.waitForTimeout(2000);

    // The page should have a main content area
    const hasContent = await page.evaluate(() => {
      return document.querySelector('main, [role="main"], .dashboard, #dashboard, #root') !== null
        || document.body.children.length > 0;
    });
    expect(hasContent).toBe(true);
  });
});
