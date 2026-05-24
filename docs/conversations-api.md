# Conversations API Endpoint Documentation

Endpoint for saving chat conversations securely with full type validation, size limits, and sanitization.

---

## Endpoint Details

- **URL**: `/api/conversations`
- **Method**: `POST`
- **Authentication**: Requires a valid Firebase ID Token as a bearer token in the `Authorization` header.

### Request Headers

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <Firebase_ID_Token>` | **Required.** Firebase authentication token to verify user identity. |
| `Content-Type` | `application/json` | **Required.** Must be JSON payload. |

---

## Accepted Request Payload Fields

The payload must be a JSON object containing the following properties:

| Field | Type | Required | Limits | Description |
|---|---|---|---|---|
| `userMessage` | `string` | **Yes** | Min 1 char, Max 10,000 chars | The message sent by the user. Stripped of `<script>` tags. |
| `botMessage` | `string` | **Yes** | Min 1 char, Max 10,000 chars | The message returned by the bot. Stripped of `<script>` tags. |

---

## Security and System Constraints

1. **Payload Size Limit**: The overall raw request payload is strictly capped at **1MB (1,048,576 bytes)**. Payloads exceeding this size are rejected early before parsing.
2. **Schema Enforcement**: Checked and validated using the `zod` validation library.
3. **Content Sanitization**: String inputs are trimmed of surrounding whitespace, and HTML `<script>` tags are automatically stripped server-side to prevent XSS script injection.

---

## Response Status Codes

### Success Response (200 OK)

Returned when the conversation is successfully validated and stored.

- **Status Code**: `200`
- **Body**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "user_uid_12345",
      "userEmail": "user@domain.com",
      "userMessage": "Hello, bot!",
      "botMessage": "Hello there!",
      "timestamp": "2026-05-20T18:49:56.000Z"
    }
  }
  ```

### Error Responses

- **400 Bad Request**
  - Malformed JSON payload.
  - Missing required fields or incorrect field types (e.g., passing numbers or arrays).
  - Empty messages.
  
- **401 Unauthorized**
  - Missing `Authorization` header or invalid/expired Firebase ID token.

- **413 Payload Too Large**
  - Request body size exceeds the **1MB** limit.

- **500 Internal Server Error**
  - Database connection or server-side failure.
