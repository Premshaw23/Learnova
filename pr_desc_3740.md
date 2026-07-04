### Is your feature request related to a problem? Please describe.
I'm always frustrated when considering the long-term scalability and privacy compliance of the platform. Accumulating daily attendance logs, activity logs, and biometric face data for all students over multiple years will bloat the MongoDB/Firebase databases, increasing operational costs and slowing down dashboard queries. (Resolves #3740)

### Describe the solution you'd like
I have built an automated Data Retention and Archival Policy Engine. This feature allows Admins to configure rules that automatically archive old records (e.g., attendance logs older than a configurable number of months), and safely purge biometric data for inactive students in compliance with data privacy regulations. The engine runs daily via Vercel Cron.

### Describe alternatives you've considered
An alternative was requiring Admins to manually write scripts or perform manual database cleanups at the end of every academic year, which is risky, error-prone, and adds administrative overhead. The automated cron-based approach guarantees consistent data hygiene.

### Additional Context
The Admin Dashboard now features a "Data Retention" tab where super admins can define `attendanceRetentionMonths` and `biometricPurgeMonths`. The `/api/cron/archive-data` endpoint seamlessly triggers daily via `vercel.json` to process these retentions and purge sensitive face descriptor arrays from inactive profiles.
