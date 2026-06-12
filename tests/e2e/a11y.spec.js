const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const PUBLIC_PAGES = [
  { name: "Landing page", path: "/" },
  { name: "Auth page", path: "/auth" },
];

const AUTH_PAGES = [
  { name: "Student dashboard", path: "/student/dashboard", role: "student" },
  { name: "Teacher dashboard", path: "/teacher/dashboard", role: "teacher" },
  { name: "Notices page", path: "/notices", role: "student" },
  { name: "Attendance page", path: "/attendance", role: "student" },
];

async function loginAsRole(page, role) {
  await page.goto("/auth");
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

test.describe("Accessibility (a11y) Audit — WCAG 2.1 AA", () => {
  PUBLIC_PAGES.forEach(({ name, path }) => {
    test(`${name} should have no critical or serious violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa", "wcag21aa"])
        .options({
          runOnly: {
            type: "tag",
            values: ["wcag2aa", "wcag21aa"],
          },
          resultTypes: ["violations"],
        })
        .analyze();

      const criticalSerious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      if (criticalSerious.length > 0) {
        console.log(`\n--- ${name} (${path}) ---`);
        criticalSerious.forEach((v) => {
          console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
          console.log(`  URL: ${v.helpUrl}`);
          v.nodes.slice(0, 3).forEach((n) => {
            console.log(`    - ${n.target?.join(", ")}`);
          });
        });
      }

      expect(criticalSerious).toEqual([]);
    });
  });

  AUTH_PAGES.forEach(({ name, path, role }) => {
    test(`${name} should have no critical or serious violations`, async ({ page }) => {
      await loginAsRole(page, role);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa", "wcag21aa"])
        .options({
          runOnly: {
            type: "tag",
            values: ["wcag2aa", "wcag21aa"],
          },
          resultTypes: ["violations"],
        })
        .analyze();

      const criticalSerious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      if (criticalSerious.length > 0) {
        console.log(`\n--- ${name} (${path}) as ${role} ---`);
        criticalSerious.forEach((v) => {
          console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
          console.log(`  URL: ${v.helpUrl}`);
          v.nodes.slice(0, 3).forEach((n) => {
            console.log(`    - ${n.target?.join(", ")}`);
          });
        });
      }

      expect(criticalSerious).toEqual([]);
    });
  });
});
