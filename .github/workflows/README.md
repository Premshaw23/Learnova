# GitHub Actions CI/CD

This directory contains automated workflows for code quality and deployment checks.

## 📋 Workflows

### `ci.yml` - Build & Lint
**Triggers:** On PR and push to `main`/`master`

Runs on Node 18 and 20 to ensure compatibility:
- ✅ Installs dependencies
- ✅ Builds the Next.js project
- ✅ Catches build errors early

**Status Badge:**
```markdown
![CI](https://github.com/YOUR_USERNAME/Learnova/actions/workflows/ci.yml/badge.svg)
```

### `pr-checks.yml` - Pull Request Validation
**Triggers:** On PR creation/update

Verifies security and best practices:
- 🔍 Checks for hardcoded secrets (API keys, credentials)
- 🚫 Ensures `.env.local` is not committed
- 📦 Reports largest files to catch bloat

## ✨ What Happens on PR

1. Code is checked out
2. Dependencies installed
3. Project builds successfully
4. Security checks pass
5. PR can be merged (if all checks ✅)

## 🚀 Manual Deployment

Currently, **Vercel auto-deploys** on push to `main`. No manual action needed!

### To deploy manually:
```bash
# Push to main branch
git push origin main

# Vercel automatically detects changes and deploys
```

## 📊 Viewing Workflow Status

1. Go to your repo's **Actions** tab
2. Click on a workflow to see details
3. Check individual step logs for debugging

## 🔧 Customizing Workflows

Edit `.github/workflows/*.yml` files to:
- Add testing (Jest, Vitest)
- Add linting (ESLint)
- Add security scanning
- Deploy to other platforms

---

**Need help?** Check [CONTRIBUTING.md](../../CONTRIBUTING.md)
