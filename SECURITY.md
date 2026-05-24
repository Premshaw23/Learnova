# Security Policy

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities. This could expose the vulnerability to the public before a fix is available.

Instead, please email your report to: **security@learnova.com**

Include the following information:

1. **Description** — Detailed description of the vulnerability
2. **Location** — Affected file(s) and line numbers
3. **Reproduction Steps** — How to reproduce the issue
4. **Impact** — Potential security impact (e.g., data exposure, unauthorized access)
5. **Suggested Fix** — If you have a proposed solution (optional)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: We will assess the severity and impact
- **Fix Development**: We will work on a fix (timeline depends on severity)
- **Public Disclosure**: After a fix is released and tested

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

## Security Best Practices

### For Users

- Keep your credentials secure (never commit `.env.local`)
- Use strong passwords for all accounts
- Enable two-factor authentication where available
- Report any suspicious activity immediately
- Review access logs regularly (for teachers/admins)

### For Contributors

- Never commit secrets, API keys, or credentials
- Use `.env.example` template for sensitive configuration
- Run security checks before submitting PRs
- Follow OWASP Top 10 guidelines
- Validate all user input
- Use prepared statements for database queries

## Known Security Considerations

- **Registration Security Policy**: The registration endpoint (`/api/register`) enforces token authentication via Firebase ID Tokens. Users can only register under their own verified Firebase authentication email address. Attempts with missing/invalid credentials yield `401 Unauthorized`, and mismatched emails yield `403 Forbidden`.
- **IP-Based Rate Limiting**: Registration is protected against spam and automated bots via IP-based sliding window rate-limiting. A maximum of `5 registration attempts per 1-minute window` is allowed per IP address. Exceeding this limit yields a `429 Too Many Requests` response.
- **Rollback Protection**: In case of a database write failure, the registration endpoint automatically deletes the newly uploaded photo blob from Vercel Storage to prevent storage leaks and orphaned assets.
- Face recognition data is processed client-side and should comply with GDPR/privacy laws
- Student attendance data should be encrypted at rest and in transit
- All API endpoints should enforce role-based access control
- Database credentials should rotate periodically

## Security Scanning

We use automated tools to scan for vulnerabilities:

- Dependency scanning (npm/package vulnerabilities)
- SAST (Static Analysis Security Testing)
- Code review before merge

## Third-Party Dependencies

Learnova uses the following third-party services — ensure you understand their privacy and security policies:

- **Firebase** — Authentication, analytics
- **MongoDB Atlas** — Database
- **Vercel Blob** — File storage
- **EmailJS** — Email service
- **Groq API** — AI/ML services

---

Thank you for helping keep Learnova secure! 🔒
