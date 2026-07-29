/**
 * Test fixtures for attendance E2E tests.
 *
 * Provides mock user accounts, API response mocks, and common data
 * for the attendance pipeline E2E tests.
 *
 * These tests use Playwright's page.route() to intercept API calls
 * and return mock responses, making them self-contained without
 * needing a running backend server.
 */

// Mock user accounts for different roles
const USERS = {
  student: {
    uid: 'student-e2e-001',
    email: 'student.e2e@learnova.edu',
    name: 'E2E Test Student',
    role: 'student',
    token: 'mock-student-token-e2e-001',
  },
  teacher: {
    uid: 'teacher-e2e-001',
    email: 'teacher.e2e@learnova.edu',
    name: 'E2E Test Teacher',
    role: 'teacher',
    token: 'mock-teacher-token-e2e-001',
  },
  parent: {
    uid: 'parent-e2e-001',
    email: 'parent.e2e@learnova.edu',
    name: 'E2E Test Parent',
    role: 'parent',
    token: 'mock-parent-token-e2e-001',
  },
  admin: {
    uid: 'admin-e2e-001',
    email: 'admin.e2e@learnova.edu',
    name: 'E2E Test Admin',
    role: 'admin',
    token: 'mock-admin-token-e2e-001',
  },
};

// Get today's date in YYYY-MM-DD format (local timezone)
function getTodayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 10);
  return localISO;
}

// Get a past date in YYYY-MM-DD format
function getPastDate(daysAgo = 1) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  const offset = now.getTimezoneOffset() * 60000;
  const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 10);
  return localISO;
}

// Mock login by setting cookies and localStorage
async function loginAs(page, user) {
  await page.context().clearCookies();
  
  await page.context().addCookies([
    {
      name: 'authToken',
      value: user.token,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'userRole',
      value: user.role,
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.evaluate((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userRole', userData.role);
  }, { uid: user.uid, email: user.email, displayName: user.name, role: user.role });
}

/**
 * Setup route mocks for attendance API endpoints.
 * This intercepts all API calls and returns mock responses,
 * making tests self-contained without a running backend.
 */
async function setupAttendanceMocks(page, { alreadyRecorded = false } = {}) {
  // Mock POST /api/attendance/record
  await page.route('**/api/attendance/record', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      let body;
      try {
        body = JSON.parse(request.postData() || '{}');
      } catch {
        body = {};
      }

      // Validate required fields
      if (!body.userId || !body.studentName || !body.email) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Missing required fields' }),
        });
        return;
      }

      // Validate confidence score
      const confidence = Number(body.confidenceScore);
      if (isNaN(confidence) || confidence < 60) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bad Request: Invalid or spoofed confidence score' }),
        });
        return;
      }

      // Check for another user (student trying to submit for someone else)
      const authHeader = request.headers()['authorization'] || '';
      const isTeacherOrAdmin = authHeader === 'Bearer mock-teacher-token-e2e-001' || authHeader === 'Bearer mock-admin-token-e2e-001';
      if (!isTeacherOrAdmin && body.userId !== 'student-e2e-001') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden: Cannot submit attendance for another user' }),
        });
        return;
      }

      // Check back-dating (students can't back-date)
      const today = getTodayKey();
      if (!isTeacherOrAdmin && body.date && body.date !== today) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden: Only teachers/admins may record attendance for a past date' }),
        });
        return;
      }

      // Check future date for teachers
      if (isTeacherOrAdmin && body.date && body.date > today) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bad Request: Cannot record attendance for a future date' }),
        });
        return;
      }

      // Return success
      await route.fulfill({
        status: alreadyRecorded ? 200 : 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { alreadyRecorded } }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock POST /api/attendance/override
  await page.route('**/api/attendance/override', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      let body;
      try {
        body = JSON.parse(request.postData() || '{}');
      } catch {
        body = {};
      }

      // Check role (only teacher/admin)
      const authHeader = request.headers()['authorization'] || '';
      const isTeacherOrAdmin = authHeader === 'Bearer mock-teacher-token-e2e-001' || authHeader === 'Bearer mock-admin-token-e2e-001';
      if (!isTeacherOrAdmin) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' }),
        });
        return;
      }

      // Validate required fields
      if (!body.studentId || !body.date || !body.status) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid request' }),
        });
        return;
      }

      // Validate status enum
      if (!['present', 'absent', 'late'].includes(body.status)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid status' }),
        });
        return;
      }

      // Return success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { updated: true } }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock POST /api/attendance/validate-passcode
  await page.route('**/api/attendance/validate-passcode', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      let body;
      try {
        body = JSON.parse(request.postData() || '{}');
      } catch {
        body = {};
      }

      if (body.passcode === '123456') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ valid: false, error: 'Invalid passcode' }),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Mock GET /api/parent/dashboard
  await page.route('**/api/parent/dashboard', async (route) => {
    const request = route.request();
    const authHeader = request.headers()['authorization'] || '';
    const hasToken = authHeader === 'Bearer mock-parent-token-e2e-001';

    if (!hasToken) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          dashboardData: { totalStudents: 1, attendanceRate: 85 },
          children: [{ id: 'student-e2e-001', name: 'E2E Test Student' }],
        },
      }),
    });
  });

  // Mock GET /api/parent/student/:studentId/attendance
  await page.route('**/api/parent/student/*/attendance', async (route) => {
    const request = route.request();
    const authHeader = request.headers()['authorization'] || '';
    const hasToken = authHeader === 'Bearer mock-parent-token-e2e-001';

    if (!hasToken) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          attendanceRate: 85,
          records: [{ date: getTodayKey(), status: 'present' }],
        },
      }),
    });
  });
}

// Common attendance test data
const ATTENDANCE_DATA = {
  valid: {
    confidenceScore: 85,
    passcode: '123456',
  },
  lowConfidence: {
    confidenceScore: 40,
  },
  invalidPasscode: {
    passcode: '000000',
  },
};

module.exports = {
  USERS,
  getTodayKey,
  getPastDate,
  loginAs,
  setupAttendanceMocks,
  ATTENDANCE_DATA,
};
