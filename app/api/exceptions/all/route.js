import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
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
  await requireRole(request, ["admin", "teacher"]);

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );

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
