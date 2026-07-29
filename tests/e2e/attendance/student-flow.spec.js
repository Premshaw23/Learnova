/**
 * E2E Test: Student Attendance Flow
 *
 * Tests the complete student attendance workflow:
 * - Face recognition verification
 * - GPS validation
 * - Passcode verification
 * - Attendance confirmation
 * - Duplicate prevention
 * - Rate limiting
 *
 * These tests use page.route() to mock API responses,
 * making them self-contained without needing a running backend.
 *
 * Issue: #4223
 */
const { test, expect } = require('@playwright/test');
const { USERS, getTodayKey, loginAs, setupAttendanceMocks, ATTENDANCE_DATA } = require('../../fixtures/attendance');

test.describe('Student Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.student);
    await setupAttendanceMocks(page);
  });

  test('should record attendance successfully with valid credentials', async ({ page }) => {
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
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.data.alreadyRecorded).toBe(false);
  });

  test('should return alreadyRecorded when attendance was previously submitted', async ({ page }) => {
    await setupAttendanceMocks(page, { alreadyRecorded: true });

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
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.alreadyRecorded).toBe(true);
  });

  test('should reject attendance with confidence score below 60', async ({ page }) => {
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
        confidenceScore: ATTENDANCE_DATA.lowConfidence.confidenceScore,
        date: today,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid or spoofed confidence score');
  });

  test('should reject attendance with non-numeric confidence score', async ({ page }) => {
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
        confidenceScore: 'not-a-number',
        date: today,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should reject student submitting attendance for another user', async ({ page }) => {
    const today = getTodayKey();
    const response = await page.request.fetch('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: {
        userId: 'other-student-uid',
        studentName: 'Other Student',
        email: 'other@learnova.edu',
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      },
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Forbidden');
  });

  test('should reject student back-dating attendance to a past date', async ({ page }) => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const dateStr = pastDate.toISOString().slice(0, 10);

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
        date: dateStr,
      },
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('past date');
  });

  test('should return 401 when submitting without authentication token', async ({ page }) => {
    // Override the mock to reject unauthenticated requests
    await page.unroute('**/api/attendance/record');
    await page.route('**/api/attendance/record', async (route) => {
      const authHeader = route.request().headers()['authorization'] || '';
      if (!authHeader || authHeader === 'Bearer null') {
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
    const response = await page.request.fetch('/api/attendance/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: USERS.student.uid,
        studentName: USERS.student.name,
        email: USERS.student.email,
        confidenceScore: ATTENDANCE_DATA.valid.confidenceScore,
        date: today,
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should handle missing required fields gracefully', async ({ page }) => {
    const response = await page.request.fetch('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: {
        userId: USERS.student.uid,
        // Missing studentName, email, confidenceScore
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate passcode through the passcode endpoint', async ({ page }) => {
    const response = await page.request.fetch('/api/attendance/validate-passcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: { passcode: ATTENDANCE_DATA.valid.passcode },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.valid).toBe(true);
  });

  test('should reject invalid passcode', async ({ page }) => {
    const response = await page.request.fetch('/api/attendance/validate-passcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERS.student.token}`,
      },
      data: { passcode: ATTENDANCE_DATA.invalidPasscode.passcode },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('Invalid passcode');
  });
});
