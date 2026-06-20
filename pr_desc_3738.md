### Is your feature request related to a problem? Please describe.
I'm always frustrated when I consider the security implications of a compromised Admin or Institute account. These roles have extensive access to sensitive student PII (Personally Identifiable Information), biometric face data, and academic records. A simple password breach could result in a massive data exposure. (Resolves #3738)

### Describe the solution you'd like
I have integrated a forced Multi-Factor Authentication (MFA) flow for high-privilege accounts (Admins and Institutes). Upon successful password authentication, the system checks if these roles have MFA enrolled. If not, it halts the login process and prompts them to scan a QR code using an Authenticator app (TOTP) to enroll. For subsequent logins, they must provide the 6-digit verification code before gaining dashboard access.

### Describe alternatives you've considered
An alternative is enforcing very strict password complexity and rotation policies, but this is prone to human error (like password reuse) and is generally considered less secure than MFA against phishing and credential stuffing attacks.

### Additional Context
MFA state and multi-factor resolution are gracefully handled natively within the `app/auth/page.js` component utilizing new custom `MfaEnrollment` and `MfaVerification` sub-components, ensuring a seamless user experience.
