import { NextResponse } from "next/server";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function withNoStoreHeaders(body, status) {
  return NextResponse.json(body, {
    status,
    headers: noStoreHeaders,
  });
}

export function success(data, meta = {}, status = 200) {
  return withNoStoreHeaders({ success: true, data, meta }, status);
}

export function fail(status, code, message, details = null) {
  return withNoStoreHeaders(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    status,
  );
}

export function jsonSuccess(data, status = 200) {
  return success(data, {}, status);
}

export function jsonError(error, status = 500) {
  if (error && typeof error === "object") {
    return fail(status, error.code || `HTTP_${status}`, error.message || "Unknown error", error.details ?? null);
  }

  return fail(status, `HTTP_${status}`, error, null);
}
