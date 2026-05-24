/**
 * Script to create 10 beginner-friendly good-first-issues for Learnova.
 * Customized with gssoc26 and good first issue labels.
 *
 * Usage:
 *   GITHUB_TOKEN=<your_pat> node .github/scripts/create-good-first-issues-gssoc26.mjs
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
    title: "UI: Add dynamic notification management system",
    body: `## 📝 Task Description

The Navbar component (\`components/Navbar.js\`) currently has hardcoded notifications. We need to replace these with a dynamic notification system that allows the app to add/remove/clear notifications from anywhere.

## 🎯 Why This Matters

Users need real-time feedback for actions like "profile updated", "task completed", "error occurred". Hardcoded notifications don't scale and can't respond to app events.

## 🔍 Relevant Files / Folders

- \`components/Navbar.js\` (lines 32-47)
- \`hooks/useNotifications.js\` (create this)
- \`contexts/NotificationContext.js\` (create this)

## 💡 Expected Solution

Create a notification context that manages a queue of notifications:

\`\`\`jsx
// hooks/useNotifications.js
export function useNotifications() {
  const { addNotification, removeNotification } = useContext(NotificationContext);
  return { addNotification, removeNotification };
}

// Usage in components:
const { addNotification } = useNotifications();
addNotification({ message: 'Profile updated!', time: 'just now', type: 'success' });
\`\`\`

Replace hardcoded notifications in Navbar with dynamic ones from context.

## ✅ Acceptance Criteria

- [ ] \`NotificationContext\` is created and provides add/remove functions
- [ ] \`useNotifications\` hook is created
- [ ] Navbar uses notifications from context instead of hardcoded ones
- [ ] Notifications can be added from any component
- [ ] Old notifications auto-clear after 5 seconds
- [ ] No existing UI is broken

## ⏱️ Estimated Effort

2–3 hours`,
    labels: ["good first issue", "gssoc26", "enhancement", "UI"],
  },
  {
    title: "Feature: Add keyboard shortcuts for common actions",
    body: `## 📝 Task Description

Add keyboard shortcuts to improve user productivity. For example:
- \`Cmd/Ctrl + K\` to open search
- \`Cmd/Ctrl + /\` to open help/shortcuts menu
- \`Escape\` to close modals/dropdowns

## 🎯 Why This Matters

Power users expect keyboard shortcuts. They make the app feel more professional and improve accessibility.

## 🔍 Relevant Files / Folders

- \`hooks/useKeyboardShortcuts.js\` (create this)
- \`components/Navbar.js\`
- \`app/layout.js\`

## 💡 Expected Solution

Create a custom hook that registers keyboard shortcuts:

\`\`\`jsx
// hooks/useKeyboardShortcuts.js
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Open search
      }
      if (e.key === 'Escape') {
        // Close modals
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
\`\`\`

Add to \`app/layout.js\` so shortcuts work globally.

## ✅ Acceptance Criteria

- [ ] \`useKeyboardShortcuts\` hook is created
- [ ] At least 3 common shortcuts work (Cmd+K, Cmd+/, Escape)
- [ ] Shortcuts don't interfere with form input or text selection
- [ ] Works on macOS (Cmd) and Windows/Linux (Ctrl)
- [ ] Shortcuts are documented

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "gssoc26", "enhancement", "accessibility"],
  },
  {
    title: "UI: Add loading skeleton states to dashboard pages",
    body: `## 📝 Task Description

Dashboard pages like StudentDashboard, TeacherDashboard, and AdminDashboard show a spinner while loading data. Replace with skeleton loaders (animated placeholder cards) for a better UX.

## 🎯 Why This Matters

Skeleton loaders make the UI feel faster and prevent layout shifts. They're a modern UX best practice.

## 🔍 Relevant Files / Folders

- \`components/StudentDashboard.js\`
- \`components/TeacherDashboardComponent.js\`
- \`components/AdminDashboard.js\`
- \`components/ui/DashboardSkeleton.js\` (already exists, use it!)

## 💡 Expected Solution

Replace spinner logic with skeleton display:

\`\`\`jsx
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

export function StudentDashboard() {
  const { data, isLoading } = useData();

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div>
      {/* Real dashboard content */}
    </div>
  );
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] All three dashboard pages use \`DashboardSkeleton\` while loading
- [ ] Skeleton matches the shape/layout of real content
- [ ] Animation is smooth (uses Tailwind \`animate-pulse\`)
- [ ] Skeleton shows for at least 1-2 seconds before content
- [ ] No existing functionality is broken

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "gssoc26", "UI", "enhancement"],
  },
  {
    title: "Feature: Add toast notifications for API responses",
    body: `## 📝 Task Description

When users perform actions (create, update, delete), show toast notifications to confirm success or show error messages. React Hot Toast is already installed.

## 🎯 Why This Matters

Toast notifications give users immediate feedback on their actions, improving the overall UX.

## 🔍 Relevant Files / Folders

- \`package.json\` (react-hot-toast is already there)
- \`app/layout.js\` (add Toaster)
- \`components/AuthForm.js\`
- \`components/settings.js\`

## 💡 Expected Solution

Add Toaster to layout and use toast in components:

\`\`\`jsx
// app/layout.js
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

// In any component:
import toast from 'react-hot-toast';

const handleSubmit = async () => {
  try {
    await api.updateSettings(data);
    toast.success('Settings updated!');
  } catch (error) {
    toast.error(error.message);
  }
};
\`\`\`

## ✅ Acceptance Criteria

- [ ] Toaster is added to root layout
- [ ] At least 3 components show success toasts on API success
- [ ] Error toasts are shown on API failures
- [ ] Toast position and duration are reasonable
- [ ] Toasts don't block important UI elements

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "gssoc26", "enhancement", "UX"],
  },
  {
    title: "Validation: Add comprehensive form validation helpers",
    body: `## 📝 Task Description

Create reusable form validation utilities for common patterns: email, password strength, required fields, name length, etc. Currently, validation is scattered across components.

## 🎯 Why This Matters

Centralized validation makes the codebase easier to maintain and ensures consistent validation across all forms.

## 🔍 Relevant Files / Folders

- \`utils/formValidation.js\` (create this)
- \`components/AuthForm.js\`
- \`components/register.js\`

## 💡 Expected Solution

Create helper functions:

\`\`\`js
// utils/formValidation.js
export const validators = {
  email: (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || 'Invalid email',
  password: (pwd) => pwd.length >= 8 || 'Password must be 8+ chars',
  required: (value) => !!value || 'This field is required',
  minLength: (len) => (value) => value.length >= len || \`Must be at least \${len} chars\`,
};

// Usage:
const error = validators.email(userEmail);
if (error !== true) {
  showError(error); // Shows error message
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Validation utilities module is created
- [ ] At least 5 validators are implemented
- [ ] AuthForm uses the new validators
- [ ] Error messages are clear and user-friendly
- [ ] All existing tests pass

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "gssoc26", "enhancement", "validation"],
  },
  {
    title: "Accessibility: Add ARIA labels and semantic HTML to UI components",
    body: `## 📝 Task Description

Many UI components lack proper ARIA labels and use \`<div>\` instead of semantic HTML. This makes the app harder for screen reader users. Add:
- \`aria-label\` to icon buttons
- \`aria-expanded\` to dropdowns
- \`role="button"\` to clickable divs
- Semantic tags (\`<button>\`, \`<nav>\`, \`<main>\`)

## 🎯 Why This Matters

Accessibility is a legal requirement (WCAG) and ethical responsibility. It also improves SEO.

## 🔍 Relevant Files / Folders

- \`components/Navbar.js\`
- \`components/RoleSelection.js\`
- \`components/ui/button.jsx\`

## 💡 Expected Solution

\`\`\`jsx
// Before:
<div onClick={toggleMenu} className="cursor-pointer">
  <Menu size={24} />
</div>

// After:
<button
  onClick={toggleMenu}
  aria-label="Toggle menu"
  className="cursor-pointer"
>
  <Menu size={24} />
</button>
\`\`\`

## ✅ Acceptance Criteria

- [ ] All icon buttons have \`aria-label\`
- [ ] Clickable divs are converted to \`<button>\` or have \`role="button"\`
- [ ] Dropdowns have \`aria-expanded\` attribute
- [ ] \`<nav>\` tags wrap navigation
- [ ] \`<main>\` tags wrap main content
- [ ] Lighthouse accessibility score improves

## ⏱️ Estimated Effort

2–3 hours`,
    labels: ["good first issue", "gssoc26", "accessibility", "enhancement"],
  },
  {
    title: "Bug: Fix missing alt text on images",
    body: `## 📝 Task Description

Images throughout the app are missing \`alt\` text. Add meaningful descriptions to all \`<img>\` and Next.js \`<Image>\` tags.

## 🎯 Why This Matters

Alt text is essential for:
- Screen reader users
- SEO
- Showing descriptions if image fails to load
- WCAG compliance

## 🔍 Relevant Files / Folders

Search for \`<Image\` and \`<img\` without alt:
- \`components/Navbar.js\`
- \`components/profile.js\`
- \`components/universal-profile.js\`
- Dashboard components

## 💡 Expected Solution

\`\`\`jsx
// Before:
<Image src={avatar} width={40} height={40} />

// After:
<Image
  src={avatar}
  width={40}
  height={40}
  alt="User avatar for Jane Doe"
/>
\`\`\`

Alt text should be descriptive and concise (1-2 sentences max).

## ✅ Acceptance Criteria

- [ ] All \`<Image>\` tags have \`alt\` prop
- [ ] All \`<img>\` tags have \`alt\` attribute
- [ ] Alt text is meaningful and describes the image
- [ ] No generic alt text like "image" or "photo"
- [ ] Lighthouse accessibility score improves

## ⏱️ Estimated Effort

1 hour`,
    labels: ["good first issue", "gssoc26", "bug", "accessibility"],
  },
  {
    title: "Feature: Add email validation to registration flow",
    body: `## 📝 Task Description

The register endpoint and RegisterForm don't validate email format before submission. Add email pattern validation and suggest corrections for common typos (e.g., "gmial.com" → "gmail.com").

## 🎯 Why This Matters

Invalid emails cause:
- Failed password resets
- Delivery failures
- Bad user experience
- Data quality issues

## 🔍 Relevant Files / Folders

- \`components/register.js\`
- \`app/api/register/route.js\`
- \`utils/formValidation.js\`

## 💡 Expected Solution

Add email validation with helpful suggestions:

\`\`\`js
// utils/emailValidation.js
const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

export function suggestEmailCorrection(email) {
  const [local, domain] = email.split('@');

  // Find similar common domain
  const similar = COMMON_DOMAINS.find(d =>
    levenshteinDistance(domain, d) <= 1
  );

  return similar ? \`\${local}@\${similar}\` : null;
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Email pattern validation is enforced
- [ ] Invalid emails show error message
- [ ] Common typos get helpful suggestions
- [ ] User can accept suggestion with one click
- [ ] Valid emails pass validation

## ⏱️ Estimated Effort

1–2 hours`,
    labels: ["good first issue", "gssoc26", "enhancement", "validation"],
  },
  {
    title: "UI: Add empty state message to Notice Board",
    body: `## 📝 Task Description

When there are no notices, the Notice Board (\`components/noticeBoard.js\`) shows a blank area. Add an empty state illustration with a friendly message.

## 🎯 Why This Matters

Empty states prevent confusion and guide users on what to do next. They improve UX significantly.

## 🔍 Relevant Files / Folders

- \`components/noticeBoard.js\`
- Use icons from \`lucide-react\` (BellOff, AlertCircle, etc.)

## 💡 Expected Solution

\`\`\`jsx
export function NoticeBoard({ notices, isLoading }) {
  if (isLoading) return <DashboardSkeleton />;

  if (notices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BellOff className="w-12 h-12 text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-300">No Notices Yet</h3>
        <p className="text-gray-500">Check back later for updates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map(notice => (...))}
    </div>
  );
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Empty state is shown when notices list is empty
- [ ] Uses an icon from lucide-react
- [ ] Message is friendly and helpful
- [ ] Styled consistently with dark theme
- [ ] Not shown while loading (loading skeleton shown instead)

## ⏱️ Estimated Effort

1 hour`,
    labels: ["good first issue", "gssoc26", "UI", "enhancement"],
  },
  {
    title: "Docs: Add JSDoc comments to utility functions",
    body: `## 📝 Task Description

Utility functions in \`utils/\` and \`lib/\` lack documentation. Add JSDoc comments to help contributors understand what each function does.

## 🎯 Why This Matters

Well-documented functions are easier to understand and reduce onboarding time for new contributors.

## 🔍 Relevant Files / Folders

- \`utils/\` (all .js files)
- \`lib/\` (all .js files)
- \`services/\` (all .js files)

## 💡 Expected Solution

\`\`\`js
/**
 * Validates an email address format.
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 * @example
 * isValidEmail('user@example.com'); // true
 */
export function isValidEmail(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

/**
 * Calculates attendance rate for a user.
 * @param {Array} records - Attendance records
 * @param {string} userId - User ID
 * @returns {number} Percentage attendance (0-100)
 */
export function calculateAttendanceRate(records, userId) {
  // ...
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] All exported functions have JSDoc comments
- [ ] Each comment includes: description, @param, @returns, @example
- [ ] Comments are accurate and match function behavior
- [ ] No logic changes, documentation only
- [ ] At least 10 functions documented

## ⏱️ Estimated Effort

2–3 hours`,
    labels: ["good first issue", "gssoc26", "documentation", "enhancement"],
  },
  {
    title: "Test: Write unit tests for form validation utilities",
    body: `## 📝 Task Description

Form validation utilities lack test coverage. Write Jest tests to verify validators work correctly for valid/invalid inputs.

## 🎯 Why This Matters

Tests catch bugs and give contributors confidence that validation works as expected.

## 🔍 Relevant Files / Folders

- \`utils/formValidation.js\`
- Create: \`utils/__tests__/formValidation.test.js\`

## 💡 Expected Solution

\`\`\`js
// utils/__tests__/formValidation.test.js
import { validators } from '../formValidation';

describe('Email Validator', () => {
  it('validates correct emails', () => {
    expect(validators.email('user@example.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validators.email('invalid')).not.toBe(true);
    expect(validators.email('user@')).not.toBe(true);
  });
});

describe('Password Validator', () => {
  it('accepts passwords 8+ chars', () => {
    expect(validators.password('longpassword')).toBe(true);
  });

  it('rejects short passwords', () => {
    expect(validators.password('short')).not.toBe(true);
  });
});
\`\`\`

Run with: \`npm test utils/formValidation\`

## ✅ Acceptance Criteria

- [ ] Test file created at \`utils/__tests__/formValidation.test.js\`
- [ ] At least 2 tests per validator function
- [ ] Tests cover both valid and invalid inputs
- [ ] All tests pass (\`npm test\`)
- [ ] Test coverage > 80%

## ⏱️ Estimated Effort

2–3 hours`,
    labels: ["good first issue", "gssoc26", "testing", "enhancement"],
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

console.log("\n✨ Done! All issues created.");
