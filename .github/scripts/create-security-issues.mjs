/**
 * Script to create security vulnerability issues for Learnova.
 *
 * Usage:
 *   GITHUB_TOKEN=<your_pat> node .github/scripts/create-security-issues.mjs
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
    title: "SECURITY: Unauthenticated write to conversations endpoint",
    body: `## 🚨 Severity: CRITICAL

## 📝 Issue Description

The \`/api/conversations\` endpoint (app/api/conversations/route.js:4-17) allows **any unauthenticated client** to insert chat logs directly into the MongoDB database without any authentication checks.

## 🔍 Affected Code

\`\`\`javascript
// app/api/conversations/route.js:4-17
// No authentication middleware
\`\`\`

## ⚠️ Impact

- Unauthorized users can spam database with fake conversations
- Database bloat from malicious actors
- Potential data integrity issues
- No audit trail of who created conversations

## 💡 Expected Solution

Add authentication middleware to verify the request:
- Check for valid session/JWT token
- Validate user identity before inserting
- Log conversation creation with user ID
- Consider rate limiting per authenticated user

## ✅ Acceptance Criteria

- [ ] Endpoint requires valid authentication
- [ ] Only authenticated users can create conversations
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Created conversations include user ID/session info
- [ ] All existing tests still pass

## 📚 Related Issues

See also: No input validation/size limits for conversations`,
    labels: ["security", "critical", "authentication", "API"],
  },
  {
    title: "SECURITY: No input validation/size limits for conversations",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The conversations endpoint (app/api/conversations/route.js:6-15) accepts and stores raw inputs without:
- Type validation
- Length/size limits
- Content sanitization
- Schema enforcement

## 🔍 Affected Code

\`\`\`javascript
// app/api/conversations/route.js:6-15
// Direct insertion without validation
\`\`\`

## ⚠️ Impact

- Database bloat from oversized documents
- Potential buffer overflow or memory issues
- Spam/DOS through large payloads
- Unexpected data types causing application crashes

## 💡 Expected Solution

Implement comprehensive input validation:
- Enforce maximum document size (e.g., 1MB)
- Validate each field type (string, number, etc.)
- Define and enforce schema with Zod or similar
- Sanitize text inputs to prevent injection
- Set reasonable limits on array/string lengths

## ✅ Acceptance Criteria

- [ ] Input schema is defined and validated on all requests
- [ ] Request payloads > max size are rejected (413 Payload Too Large)
- [ ] Invalid field types are rejected (400 Bad Request)
- [ ] All validation uses a library like Zod, Joi, or similar
- [ ] Documentation lists accepted fields and their limits

## 📚 Related Issues

See also: Unauthenticated write to conversations endpoint`,
    labels: ["security", "high", "validation", "API"],
  },
  {
    title: "SECURITY: Groq endpoint accepts unauthenticated requests",
    body: `## 🚨 Severity: CRITICAL

## 📝 Issue Description

The \`/api/groq\` endpoint (app/api/groq/route.js:6-25) allows any unauthenticated client to invoke paid API calls to Groq. This enables:
- Quota abuse by external attackers
- Unexpected charges on your Groq account
- DOS attack via unlimited API calls

## 🔍 Affected Code

\`\`\`javascript
// app/api/groq/route.js:6-25
// No authentication check before calling Groq API
\`\`\`

## ⚠️ Impact

- Unauthorized API usage and billing
- Quota exhaustion
- Service degradation for legitimate users
- Financial loss from abuse

## 💡 Expected Solution

- Add authentication middleware to verify user identity
- Implement rate limiting per authenticated user
- Track API usage per user for quota management
- Consider adding API key-based authentication for trusted clients
- Monitor and alert on unusual usage patterns

## ✅ Acceptance Criteria

- [ ] Endpoint requires valid authentication
- [ ] Only authenticated users can make Groq requests
- [ ] Rate limiting is enforced per user
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Usage is logged with user ID for tracking

## 💰 Cost Prevention

This fix directly prevents financial loss from unauthorized API abuse.`,
    labels: ["security", "critical", "authentication", "API", "cost-control"],
  },
  {
    title: "SECURITY: No timeout for Groq API fetch requests",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The Groq fetch call (app/api/groq/route.js:25-44) has no timeout configured. If Groq is slow or unresponsive, the request can hang indefinitely, consuming serverless function resources and eventually timing out the entire request.

## 🔍 Affected Code

\`\`\`javascript
// app/api/groq/route.js:25-44
// fetch(groqUrl, ...) without timeout
\`\`\`

## ⚠️ Impact

- Serverless function hanging and consuming resources
- Slow client experience (request waits for timeout)
- Potential cascading failures if many requests hang
- High cloud execution costs

## 💡 Expected Solution

Add an AbortController with timeout:
\`\`\`javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch(groqUrl, {
    signal: controller.signal,
    ...
  });
} finally {
  clearTimeout(timeoutId);
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Groq fetch call has a maximum timeout (e.g., 30 seconds)
- [ ] Requests that exceed timeout are aborted
- [ ] Timeout errors return 504 Gateway Timeout to client
- [ ] Timeout value is configurable via environment variable
- [ ] Timeout is tested with slow/unresponsive mock server`,
    labels: ["security", "high", "performance", "API"],
  },
  {
    title: "SECURITY: Max upload size not enforced in register endpoint",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The register endpoint (app/api/register/route.js:6, 31-56) defines a \`MAX_FILE_SIZE\` constant but never actually validates that uploaded files respect this limit. Users can upload arbitrarily large files.

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Defined but not checked
// ... photo.arrayBuffer() is called without size validation
\`\`\`

## ⚠️ Impact

- Storage bloat from large uploaded images
- Potential memory exhaustion when processing large uploads
- Increased hosting/storage costs
- DOS via uploading huge files

## 💡 Expected Solution

Before processing the uploaded file:
1. Check the \`size\` property of the File object
2. Compare against MAX_FILE_SIZE
3. Reject requests with files larger than limit
4. Return 413 Payload Too Large with clear error message

\`\`\`javascript
if (photo.size > MAX_FILE_SIZE) {
  return Response.json({ error: 'File too large' }, { status: 413 });
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] File size is validated before \`arrayBuffer()\` is called
- [ ] Files exceeding MAX_FILE_SIZE are rejected with 413 status
- [ ] Error message informs user of the size limit
- [ ] Test case covers both valid and oversized uploads
- [ ] MAX_FILE_SIZE value is reasonable (5-10 MB typical)`,
    labels: ["security", "medium", "validation", "API"],
  },
  {
    title: "SECURITY: Allowed image types not enforced in file upload",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The register endpoint (app/api/register/route.js:7-11, 31-66) declares accepted MIME types:
\`\`\`javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
\`\`\`

However, it **never checks** if the uploaded file matches. Any file type (including executables, archives, etc.) can be uploaded.

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js:7-11
// Defined but not validated
\`\`\`

## ⚠️ Impact

- Malicious files stored in user data
- Potential code execution if files are served back to clients
- Arbitrary file upload vulnerability
- Compliance/security audit failures

## 💡 Expected Solution

Validate MIME type before processing:
\`\`\`javascript
if (!ALLOWED_TYPES.includes(photo.type)) {
  return Response.json(
    { error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' },
    { status: 400 }
  );
}
\`\`\`

Also consider:
- Reading file magic bytes to verify type (not just MIME)
- Scanning uploaded images with antivirus if available
- Storing files with restricted extensions

## ✅ Acceptance Criteria

- [ ] File MIME type is checked against ALLOWED_TYPES
- [ ] Files with invalid types are rejected (400 Bad Request)
- [ ] Error message specifies allowed file types
- [ ] Magic byte verification is implemented (bonus)
- [ ] Test covers rejected file types (e.g., .exe, .zip)`,
    labels: ["security", "medium", "validation", "API"],
  },
  {
    title: "SECURITY: Email validation pattern declared but not enforced",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The register endpoint (app/api/register/route.js:12, 31-75) defines an email validation regex:
\`\`\`javascript
const EMAIL_PATTERN = /.../;
\`\`\`

But it **never uses** it. Invalid email addresses are accepted and stored in the database.

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js:12
// Pattern exists but is unused
\`\`\`

## ⚠️ Impact

- Invalid emails stored in database
- Recovery emails may not work (password reset fails)
- Data quality issues
- Future communication attempts fail

## 💡 Expected Solution

Use the EMAIL_PATTERN to validate on registration:
\`\`\`javascript
if (!EMAIL_PATTERN.test(email)) {
  return Response.json({ error: 'Invalid email address' }, { status: 400 });
}
\`\`\`

Or use a well-tested email validation library.

## ✅ Acceptance Criteria

- [ ] Email field is validated using EMAIL_PATTERN or library
- [ ] Invalid emails are rejected (400 Bad Request)
- [ ] Validation happens before database insertion
- [ ] Test case covers invalid email formats
- [ ] Valid emails pass validation (e.g., user+tag@domain.co.uk)`,
    labels: ["security", "medium", "validation", "API"],
  },
  {
    title:
      "SECURITY: No validation that uploaded file is actually a File object",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The register endpoint (app/api/register/route.js:31-55) calls \`photo.arrayBuffer()\` without checking that \`photo\` is actually a File object. If a client sends a non-File value, calling \`arrayBuffer()\` may throw an unexpected error or behave unexpectedly.

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js:31-55
// Assumes photo is File, no type check
const buffer = await photo.arrayBuffer();
\`\`\`

## ⚠️ Impact

- Unhandled exceptions crash the request
- Potential information disclosure in error messages
- Unexpected behavior if photo is string, null, or other type

## 💡 Expected Solution

Validate that the uploaded value is a File before processing:
\`\`\`javascript
if (!(photo instanceof File)) {
  return Response.json({ error: 'Photo must be a valid file' }, { status: 400 });
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Input is checked to be an instance of File
- [ ] Non-File values are rejected (400 Bad Request)
- [ ] Error message is user-friendly
- [ ] Test covers passing non-File values
- [ ] No unhandled exceptions are thrown`,
    labels: ["security", "medium", "validation", "API"],
  },
  {
    title: "SECURITY: Uploaded blob not rolled back if database insert fails",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The register endpoint (app/api/register/route.js:63-75) uploads a blob to storage, then attempts to insert a record into MongoDB. If the database insert fails, the uploaded blob is orphaned—it remains in storage but is never associated with a user account.

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js:63-75
// Upload first, then insert DB
// No rollback if insert fails
\`\`\`

## ⚠️ Impact

- Storage bloat from orphaned files
- Increased storage costs
- No way to recover orphaned files
- Manual cleanup required

## 💡 Expected Solution

Implement transactional-like behavior:
1. Insert user record in database first
2. Upload blob only if database insert succeeds
3. If upload fails, delete the user record (or mark as incomplete)

Alternatively:
- Attempt insert first, **then** upload
- Use a background job to clean orphaned files periodically
- Implement explicit cleanup endpoint

## ✅ Acceptance Criteria

- [ ] Database insert is attempted before blob upload (preferred)
- [ ] If upload fails, database transaction is rolled back or marked
- [ ] If database insert fails after upload, orphaned file is deleted
- [ ] Test covers failure scenarios
- [ ] No orphaned files remain after failed registration`,
    labels: ["security", "medium", "API", "storage"],
  },
  {
    title: "SECURITY: Register endpoint accepts unauthenticated requests",
    body: `## 🚨 Severity: CRITICAL

## 📝 Issue Description

The entire register endpoint (app/api/register/route.js:29-75) has no authentication or authorization checks. **Anyone** can register an account, upload arbitrary face photos, and create user records.

While self-registration is sometimes desired, without limits, this creates:
- Spam/fake account creation
- Abuse via automated registration
- Unauthorized face data upload

## 🔍 Affected Code

\`\`\`javascript
// app/api/register/route.js:29-75
// No authentication middleware
\`\`\`

## ⚠️ Impact

- Spam accounts cluttering the system
- Unauthorized biometric data (faces) collection
- Privacy concerns
- Compliance violations (GDPR, CCPA)

## 💡 Expected Solution

Choose one of:
1. **Admin-only registration**: Require admin token/authentication
2. **Invitation-based**: Generate invite codes, validate before allowing registration
3. **Rate limiting + CAPTCHA**: Allow registration but rate-limit by IP/email
4. **Whitelist emails**: Only allow registered institutional email domains

Add the chosen mechanism **before** processing the registration.

## ✅ Acceptance Criteria

- [ ] Registration requires authorization (admin, invite, or rate limit)
- [ ] Unauthorized registration attempts return 401/403
- [ ] Spam/automated registration is mitigated
- [ ] Rate limits are logged and monitored
- [ ] Documentation explains the registration policy`,
    labels: ["security", "critical", "authentication", "API"],
  },
  {
    title:
      "SECURITY: Labels endpoint exposes full user list without authentication",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The \`/api/labels\` endpoint (app/api/labels/route.js:4-13) returns the full list of users including:
- Email addresses
- Profile images/photos
- Potentially other PII

And it does so **without any authentication checks**. Anyone can enumerate all users and their data.

## 🔍 Affected Code

\`\`\`javascript
// app/api/labels/route.js:4-13
// No authentication, returns full user list
\`\`\`

## ⚠️ Impact

- Privacy breach: user emails and photos exposed
- User enumeration attack (attacker learns who has accounts)
- Potential compliance violations
- Data harvesting by malicious actors

## 💡 Expected Solution

1. Add authentication middleware to require valid session/token
2. Consider returning only the authenticated user's own data
3. If returning multiple users is needed, paginate and require authorization
4. Never return sensitive fields (like internal IDs) unnecessarily

## ✅ Acceptance Criteria

- [ ] Endpoint requires valid authentication
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Only authorized users see the data
- [ ] Sensitive fields (if any) are excluded
- [ ] Rate limiting is applied to prevent enumeration`,
    labels: ["security", "high", "authentication", "API", "privacy"],
  },
  {
    title:
      "SECURITY: Settings update endpoint accepts unauthenticated requests",
    body: `## 🚨 Severity: CRITICAL

## 📝 Issue Description

The \`/api/settings\` update endpoint (app/api/settings/route.js:6-23) has no authentication. **Any client** can overwrite any user's settings by sending a request with a target user ID.

## 🔍 Affected Code

\`\`\`javascript
// app/api/settings/route.js:6-23
// No authentication check, updates arbitrary user settings
\`\`\`

## ⚠️ Impact

- Attackers can change other users' settings
- Privacy settings can be reset (e.g., visibility, notifications)
- User experience sabotage
- Potential account compromise if settings affect authentication

## 💡 Expected Solution

1. Add authentication middleware
2. Verify that the authenticated user matches the settings owner (or is admin)
3. Only allow users to modify their own settings (unless admin)
4. Log all setting changes with user ID for audit

## ✅ Acceptance Criteria

- [ ] Endpoint requires valid authentication
- [ ] Users can only update their own settings
- [ ] Admin can update any user's settings (if applicable)
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Setting changes are logged for audit`,
    labels: ["security", "critical", "authentication", "API", "authorization"],
  },
  {
    title: "SECURITY: Settings endpoint uses wrong MongoDB database",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The settings endpoint (app/api/settings/route.js:16-18) calls \`client.db()\` without specifying a database name, using the MongoDB client's default database. This is inconsistent with the rest of the app, which uses \`process.env.MONGODB_DB\`.

## 🔍 Affected Code

\`\`\`javascript
// app/api/settings/route.js:16-18
const db = client.db(); // Uses default DB, inconsistent
// Should be:
// const db = client.db(process.env.MONGODB_DB);
\`\`\`

## ⚠️ Impact

- Settings may be stored in wrong database
- Data consistency issues
- Queries may find wrong data (or no data)
- Difficult to debug and maintain

## 💡 Expected Solution

Use the configured database name consistently:
\`\`\`javascript
const db = client.db(process.env.MONGODB_DB);
\`\`\`

Audit all other API routes to ensure they use the same pattern.

## ✅ Acceptance Criteria

- [ ] Settings endpoint uses \`process.env.MONGODB_DB\`
- [ ] Database name is consistent with other endpoints
- [ ] All API routes verified to use correct database
- [ ] Environment variable is checked to be set
- [ ] Tests pass with correct database selection`,
    labels: ["security", "high", "database", "bug"],
  },
  {
    title: "SECURITY: Exceptions list endpoint not role-restricted",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The \`/api/exceptions/list\` endpoint (app/api/exceptions/list/route.js:16-24) returns all exceptions from the database **without checking user roles**. Any authenticated user can view exceptions that may be private to other users, departments, or roles.

## 🔍 Affected Code

\`\`\`javascript
// app/api/exceptions/list/route.js:16-24
// No role/permission checks
\`\`\`

## ⚠️ Impact

- Information disclosure: users see data they shouldn't
- Privacy violation (exceptions may contain sensitive info)
- Compliance violations
- Unauthorized access to privileged information

## 💡 Expected Solution

1. Add role-based access control (RBAC)
2. Verify user role before returning data
3. Filter results based on user's permissions:
   - Students see only their own exceptions
   - Teachers see exceptions for their students
   - Admins see all exceptions
4. Return 403 Forbidden for unauthorized access

## ✅ Acceptance Criteria

- [ ] User role is checked before returning data
- [ ] Results are filtered based on user role
- [ ] Unauthorized users get 403 Forbidden
- [ ] Students see only their own exceptions
- [ ] Teachers see exceptions for their assigned students
- [ ] Admins see all exceptions`,
    labels: ["security", "high", "authorization", "API", "RBAC"],
  },
  {
    title: "SECURITY: Pending exceptions endpoint not role-restricted",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The \`/api/exceptions/all\` endpoint (app/api/exceptions/all/route.js:16-24) has the same issue as the exceptions list: no role-based access control. Any authenticated user sees all pending exceptions.

## 🔍 Affected Code

\`\`\`javascript
// app/api/exceptions/all/route.js:16-24
// No role/permission checks
\`\`\`

## ⚠️ Impact

- Same as exceptions list: data exposure by role
- Users see exceptions they shouldn't access

## 💡 Expected Solution

Same as exceptions list endpoint—add role-based filtering.

## ✅ Acceptance Criteria

- [ ] User role is checked before returning data
- [ ] Results are filtered based on user role
- [ ] Unauthorized users get 403 Forbidden
- [ ] Role-based filtering is consistent with exceptions list endpoint`,
    labels: ["security", "high", "authorization", "API", "RBAC"],
  },
  {
    title: "SECURITY: Exceptions update endpoint lacks role checks",
    body: `## 🚨 Severity: CRITICAL

## 📝 Issue Description

The \`/api/exceptions/update\` endpoint (app/api/exceptions/update/route.js:17-35) allows any authenticated user to approve or reject exceptions **without checking their role**. Only admins or designated reviewers should be able to modify exception status.

## 🔍 Affected Code

\`\`\`javascript
// app/api/exceptions/update/route.js:17-35
// No role check before updating
\`\`\`

## ⚠️ Impact

- Any user can approve/reject exceptions for anyone
- Attendance/leave fraud possible
- Bypass of approval workflows
- Compliance violations
- Audit trail unreliable

## 💡 Expected Solution

1. Check that user has admin or reviewer role
2. Verify they have permission to approve exceptions for the target user
3. Log all approvals/rejections with approver ID
4. Return 403 Forbidden if unauthorized

\`\`\`javascript
if (!hasRole(user, 'admin', 'exception_reviewer')) {
  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}
\`\`\`

## ✅ Acceptance Criteria

- [ ] Only admins/reviewers can update exceptions
- [ ] Unauthorized users get 403 Forbidden
- [ ] All updates are logged with approver ID
- [ ] Role is verified before any database changes
- [ ] Test covers unauthorized access attempts`,
    labels: ["security", "critical", "authorization", "API", "RBAC"],
  },
  {
    title: "SECURITY: Exceptions list endpoint has no pagination",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The \`/api/exceptions/list\` endpoint (app/api/exceptions/list/route.js:18-23) returns all exceptions without pagination or limits. A large dataset could:
- Consume excessive memory when fetching
- Slow down the API response
- Enable DOS via large result sets

## 🔍 Affected Code

\`\`\`javascript
// app/api/exceptions/list/route.js:18-23
// No limit() or pagination
\`\`\`

## ⚠️ Impact

- Performance degradation as data grows
- Unbounded memory usage
- Slow API responses
- Potential DOS vulnerability

## 💡 Expected Solution

Implement pagination:
1. Accept \`page\` and \`limit\` query parameters
2. Set reasonable defaults (e.g., limit=20, page=1)
3. Enforce maximum limit (e.g., max 100 per page)
4. Return pagination metadata (total, page, hasMore)

\`\`\`javascript
const page = parseInt(req.query.page || 1);
const limit = Math.min(parseInt(req.query.limit || 20), 100);
const skip = (page - 1) * limit;

const data = await collection.find(...).skip(skip).limit(limit).toArray();
\`\`\`

## ✅ Acceptance Criteria

- [ ] Endpoint accepts \`page\` and \`limit\` query parameters
- [ ] Default limit is reasonable (e.g., 20)
- [ ] Maximum limit is enforced (e.g., 100)
- [ ] Response includes pagination metadata
- [ ] Tests cover pagination edge cases`,
    labels: ["security", "medium", "performance", "API"],
  },
  {
    title: "PERFORMANCE: Attendance check query scans all records in memory",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The attendance service check (services/attendanceService.js:23-31) fetches **all attendance records** from the database, then filters them in memory. This is an O(n) operation that becomes slower as the dataset grows.

## 🔍 Affected Code

\`\`\`javascript
// services/attendanceService.js:23-31
// const records = await collection.find({}).toArray(); // Gets ALL
// const matching = records.filter(r => r.userId === userId); // Filters in memory
\`\`\`

## ⚠️ Impact

- Query time grows linearly with total attendance records
- Excessive memory usage (loading all records)
- Slow API responses, especially for large deployments
- Database load increases

## 💡 Expected Solution

Push the filter to MongoDB:
\`\`\`javascript
const record = await collection.findOne({ userId, date: startOfDay });
\`\`\`

Or for multiple records:
\`\`\`javascript
const records = await collection.find({ userId }).toArray();
\`\`\`

Add indexes on \`userId\` and \`date\` fields for faster lookups.

## ✅ Acceptance Criteria

- [ ] Query filters in MongoDB, not memory
- [ ] Indexes exist on \`userId\` and \`date\` fields
- [ ] Test verifies correct results with large datasets
- [ ] Performance test shows O(1) or O(log n) lookup
- [ ] Database load is reduced`,
    labels: ["performance", "medium", "database", "optimization"],
  },
  {
    title: "SECURITY: Attendance write has race condition risk",
    body: `## 🚨 Severity: HIGH

## 📝 Issue Description

The attendance service write (services/attendanceService.js:44-56) checks if an attendance record exists, then inserts it if not found. However, between the check and insert, another concurrent request could insert the same record, creating duplicates (Time-of-Check-to-Time-of-Use race condition).

## 🔍 Affected Code

\`\`\`javascript
// services/attendanceService.js:44-56
// Check if exists
const existing = await collection.findOne(...);
if (!existing) {
  // Insert — but another request could insert here!
  await collection.insertOne(...);
}
\`\`\`

## ⚠️ Impact

- Duplicate attendance records created
- Attendance count incorrect (inflated)
- Data integrity issues
- Audit inconsistencies

## 💡 Expected Solution

Use MongoDB's atomic operations:

1. **Upsert** (atomic update-or-insert):
\`\`\`javascript
await collection.updateOne(
  { userId, date },
  { $setOnInsert: { userId, date, ... } },
  { upsert: true }
);
\`\`\`

2. **Unique index**: Add unique constraint to prevent duplicates
\`\`\`javascript
await collection.createIndex({ userId: 1, date: 1 }, { unique: true });
\`\`\`

3. **Transaction**: Use MongoDB transactions for the check + insert

## ✅ Acceptance Criteria

- [ ] Upsert is used instead of check-then-insert
- [ ] Unique index exists on (userId, date)
- [ ] Test verifies no duplicates with concurrent requests
- [ ] All existing tests pass`,
    labels: ["security", "high", "database", "concurrency"],
  },
  {
    title: "PERFORMANCE: Attendance rate recalculation is O(n) expensive",
    body: `## 🚨 Severity: MEDIUM

## 📝 Issue Description

The stats service recalculates attendance rates (services/statsService.js:93-109) by reading **all attendance records** every time it's called. This becomes slower as the dataset grows, and if called frequently, causes unnecessary database load.

## 🔍 Affected Code

\`\`\`javascript
// services/statsService.js:93-109
// Reads all records, recalculates rate each time
const allRecords = await collection.find({}).toArray();
// ... calculation ...
\`\`\`

## ⚠️ Impact

- Slow calculation, especially with large datasets
- Excessive database queries if called frequently
- High database load during peak usage
- Potential timeouts for users

## 💡 Expected Solution

Choose one or more:

1. **Materialized view**: Store pre-calculated rate, update only when needed
\`\`\`javascript
const stats = await statsCollection.findOne({ userId });
return stats.attendanceRate;
\`\`\`

2. **Incremental updates**: Update rate on each attendance change, not recalculate from scratch

3. **Caching**: Cache results with TTL (e.g., 1 hour)

4. **Aggregation pipeline**: Use MongoDB aggregation for faster calculation

## ✅ Acceptance Criteria

- [ ] Rate calculation does not read all records
- [ ] Performance is O(1) or O(log n)
- [ ] Calculation result is cached or materialized
- [ ] Test verifies correct results
- [ ] Load test shows acceptable performance with 100k+ records`,
    labels: ["performance", "medium", "database", "optimization"],
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

console.log(
  `🚀 Creating ${ISSUES.length} security issues on ${OWNER}/${REPO}...\n`
);

for (const issue of ISSUES) {
  await createIssue(issue);
  // Small delay to avoid rate-limiting
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.log("\n✨ Done!");
