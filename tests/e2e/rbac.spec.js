const { test, expect } = require("@playwright/test");

const ROLES = ["student", "teacher", "institute", "parent", "admin"];

const DASHBOARDS = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  institute: "/institute/dashboard",
  parent: "/parent/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Sets mock auth cookies without navigating to /auth (which would trigger
 * a middleware redirect for already-authenticated users).
 * We use the API route to set cookies, or set them directly via the context.
 */
async function loginAsRole(page, role) {
  // Navigate to a neutral public page first so we have a valid browsing context
  // /activity is listed as PUBLIC_PATHS in middleware so it won't redirect
  await page.goto("/activity", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  // Set mock auth cookies in the page context
  await page.context().addCookies([
    {
      name: "userRole",
      value: role,
      domain: "localhost",
      path: "/",
    },
    {
      name: "authToken",
      value: "mock-token-for-" + role,
      domain: "localhost",
      path: "/",
    },
  ]);
}

test.describe("Role-Based Access Control (RBAC) Protections", () => {
  ROLES.forEach((role) => {
    test.describe(`When logged in as a ${role}`, () => {
      test.beforeEach(async ({ page }) => {
        await loginAsRole(page, role);
      });

      // Test that the user CAN access their own dashboard
      test(`should allow access to their own dashboard`, async ({ page }) => {
        const myDashboard = DASHBOARDS[role];
        if (!myDashboard) return;

        // Navigate and wait for the page to settle
        await page.goto(myDashboard, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        // Wait a bit for any client-side redirects to complete
        await page.waitForTimeout(2000);

        // Should not be redirected to /auth
        await expect(page).not.toHaveURL(/\/auth/);
      });

      // Test that the user CANNOT access other roles' dashboards
      ROLES.filter((r) => r !== role).forEach((unauthorizedRole) => {
        const targetUrl = DASHBOARDS[unauthorizedRole];

        test(`should block access to ${unauthorizedRole} dashboard`, async ({
          page,
        }) => {
          if (!targetUrl) return;

          // Use waitUntil: 'commit' to avoid ERR_ABORTED on server-side redirects
          await page.goto(targetUrl, { waitUntil: "commit", timeout: 20000 });

          // Wait for any subsequent client-side redirects to settle
          await page.waitForTimeout(3000);

          // The URL should have changed away from the target (redirect happened)
          const currentUrl = page.url();
          expect(currentUrl).not.toContain(targetUrl);
        });
      });
    });
  });

  test("Unauthenticated user should be redirected to login", async ({
    page,
  }) => {
    // Navigate without any auth cookies
    await page.goto("/teacher/dashboard", {
      waitUntil: "commit",
      timeout: 20000,
    });

    // Wait for redirect to settle
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/auth/);
  });
});
