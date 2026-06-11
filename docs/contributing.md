# Contributing to Learnova

Thank you for your interest in contributing to Learnova! We welcome contributions from everyone, whether it's code, bug reports, features, or documentation.

## 🤝 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## 💬 How Can I Contribute?

### 1. **Reporting Bugs**
- Check if the bug has already been reported in [Issues](../../issues)
- If not, create a new issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots/logs if applicable
  - Your environment (OS, Node version, etc.)

### 2. **Suggesting Features**
- Use the Discussions tab to propose ideas
- Describe the use case and benefits
- Wait for community feedback before implementing

### 3. **Submitting Code**
- Fork the repository
- Create a feature branch: `git checkout -b feature/your-feature`
- Follow the [Development Guide](#-development-guide)
- Commit with clear messages: `git commit -m "Add feature: description"`
- Push to your fork: `git push origin feature/your-feature`
- Open a Pull Request with a detailed description

### 4. **Documentation**
- Fix typos or clarify confusing sections
- Add examples or usage guides
- Update API documentation
- Submit PRs directly to `main`

---

## 🛠️ Development Guide

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Learnova.git
cd Learnova

# Install dependencies
npm install

# Create environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Running Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
npm run build
npm run start
```

### Code Style

- Use **ESLint** rules (enforced via pre-commit hooks if available)
- Follow **Next.js** app router conventions
- Use meaningful variable/component names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Test features locally before submitting PR
- Verify different user roles (Student, Teacher, Institute, Admin)
- Test on mobile devices (PWA feature)
- Check dark mode compatibility if applicable

---

## 📋 PR Guidelines

### Before Submitting a PR

1. Update `main` with latest changes: `git pull origin main`
2. Rebase your branch: `git rebase main` (avoid merge commits)
3. Test locally: `npm run dev` and `npm run build`
4. Ensure no sensitive data is committed

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Changes Made
- Detailed list of changes
- What was added/modified/removed

## Testing
How to test the changes

## Screenshots (if applicable)
For UI changes, include before/after screenshots
```

### Review Process

- At least 1 maintainer review required
- All conversations resolved
- Feedback addressed before merge
- Squash commits before final merge (if requested)

---

## 🔒 Security

**Do not** include sensitive information in pull requests:
- API keys, tokens, or credentials
- Private encryption keys
- Database URIs with passwords
- Personal information

If you find a security vulnerability, please email security@learnova.com instead of opening an issue (or follow [SECURITY.md](SECURITY.md)).

---

## 🎯 Areas We Need Help With

- **Backend**: MongoDB queries, API optimization
- **Frontend**: UI/UX improvements, responsive design
- **Mobile**: PWA testing and mobile-specific issues
- **Documentation**: Setup guides, troubleshooting
- **Testing**: Adding test cases
- **Internationalization**: Adding new language support

---

## 📚 Project Structure Reference

```
app/                    # Next.js app routes
├── auth/              # Authentication pages
├── student/           # Student dashboard
├── teacher/           # Teacher dashboard
├── institute/         # Institute dashboard
└── admin/             # Admin dashboard

components/            # Reusable React components
└── [Feature components]

lib/                   # Utilities & Firebase config
services/              # API & external services
contexts/              # React contexts (Auth, etc.)
hooks/                 # Custom hooks
```

---

## 📝 Commit Message Conventions

- Use present tense: `Add feature` not `Added feature`
- Be descriptive: `Fix login validation on empty username` not `Fix bug`
- Keep first line under 50 characters
- Reference issues: `Add auth: closes #42`

Example:
```
Add face recognition attendance validation

- Implement conflict detection
- Add manual override option
- Update UI for verification
- Closes #89
```

---

## 🚀 Getting Your PR Merged

1. ✅ Code review approved
2. ✅ All discussions resolved
3. ✅ No merge conflicts
4. ✅ Passes CI/CD checks (if enabled)
5. ✅ Documentation updated if needed

---

## 💡 Questions?

- Open a Discussion
- Check existing issues for similar topics
- Review [README.md](README.md) for project overview
- Email: contact@learnova.com

---

## 🙏 Thank You!

Your contributions make Learnova better. We appreciate:
- Your time and effort
- Constructive feedback
- Bug reports
- Feature ideas
- Community support

**Happy coding!** 🎓


### Firebase Auth State Listener Rules
- Unsubscribe from listeners on component unmount to prevent leaks.
