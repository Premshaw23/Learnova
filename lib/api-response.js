import { NextResponse } from "next/server";

export function jsonError(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export function jsonSuccess(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonUnauthorized(error = "Unauthorized") {
  return jsonError(error, 401);
}
