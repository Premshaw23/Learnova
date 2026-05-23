import { NextResponse } from "next/server";

/**
 * Creates a JSON error response for Next.js API routes.
 * @param {string|Object} error - The error message or object to include in the response body.
 * @param {number} [status=500] - HTTP status code for the response.
 * @returns {NextResponse} A Next.js JSON response with the error payload.
 * @example
 * return jsonError('User not found', 404);
 * // Response body: { "error": "User not found" }
 */
export function jsonError(error, status = 500) {
  return NextResponse.json({ error }, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

/**
 * Creates a JSON success response for Next.js API routes.
 * @param {*} data - The data payload to include in the response body.
 * @param {number} [status=200] - HTTP status code for the response.
 * @returns {NextResponse} A Next.js JSON response with `success: true` and the data payload.
 * @example
 * return jsonSuccess({ user: { id: '123', name: 'Alice' } }, 201);
 * // Response body: { "success": true, "data": { "user": { ... } } }
 */
export function jsonSuccess(data, status = 200) {
  return NextResponse.json({ success: true, data }, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
