// app/api/exceptions/list/route.js

import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { escapeRegex, sanitizeSortField } from "@/utils/mongoUtils";

export async function GET(request) {
  try {
    // 1. Extract and validate pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "status",
  "date",
  "studentEmail",
  "reason",
]);

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, ["admin", "teacher", "student"]);

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );

    // Search — escape metacharacters and cap length to prevent ReDoS
    const rawSearch = searchParams.get("search") || "";
    const search = escapeRegex(rawSearch);

    // Sorting — validate against an explicit allowlist to prevent field-name injection
    const sortBy = sanitizeSortField(
      searchParams.get("sortBy"),
      ALLOWED_SORT_FIELDS,
      "createdAt"
    );
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Validation
    if (page < 1 || limit < 1) {
      const { ValidationError } = require("@/lib/errors");
      throw new ValidationError("Page and limit must be greater than 0");
    }

    const skip = (page - 1) * limit;

    const db = await connectDb();
    const collection = db.collection("exceptions");
    
    // Define query based on role
    let query = { status: "pending" };
    if (profile.role === "student") {
      query.studentEmail = decodedToken.email;
    } else if (profile.role !== "admin" && profile.role !== "teacher") {
      return jsonError("Forbidden", 403);
    }

    // 2. Fetch total count and paginated data
    const total = await collection.countDocuments(query);
    
    const exceptions = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)    // Apply skip
      .limit(limit)  // Apply limit
      .toArray();

    const totalPages = Math.ceil(total / limit);

    return jsonSuccess(
      {
        exceptions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
    }, 200);
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
