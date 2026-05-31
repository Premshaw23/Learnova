import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { escapeRegex, sanitizeSortField } from "@/utils/mongoUtils";

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "status",
  "date",
  "studentEmail",
  "reason",
]);

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["admin", "teacher"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`exceptions_all_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const { searchParams } = new URL(request.url);

    // Pagination - extract and validate query parameters
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit)) {
      const { ValidationError } = require("@/lib/errors");
      throw new ValidationError("Invalid pagination parameters");
    }

    const skip = (page - 1) * limit;

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

    const db = await connectDb();
    const collection = db.collection("exceptions");

    // Search query
    let query = {};

    if (search) {
      query.$or = [
        {
          reason: {
            $regex: search,
            $options: "i",
          },
        },
        {
          studentEmail: {
            $regex: search,
            $options: "i",
          },
        },
        {
          status: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Total count
    const total = await collection.countDocuments(query);

    // Fetch paginated data
    const exceptions = await collection
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
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
      200,
    );
});
