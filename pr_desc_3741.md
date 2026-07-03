### Is your feature request related to a problem? Please describe.
I'm always frustrated when I consider the security implications of a compromised Admin or Institute account. These roles have extensive access to sensitive student PII, biometric face data, and academic records. A simple password breach could result in a massive data exposure. (Resolves #3741)

### Describe the solution you'd like
I have integrated a forced Multi-Factor Authentication (MFA) flow for high-privilege accounts (Admins and Institutes). Upon successful password authentication, the system checks if these roles have MFA enrolled. If not, it halts the login process and prompts them to scan a QR code using an Authenticator app (TOTP) to enroll. For subsequent logins, they must provide the 6-digit verification code before gaining dashboard access.

### Describe alternatives you've considered
I considered relying purely on SMS-based MFA, but SMS is vulnerable to SIM swapping attacks. TOTP (Time-based One-Time Password) via Authenticator apps is widely regarded as more secure and more reliable for protecting educational platforms.

### Additional Context
MFA state and multi-factor resolution are gracefully handled natively within the `app/auth/page.js` component utilizing new custom `MfaEnrollment` and `MfaVerification` sub-components, ensuring a seamless user experience.
