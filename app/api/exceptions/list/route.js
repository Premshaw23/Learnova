// app/api/exceptions/list/route.js

import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError, ForbiddenError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { escapeRegex, sanitizeSortField } from "@/utils/mongoUtils";

// Forces Next.js to treat this as a runtime API instead of trying to statically compile it during npm run build
export const dynamic = "force-dynamic";

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "status",
  "date",
  "studentEmail",
  "reason",
]);

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `exceptions_list_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const { searchParams } = new URL(request.url);

  // Pagination - extract and validate query parameters
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const limit = limitParam
    ? Math.min(100, Math.max(1, parseInt(limitParam, 10)))
    : 10;

  // Validate pagination parameters
  if (isNaN(page) || isNaN(limit)) {
    const { ValidationError } = require("@/lib/errors");
    throw new ValidationError("Invalid pagination parameters");
  }

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

  const skip = (page - 1) * limit;

  const db = await connectDb();
  const collection = db.collection("exceptions");

  // Base query
  const query = {
    status: "pending",
  };

  // Tenant isolation
  const userInstituteId =
    profile?.instituteId ||
    (profile?.role === "institute" ? profile?.uid : null);
  if (userInstituteId) {
    query.instituteId = userInstituteId;
  } else if (profile?.role !== "admin") {
    throw new ForbiddenError(
      "Forbidden: User profile missing institute affiliation."
    );
  }

  // Role-based filtering
  if (profile.role === "student") {
    query.studentEmail = decodedToken.email;
  } else if (profile.role === "teacher") {
    const teacherSubjects = profile.subjects || [];
    query.$and = [
      {
        $or: [
          { className: { $in: teacherSubjects } },
          { class: { $in: teacherSubjects } },
        ],
      },
    ];
  }

  // Search filter
  if (search) {
    const searchOr = [
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
    ];
    if (query.$and) {
      query.$and.push({ $or: searchOr });
    } else {
      query.$or = searchOr;
    }
  }

  // Total count
  const total = await collection.countDocuments(query);

  // Fetch data
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
    200
  );
});
