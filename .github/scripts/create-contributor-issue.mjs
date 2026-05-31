/**
 * Script to create contributor-friendly issues for Learnova.
 *
 * Usage:
 *   GITHUB_TOKEN=<your_pat> node .github/scripts/create-contributor-issue.mjs
 *
 * Requirements:
 *   - Node.js 18+ (uses native fetch)
 *   - A GitHub Personal Access Token with `repo` scope set as GITHUB_TOKEN env var.
 */
const OWNER = "Premshaw23";
const REPO = "Learnova";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is not set.");
  process.exit(1);
}

const ISSUES = [
  {
    title: "UI: Add loading skeleton for dashboard cards",
    body: `Currently, when dashboard data is loading, users see a plain spinner or blank space. Adding skeleton loaders will make the UI feel faster and more polished.

**Relevant files:** \`components/StudentDashboard.js\`, \`components/TeacherDashboardComponent.js\`, \`components/AdminDashboard.js\`, \`components/InstituteDashboard.js\`

**Expected solution:** Create a reusable \`SkeletonCard\` component in \`components/ui/\` using Tailwind \`animate-pulse\`. Replace loading spinners in dashboard components.

## ✅ Acceptance Criteria

- [ ] Reusable \`SkeletonCard\` component in \`components/ui/\`
- [ ] At least one dashboard uses the skeleton during loading
- [ ] Animation uses Tailwind \`animate-pulse\`
- [ ] No existing functionality broken

**Estimated effort:** 1–2 hours
`,
    labels: ["good first issue", "enhancement", "UI"],
  },
  {
    title: "UI: Improve mobile responsiveness of the Navbar",
    body: `The Navbar does not fully adapt to small-screen viewports. Links may overflow on screens smaller than 640px.

**Relevant files:** \`components/Navbar.js\`, \`app/globals.css\`

**Expected solution:** Add a hamburger menu that toggles a dropdown on mobile. Use \`hidden sm:flex\` Tailwind classes to hide desktop nav on mobile.

## ✅ Acceptance Criteria

- [ ] Nav links hidden on mobile, shown via hamburger toggle
- [ ] Clicking a link closes the mobile menu
- [ ] No overflow on screens ≥ 320px wide
- [ ] Desktop layout unchanged

**Estimated effort:** 1–2 hours
`,
    labels: ["good first issue", "UI", "mobile"],
  },
  {
    title: "Validation: Add password strength indicator to the sign-up form",
    body: `The sign-up form gives no feedback about password strength, which may lead to weak passwords.

**Relevant files:** \`components/AuthForm.js\`

**Expected solution:** Below the password input (sign-up only), add a 3–4 level strength bar using Tailwind colour utilities. No external libraries needed.

## ✅ Acceptance Criteria

- [ ] Indicator visible in sign-up mode only
- [ ] Updates dynamically as the user types
- [ ] At least 3 strength levels with distinct colours
- [ ] Includes a text label alongside the colour bar

**Estimated effort:** 1–2 hours
`,
    labels: ["good first issue", "enhancement", "validation"],
  },
  {
    title: "API: Return consistent error responses in all API route handlers",
    body: `Several API routes in \`app/api/\` return different error shapes, making client-side handling inconsistent.

**Relevant files:** \`app/api/exceptions/*/route.js\`, \`app/api/register/route.js\`, \`app/api/labels/\`

**Expected solution:** Standardise all errors to \`{ error: "..." }\` and successes to \`{ success: true, data: ... }\` with correct HTTP status codes.

## ✅ Acceptance Criteria

- [ ] All API routes use \`{ error: "..." }\` for errors
- [ ] Correct HTTP status codes used
- [ ] No existing API behaviour changed (shape only)

**Estimated effort:** 1–3 hours
`,
    labels: ["good first issue", "bug", "API"],
  },
  {
    title: "UI: Add an empty-state message to the Notice Board",
    body: `When there are no notices, the Notice Board shows a blank area, which may confuse users.

**Relevant files:** \`components/noticeBoard.js\`, \`app/notices/\`

**Expected solution:** When notices list is empty and loading is complete, show a centred block with a \`BellOff\` icon (lucide-react) and message "No notices yet. Check back later."

## ✅ Acceptance Criteria

- [ ] Empty state shown only when list is empty and not loading
- [ ] Uses an icon from \`lucide-react\`
- [ ] Consistent with dark-theme design

**Estimated effort:** 1 hour
`,
    labels: ["good first issue", "enhancement", "UI"],
  },
  {
    title: "Docs: Add JSDoc comments to utility and helper functions",
    body: `Utility functions in \`lib/\` and \`utils/\` have no documentation, making it harder for new contributors.

**Relevant files:** \`lib/utils.js\`, \`utils/authUtils.js\`, \`services/authService.js\`, \`hooks/useAuth.js\`

**Expected solution:** Add JSDoc comments (\`@param\`, \`@returns\`, description) to all exported functions in the listed files.

## ✅ Acceptance Criteria

- [ ] All exported functions have JSDoc comments
- [ ] Comments include description, \`@param\`, and \`@returns\`
- [ ] No logic changes — documentation only

**Estimated effort:** 1–2 hours
`,
    labels: ["good first issue", "documentation"],
  },
  {
    title: "Test: Write basic unit tests for the AuthForm component",
    body: `The \`AuthForm\` component has no tests. Adding a few basic tests helps catch regressions.

**Relevant files:** \`components/AuthForm.js\`, \`package.json\`

**Expected solution:** Create \`components/__tests__/AuthForm.test.js\` with at least 5 test cases using Vitest and React Testing Library.

## ✅ Acceptance Criteria

- [ ] Test file at \`components/__tests__/AuthForm.test.js\`
- [ ] At least 5 test cases
- [ ] All tests pass (\`npm test\`)
- [ ] No production code changed

**Estimated effort:** 2–3 hours
`,
    labels: ["good first issue", "testing"],
  },
  {
    title: "Fix: Improve 404 not-found page with navigation back to home",
    body: `The current \`app/not-found.js\` is minimal and may not match the design system.

**Relevant files:** \`app/not-found.js\`

**Expected solution:** Update to show a large "404" heading, friendly message, and a "Go back home" \`<Link>\` button styled with the dark theme.

## ✅ Acceptance Criteria

- [ ] Shows 404 heading and friendly message
- [ ] "Go back home" button navigates to \`/\`
- [ ] Consistent dark-theme styling
- [ ] Responsive on mobile and desktop

**Estimated effort:** 1 hour
`,
    labels: ["good first issue", "bug", "UI"],
  },
  {
    title: "Validation: Add client-side validation to the Contact form",
    body: `The contact form may not validate inputs before submitting, leading to unnecessary API calls or poor UX.

**Relevant files:** \`app/contact/page.js\`

**Expected solution:** Add validation for Name (required, ≥ 2 chars), Email (valid format), and Message (required, ≥ 10 chars). Show inline errors and block submission if invalid.

## ✅ Acceptance Criteria

- [ ] All three fields validated before submit
- [ ] Inline error messages shown below invalid fields
- [ ] Form does not call EmailJS when validation fails
- [ ] Errors clear when user corrects the field

**Estimated effort:** 1–2 hours
`,
    labels: ["good first issue", "enhancement", "validation"],
  },
  {
    title: "UI: Make the Role Selection screen accessible with keyboard navigation",
    body: `Role selection cards in \`RoleSelection.js\` may not be keyboard-navigable, preventing access for users who rely on keyboards.

**Relevant files:** \`components/RoleSelection.js\`

**Expected solution:** Add \`role="button"\`, \`tabIndex={0}\`, \`onKeyDown\` handler for Enter/Space, and a visible focus ring (\`focus:ring-2 focus:ring-indigo-500\`).

## ✅ Acceptance Criteria

- [ ] All role cards focusable via Tab
- [ ] Enter/Space selects the focused card
- [ ] Visible focus ring shown on active card
- [ ] Mouse interaction unchanged

**Estimated effort:** 1 hour
`,
    labels: ["good first issue", "accessibility", "UI"],
  },
];

async function createIssue(issue) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issue),
  });

  const data = await response.json();
  if (response.ok) {
    console.log(`✅ Created issue #${data.number}: ${data.title}`);
    console.log(`   🔗 ${data.html_url}`);
    return data;
  } else {
    console.error(
      `❌ Failed to create "${issue.title}": ${data.message || JSON.stringify(data)}`
    );
    throw new Error(data.message);
  }
}

console.log(`🚀 Creating contributor issue on ${OWNER}/${REPO}...\n`);

for (const issue of ISSUES) {
  try {
    const createdIssue = await createIssue(issue);
    console.log(`\n📋 Issue Details:`);
    console.log(`   Number: #${createdIssue.number}`);
    console.log(`   Title: ${createdIssue.title}`);
    console.log(`   State: ${createdIssue.state}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
  // Small delay to avoid rate-limiting
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.log("\n✨ Issue created successfully!");
