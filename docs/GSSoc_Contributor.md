# GSSoC Contributor Guide

Welcome to Learnova! This guide will help GSSoC contributors make their first contribution smoothly.

## Prerequisites

Before contributing, make sure you have:

* A GitHub account
* Git installed on your system
* Basic knowledge of Git and GitHub
* A code editor (VS Code recommended)

---

# 1. Fork the Repository

1. Visit the repository page.
2. Click the **Fork** button in the top-right corner.
3. Select your GitHub account.
4. Wait for GitHub to create a copy of the repository under your account.

Example:

Original Repository:
https://github.com/Premshaw23/Learnova

Your Fork:
https://github.com/your-username/Learnova

---

# 2. Clone Your Fork

Clone the forked repository to your local machine:

```bash
git clone https://github.com/your-username/Learnova.git
```

Move into the project directory:

```bash
cd Learnova
```

---

# 3. Add Upstream Remote

Connect your fork to the original repository:

```bash
git remote add upstream https://github.com/Premshaw23/Learnova.git
```

Verify remotes:

```bash
git remote -v
```

Expected output:

```bash
origin    https://github.com/your-username/Learnova.git
upstream  https://github.com/Premshaw23/Learnova.git
```

---

# 4. Create a New Branch

Always create a separate branch before making changes.

```bash
git checkout -b feature/issue-number
```

Example:

```bash
git checkout -b docs/add-gssoc-guide
```

---

# 5. Make Your Changes

Implement the assigned feature, bug fix, or documentation improvement.

Ensure:

* Code follows project conventions.
* No unnecessary files are committed.
* Existing functionality remains unaffected.

---

# 6. Test Your Changes

Before committing:

* Verify the application runs correctly.
* Check for console errors.
* Confirm your changes work as expected.

---

# 7. Commit Changes

Stage files:

-To add all the files which is changed

```bash
git add .
```
-To add only selected files

```bash
git add filename-one, filename-two
```



Commit with a meaningful message:

```bash
git commit -m "docs: add GSSoC contributor guide"
```

Commit Message Examples:

```bash
fix: resolve login validation issue

docs: improve installation instructions

feat: add password visibility toggle
```

---

# 8. Sync with Upstream

Fetch latest updates:

```bash
git fetch upstream
```

Switch to main branch:

```bash
git checkout main
```

Merge latest changes:

```bash
git merge upstream/main
```

Return to your branch:

```bash
git checkout docs/add-gssoc-guide
```

Rebase if necessary:

```bash
git rebase main
```

---

# 9. Push Changes

Push branch to your fork:

```bash
git push origin docs/add-gssoc-guide
```

---

# 10. Create a Pull Request

1. Open your fork on GitHub.

2. Click **Compare & Pull Request**.

3. Select:

   * Base Repository: Premshaw23/Learnova
   * Base Branch: main
   * Head Repository: your fork
   * Compare Branch: your feature branch

4. Add:

   * Clear title
   * Detailed description
   * Issue reference

Example:

```text
docs: add GSSoC contributor guide

Closes #123

Added a dedicated guide for GSSoC contributors including:
- Forking
- Branch creation
- Commit conventions
- Pull request workflow
```

---

# 11. Code Review Process

Maintainers may:

* Request changes
* Suggest improvements
* Ask questions

Respond professionally and update your branch when needed.

Push new commits:

```bash
git add .
git commit -m "refactor: address review comments"
git push origin branch-name
```

The PR will update automatically.

---

# 12. Keep Your Fork Updated

Regularly sync your fork:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

# Best Practices

* Work on only one issue per branch.
* Write meaningful commit messages.
* Test before creating a PR.
* Read issue descriptions carefully.
* Keep PRs focused and small.
* Respect maintainers and reviewers.

---

# Thank You

Thank you for contributing to Learnova through GSSoC. Every contribution helps improve the project and supports the open-source community.
