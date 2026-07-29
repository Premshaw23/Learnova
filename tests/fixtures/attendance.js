/**
 * Test fixtures for attendance E2E tests.
 *
 * Provides mock user accounts, API helpers, and common data
 * for the attendance pipeline E2E tests.
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
  await page.goto('/auth');
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
  // Set user data in localStorage to simulate auth state
  await page.evaluate((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userRole', userData.role);
  }, { uid: user.uid, email: user.email, displayName: user.name, role: user.role });
}

// Helper to make authenticated API requests via page context
async function apiRequest(page, method, url, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await page.request.fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response may not be JSON
  }
  return { status: response.status(), data };
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
  apiRequest,
  ATTENDANCE_DATA,
};
