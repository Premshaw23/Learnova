/**
 * Script to create beginner-friendly "good first issue" GitHub issues for Learnova.
 *
 * Usage:
 *   GITHUB_TOKEN=<your_pat> node .github/scripts/create-good-first-issues.mjs
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
    body: `## 📝 Task Description

Currently, when dashboard data is loading, users see a plain spinner or blank space. Adding skeleton loaders (placeholder animated boxes) will make the UI feel faster and more polished.

## 🎯 Why This Matters

Skeleton loaders are a modern UX pattern that reduces perceived wait time and prevents layout shifts when data loads.

## 🔍 Relevant Files / Folders

- \`components/StudentDashboard.js\`
- \`components/TeacherDashboardComponent .js\`
- \`components/AdminDashboard.js\`
- \`components/InstituteDashboard.js\`

## 💡 Expected Solution

Create a reusable \`SkeletonCard\` component in \`components/ui/\` using Tailwind CSS \`animate-pulse\` and \`bg-gray-700/50\` classes. Replace existing loading spinners in dashboard components with skeleton cards that match the shape of the real content.

**Example:**
\`\`\`jsx
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-gray-800 rounded-xl p-6">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
    </div>
  );
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] A reusable \`SkeletonCard\` component is created in \`components/ui/\`
- [ ] At least one dashboard component uses the skeleton during loading
- [ ] The skeleton matches the approximate shape/size of the real card
- [ ] The animation uses Tailwind \`animate-pulse\`
- [ ] No existing functionality is broken

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "enhancement", "UI"],
  },
  {
    title: "UI: Improve mobile responsiveness of the Navbar",
    body: `## 📝 Task Description

The Navbar does not fully adapt to small-screen viewports (mobile phones). Links may overflow or the layout may break on screens smaller than 640px.

## 🎯 Why This Matters

A large share of students and teachers use mobile devices. A broken or hard-to-use navbar directly hurts usability.

## 🔍 Relevant Files / Folders

- \`components/Navbar.js\`
- \`app/globals.css\`

## 💡 Expected Solution

- Add a hamburger menu button (visible only on mobile) that toggles a dropdown/drawer nav.
- Hide the full nav links on mobile using \`hidden sm:flex\` Tailwind classes.
- Ensure the mobile menu closes when a link is clicked.

## ✅ Acceptance Criteria

- [ ] Nav links are hidden on mobile (\`< sm\` breakpoint) and shown via a hamburger toggle
- [ ] Hamburger icon is visible only on mobile
- [ ] Clicking a nav link closes the mobile menu
- [ ] Layout does not overflow on screens as small as 320px
- [ ] Desktop layout is unchanged

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "UI", "mobile"],
  },
  {
    title: "Validation: Add password strength indicator to the sign-up form",
    body: `## 📝 Task Description

The sign-up form (\`components/AuthForm.js\`) does not give users any feedback about password strength. Users may create weak passwords without knowing it.

## 🎯 Why This Matters

Password strength feedback helps users create more secure accounts without needing separate documentation.

## 🔍 Relevant Files / Folders

- \`components/AuthForm.js\`

## 💡 Expected Solution

Below the password input (sign-up mode only), render a small strength bar with 3–4 levels (Weak / Fair / Strong / Very Strong) based on:
- Length ≥ 8 characters
- Contains uppercase letter
- Contains number
- Contains special character

Use Tailwind classes to colour the bar (red → orange → yellow → green).

**No external libraries needed** — implement the logic in a small helper function.

## ✅ Acceptance Criteria

- [ ] Strength indicator only shows in sign-up (not login) mode
- [ ] Indicator updates dynamically as the user types
- [ ] At least 3 strength levels are shown with distinct colours
- [ ] Indicator is accessible (includes a text label alongside the colour)
- [ ] No existing validation behaviour is changed

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "enhancement", "validation"],
  },
  {
    title: "API: Return consistent error responses in all API route handlers",
    body: `## 📝 Task Description

Several API route handlers in \`app/api/\` return different error shapes, making client-side error handling inconsistent. Some return \`{ message: "..." }\`, others return \`{ error: "..." }\`, and some may return no body at all on error.

## 🎯 Why This Matters

Consistent error shapes make it easier for frontend code and future contributors to handle API errors predictably.

## 🔍 Relevant Files / Folders

- \`app/api/exceptions/create/route.js\`
- \`app/api/exceptions/list/route.js\`
- \`app/api/exceptions/update/route.js\`
- \`app/api/exceptions/all/route.js\`
- \`app/api/register/route.js\`
- \`app/api/labels/\`

## 💡 Expected Solution

Standardise all error responses to use the shape \`{ error: "Descriptive message" }\` with an appropriate HTTP status code (400, 401, 403, 404, 500). Success responses should use \`{ success: true, data: ... }\`.

## ✅ Acceptance Criteria

- [ ] All routes in \`app/api/\` use \`{ error: "..." }\` for error responses
- [ ] All routes use \`{ success: true, data: ... }\` (or equivalent) for success
- [ ] Correct HTTP status codes are used (not just 200 for everything)
- [ ] No existing API behaviour is changed (only response shapes are standardised)

## ⏱️ Estimated Effort

1–3 hours`,
    labels: ["good first issue", "bug", "API"],
  },
  {
    title: "UI: Add an empty-state message to the Notice Board",
    body: `## 📝 Task Description

When there are no notices to display, the Notice Board shows a blank or nearly blank area. An empty-state illustration or message would improve the experience.

## 🎯 Why This Matters

Empty states prevent confusion ("Is something broken? Why is there nothing here?") and provide a better user experience.

## 🔍 Relevant Files / Folders

- \`components/noticeBoard.js\`
- \`app/notices/\`

## 💡 Expected Solution

When the list of notices is empty (after loading is complete), render a centred empty-state block containing:
- An icon (e.g. \`BellOff\` from \`lucide-react\`)
- A short message: *"No notices yet. Check back later."*
- Styled with existing Tailwind dark-theme classes

## ✅ Acceptance Criteria

- [ ] Empty state renders only when the notices list is empty AND loading is complete
- [ ] Empty state is not shown while data is still loading
- [ ] Uses an icon from \`lucide-react\`
- [ ] Consistent with the existing dark-theme design
- [ ] No existing functionality is broken

## ⏱️ Estimated Effort

1 hour`,
    labels: ["good first issue", "enhancement", "UI"],
  },
  {
    title: "Docs: Add JSDoc comments to utility and helper functions",
    body: `## 📝 Task Description

Utility functions in \`lib/\` and \`utils/\` have no documentation. Adding JSDoc comments makes the codebase easier for new contributors to understand.

## 🎯 Why This Matters

Well-documented helper functions reduce the time new contributors spend trying to understand the code before they can contribute.

## 🔍 Relevant Files / Folders

- \`lib/utils.js\`
- \`utils/authUtils.js\`
- \`services/authService.js\`
- \`hooks/useAuth.js\`

## 💡 Expected Solution

Add JSDoc comments to all exported functions in the files listed above. Each comment should include:
- \`@param\` for each parameter (name, type, description)
- \`@returns\` describing the return value
- A one-line description of what the function does

**Example:**
\`\`\`js
/**
 * Validates that an email address is properly formatted.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export function isValidEmail(email) { ... }
\`\`\`

## ✅ Acceptance Criteria

- [ ] All exported functions in the listed files have JSDoc comments
- [ ] Each comment includes at minimum a description, \`@param\` tags, and \`@returns\`
- [ ] Comments are accurate and match the actual behaviour of the functions
- [ ] No logic changes are made — documentation only

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "documentation"],
  },
  {
    title: "Test: Write basic unit tests for the AuthForm component",
    body: `## 📝 Task Description

The \`AuthForm\` component (\`components/AuthForm.js\`) currently has no tests. Writing a few basic tests will help catch regressions and teach contributors how the component works.

## 🎯 Why This Matters

Even a small test suite gives contributors confidence that their changes don't break authentication flows.

## 🔍 Relevant Files / Folders

- \`components/AuthForm.js\`
- \`package.json\` (check for existing test setup; add Vitest + React Testing Library if not present)

## 💡 Expected Solution

Create \`components/__tests__/AuthForm.test.js\` with tests covering:
1. Renders login form by default
2. Shows "Full Name" field only in sign-up mode
3. Shows validation error when email is empty on submit
4. Shows validation error when password is empty on submit
5. Calls \`onSubmit\` when valid data is entered

Use **Vitest** and **React Testing Library** (both standard in this project).

## ✅ Acceptance Criteria

- [ ] Test file created at \`components/__tests__/AuthForm.test.js\`
- [ ] At least 5 test cases as described above
- [ ] All tests pass (\`npm test\`)
- [ ] No production code is changed

## ⏱️ Estimated Effort

2–3 hours`,
    labels: ["good first issue", "testing"],
  },
  {
    title: "Fix: Improve 404 not-found page with navigation back to home",
    body: `## 📝 Task Description

The current \`app/not-found.js\` page is minimal and may not match the design system. It should be styled consistently and include a clear call-to-action button to return home.

## 🎯 Why This Matters

A polished 404 page prevents user frustration when they land on a missing route, and helps them navigate back without using the browser back button.

## 🔍 Relevant Files / Folders

- \`app/not-found.js\`

## 💡 Expected Solution

Update \`app/not-found.js\` to:
- Display a large "404" heading
- Show a friendly message: *"Oops! The page you're looking for doesn't exist."*
- Include a "Go back home" button using Next.js \`<Link href="/">\`
- Match the existing dark-theme design (gray-900 background, white/indigo text)
- Be fully responsive

## ✅ Acceptance Criteria

- [ ] Page shows a 404 heading and friendly message
- [ ] A "Go back home" button navigates to \`/\`
- [ ] Styling is consistent with the rest of the app (dark theme, Tailwind)
- [ ] Page is responsive on mobile and desktop

## ⏱️ Estimated Effort

1 hour`,
    labels: ["good first issue", "bug", "UI"],
  },
  {
    title: "Validation: Add client-side validation to the Contact form",
    body: `## 📝 Task Description

The contact form (\`app/contact/\`) may not validate user inputs before submitting. Missing or malformed inputs should be caught client-side and shown to the user with clear error messages.

## 🎯 Why This Matters

Client-side validation improves UX by giving instant feedback without requiring a round-trip to the server, and reduces unnecessary API calls with invalid data.

## 🔍 Relevant Files / Folders

- \`app/contact/page.js\` (or equivalent contact page component)

## 💡 Expected Solution

Add validation for:
- **Name**: required, minimum 2 characters
- **Email**: required, must be a valid email format (regex or HTML5 type="email")
- **Message**: required, minimum 10 characters

Show inline error messages below each field (matching the style in \`components/AuthForm.js\`).
Prevent form submission and EmailJS call if validation fails.

## ✅ Acceptance Criteria

- [ ] All three fields (name, email, message) are validated before submit
- [ ] Error messages are shown inline below each invalid field
- [ ] Form does not call EmailJS when validation fails
- [ ] Errors clear when the user starts correcting the field
- [ ] Validation messages match the existing dark-theme style

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "enhancement", "validation"],
  },
  {
    title: "UI: Make the Role Selection screen accessible with keyboard navigation",
    body: `## 📝 Task Description

The \`RoleSelection\` component (\`components/RoleSelection.js\`) uses clickable cards for role selection, but these may not be fully keyboard-navigable. Users who rely on keyboard navigation (Tab / Enter / Space) should be able to select a role without a mouse.

## 🎯 Why This Matters

Keyboard accessibility is a core requirement of the WCAG guidelines and ensures Learnova is usable by people with motor disabilities.

## 🔍 Relevant Files / Folders

- \`components/RoleSelection.js\`

## 💡 Expected Solution

- Ensure each role card has \`role="button"\` and \`tabIndex={0}\`
- Add \`onKeyDown\` handler to trigger selection on \`Enter\` or \`Space\` key
- Add a visible focus ring using Tailwind \`focus:ring-2 focus:ring-indigo-500\`
- Test that tabbing through the page highlights each card in order

## ✅ Acceptance Criteria

- [ ] All role cards are focusable via \`Tab\` key
- [ ] Pressing \`Enter\` or \`Space\` on a focused card selects the role
- [ ] A visible focus ring is shown on the active card
- [ ] Mouse interaction is unchanged
- [ ] No existing styling is broken

## ⏱️ Estimated Effort

1 hour`,
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
  } else {
    console.error(
      `❌ Failed to create "${issue.title}": ${data.message || JSON.stringify(data)}`
    );
  }
}

console.log(`🚀 Creating ${ISSUES.length} good-first issues on ${OWNER}/${REPO}...\n`);

for (const issue of ISSUES) {
  await createIssue(issue);
  // Small delay to avoid rate-limiting
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.log("\n✨ Done!");
