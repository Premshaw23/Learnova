import { NextResponse } from "next/server";

/**
 * Creates a standardized JSON success response.
 * @param {*} data - The data payload to return
 * @param {Object} [meta={}] - Optional metadata (e.g. pagination)
 * @param {number} [status=200] - HTTP status code
 * @returns {NextResponse}
 */
export function success(data, meta = {}, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

/**
 * Creates a standardized JSON error response.
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code (e.g. 'UNAUTHORIZED')
 * @param {string} message - User-friendly error message
 * @param {*} [details=null] - Additional details or structural errors
 * @returns {NextResponse}
 */
export function fail(status, code, message, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
