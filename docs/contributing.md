# 🤝 Contributing to Learnova

Thank you for your interest in contributing to **Learnova** — an AI-powered education platform! We welcome contributions of all kinds: bug fixes, new features, documentation improvements, and more.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Good First Issues](#good-first-issues)
- [Getting Help](#getting-help)

---

## 📜 Code of Conduct

Please be respectful, inclusive, and constructive in all interactions. We expect all contributors to uphold a welcoming and harassment-free environment.

---

## 🚀 Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Learnova.git
   cd Learnova
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Premshaw23/Learnova.git
   ```

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+
- A **Firebase** project (Auth + Analytics enabled)
- A **MongoDB** instance (local or Atlas)
- A **Vercel Blob** store (for file uploads)

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_USER_ID=your_user_id
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
learnova/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Server-side API routes (MongoDB + Firebase Admin)
│   ├── auth/             # Authentication pages
│   ├── student/          # Student dashboard
│   ├── teacher/          # Teacher dashboard
│   ├── institute/        # Institute dashboard
│   └── admin/            # Admin dashboard
├── components/           # Reusable React components
├── constants/            # App-wide constants (roles, config)
├── contexts/             # React context providers (AuthContext)
├── hooks/                # Custom React hooks
├── lib/                  # Helper libraries (Firebase, MongoDB)
├── services/             # Service layer (auth, etc.)
├── utils/                # Utility/helper functions
└── public/               # Static assets
```

---

## 🧑‍💻 How to Contribute

### 1. Find an issue to work on

- Browse [open issues](https://github.com/Premshaw23/Learnova/issues).
- Look for issues labelled **`good first issue`** if you're new.
- Comment on the issue to let maintainers know you're working on it.

### 2. Create a feature branch

Always branch off from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b fix/your-descriptive-branch-name
```

Branch naming conventions:
- `fix/` — bug fixes
- `feat/` — new features
- `docs/` — documentation changes
- `chore/` — maintenance tasks
- `test/` — adding or updating tests

### 3. Make your changes

- Keep changes focused on the issue you're resolving.
- Follow the [coding standards](#coding-standards) below.
- Add or update tests where applicable.
- Update documentation if your change affects documented behaviour.

### 4. Test your changes

```bash
npm run build   # Ensure it builds without errors
npm run dev     # Manually test your changes in the browser
```

### 5. Push and open a Pull Request

```bash
git push origin fix/your-descriptive-branch-name
```

Then open a Pull Request against the `main` branch on GitHub.

---

## 🔀 Pull Request Guidelines

- Fill in the PR template completely.
- Reference the related issue (e.g., `Closes #42`).
- Keep PRs small and focused — one concern per PR.
- Add screenshots for UI changes.
- Ensure the build passes before requesting a review.
- Be responsive to reviewer feedback.

---

## 🎨 Coding Standards

### General

- Use **functional React components** with hooks.
- Prefer **named exports** for components; use default exports only for page components.
- Keep component files focused — extract large logic into custom hooks or utility functions.

### Styling

- Use **Tailwind CSS** utility classes for all styling.
- Avoid inline `style` attributes unless absolutely necessary.
- Follow the existing dark-themed design system (gray-800/700 backgrounds, indigo/purple accents).
- Ensure layouts are **mobile-responsive** (use `sm:`, `md:`, `lg:` breakpoints).

### JavaScript / JSX

- Use **ES6+** syntax (arrow functions, destructuring, optional chaining, etc.).
- Avoid `var`; prefer `const` and `let`.
- Validate all user inputs both client-side and server-side.
- Always handle async errors with `try/catch` and return meaningful error messages.

### API Routes

- All API routes live in `app/api/`.
- Verify Firebase ID tokens server-side using `lib/firebase-admin.js` for protected endpoints.
- Return consistent JSON responses:
  ```js
  // Success
  return Response.json({ success: true, data: ... }, { status: 200 });
  // Error
  return Response.json({ error: 'Descriptive message' }, { status: 4xx/5xx });
  ```
- Always include proper HTTP status codes.

---

## ✍️ Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

**Types:**
- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or correcting tests
- `chore` — build process, dependency updates, etc.

**Examples:**
```
feat(auth): add password confirmation field to sign-up form
fix(api): return 404 instead of 500 when user not found
docs(contributing): add branch naming conventions
```

---

## 🐛 Reporting Bugs

Use the **Bug Report** issue template. Please include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS details
- Screenshots or error messages if applicable

---

## 💡 Requesting Features

Use the **Feature Request** issue template. Please include:
- The problem you're solving
- Your proposed solution
- Any alternatives you've considered

---

## 🌱 Good First Issues

New to the project? Look for issues labelled [`good first issue`](https://github.com/Premshaw23/Learnova/labels/good%20first%20issue). These are small, well-defined tasks perfect for getting familiar with the codebase.

---

## 💬 Getting Help

- Open a [GitHub Discussion](https://github.com/Premshaw23/Learnova/discussions) for questions.
- Comment on the relevant issue if you're stuck.
- Be patient — maintainers are volunteers and will respond as soon as they can.

---

Thank you for helping make Learnova better! 🎓
