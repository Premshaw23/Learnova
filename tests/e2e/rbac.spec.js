const { test, expect } = require('@playwright/test');

const ROLES = ['student', 'teacher', 'institute', 'parent', 'admin'];

const DASHBOARDS = {
  student: '/dashboard', // often student uses root dashboard or /student/dashboard
  teacher: '/teacher/dashboard',
  institute: '/institute/dashboard',
  parent: '/parent/dashboard',
  admin: '/admin/dashboard'
};

// Helper function to mock login by setting cookies/localStorage
// For full E2E, this would interact with the login UI
async function loginAsRole(page, role) {
  await page.goto('/auth');
  
  // Assuming the app has a way to bypass actual Firebase auth in E2E (e.g. mock API)
  // or we set cookies manually. For this test, we simulate by setting the userRole cookie.
  await page.context().addCookies([
    {
      name: 'userRole',
      value: role,
      domain: 'localhost',
      path: '/'
    },
    {
      name: 'authToken',
      value: 'mock-token-for-' + role,
      domain: 'localhost',
      path: '/'
    }
  ]);
}

test.describe('Role-Based Access Control (RBAC) Protections', () => {

  ROLES.forEach(role => {
    test.describe(`When logged in as a ${role}`, () => {
      
      test.beforeEach(async ({ page }) => {
        await loginAsRole(page, role);
      });

      // Test that the user CAN access their own dashboard
      test(`should allow access to their own dashboard`, async ({ page }) => {
        const myDashboard = DASHBOARDS[role];
        if (!myDashboard) return;

        await page.goto(myDashboard);
        // Wait for page load and ensure we are not redirected to /auth or an error page
        await expect(page).not.toHaveURL(/\/auth/);
      });

      // Test that the user CANNOT access other roles' dashboards
      ROLES.filter(r => r !== role).forEach(unauthorizedRole => {
        const targetUrl = DASHBOARDS[unauthorizedRole];
        
        test(`should block access to ${unauthorizedRole} dashboard`, async ({ page }) => {
          if (!targetUrl) return;

          await page.goto(targetUrl);
          
          // The application should either redirect to auth, a 403 page, or their own dashboard
          // Here we verify that the URL changes away from the target URL (rejected)
          await expect(page).not.toHaveURL(targetUrl, { timeout: 5000 });
        });
      });

    });
  });

  test('Unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await expect(page).toHaveURL(/\/auth/);
  });
});
