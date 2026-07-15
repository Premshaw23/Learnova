# Error Handling & Credential Security

This document outlines best practices for handling errors safely in the application, preventing accidental exposure of sensitive credentials in logs.

## Problem

When database errors (especially MongoDB connection errors) are logged without sanitization, they can expose sensitive information:

```javascript
// ❌ UNSAFE - Exposes MongoDB URI with credentials
console.error("Database error:", error);
// Output: "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true"
```

## Solution

Use the `error-sanitizer` utility to redact sensitive patterns before logging:

```javascript
// ✅ SAFE - Credentials are redacted
import { sanitizeErrorForLogging, safeConsoleError } from "@/lib/error-sanitizer";

// Method 1: Sanitize explicitly
const sanitized = sanitizeErrorForLogging(error);
console.error("Database error:", sanitized);

// Method 2: Use safe wrapper (recommended)
safeConsoleError("Database error:", error);
```

## What Gets Redacted

The error sanitizer automatically redacts:

- **MongoDB URIs**: `mongodb+srv://user:pass@...` → `mongodb+srv://[redacted-credentials]@...`
- **Bearer Tokens**: `Bearer eyJhbGc...` → `Bearer [redacted-token]`
- **API Keys**: `api_key: "sk_live_..."` → `api_key: [redacted]`
- **Passwords**: `password: "secret123"` → `password: [redacted]`
- **Secrets**: `secret: "..."` → `secret: [redacted]`

## Usage in API Routes

### Using withErrorHandler (Automatic)

The `withErrorHandler` wrapper automatically sanitizes errors when monitoring:

```javascript
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (request) => {
  // Your route logic
  // Errors are automatically sanitized before being logged
});
```

### Manual Console Logging

When you need to log errors manually, use the safe wrapper:

```javascript
import { safeConsoleError } from "@/lib/error-sanitizer";

try {
  await db.collection("users").insertOne(data);
} catch (error) {
  // ✅ Credentials will be redacted
  safeConsoleError("[API] Insert operation failed:", error);
  throw new AppError("Database operation failed", 500);
}
```

### In Database Utilities

The MongoDB connection utilities (`lib/mongodb.js`) automatically sanitize errors:

```javascript
export async function connectDb() {
  try {
    // ...
  } catch (error) {
    // Automatically sanitized before logging
    logger.error("[DB Manager] Connection failed", {
      error: sanitizeErrorForLogging(error).message,
    });
    throw error;
  }
}
```

## Guidelines

### ✅ Do:

- Use `safeConsoleError()` instead of `console.error()` in API routes
- Use `sanitizeErrorForLogging()` when passing errors to logging libraries
- Let `withErrorHandler` handle sanitization automatically
- Log only `error.message` instead of the full error object
- Test error logging with real MongoDB URIs before deploying

### ❌ Don't:

- Log the full error object without sanitization
- Include error details in user-facing messages
- Log environment variables or configuration
- Store error messages in user-visible responses
- Trust JSON.stringify() to safely serialize errors

## Testing

To verify credentials are properly redacted:

```javascript
import { sanitizeErrorForLogging } from "@/lib/error-sanitizer";

const fakeUri = "mongodb+srv://admin:password123@cluster.mongodb.net/?retryWrites=true";
const error = new Error(`Connection failed: ${fakeUri}`);

const sanitized = sanitizeErrorForLogging(error);
console.log(sanitized.message);
// Output: "Connection failed: mongodb+srv://[redacted-credentials]@cluster.mongodb.net/?retryWrites=true"
```

## Related Issues

- **Issue #3965**: MongoDB credentials exposed in logs
- **Issue #3968**: EmailJS public credentials in client code
- **Issue #3967**: Role-based access control bypass

## References

- [Error Sanitizer Implementation](../lib/error-sanitizer.js)
- [Error Handler Middleware](../lib/error-handler.js)
- [MongoDB Connection Pool](../lib/mongodb.js)
- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)
