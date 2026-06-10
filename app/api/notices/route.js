import { NextResponse } from "next/server";
import { getAdminDb, getUserProfile } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError, ForbiddenError } from "@/lib/errors";
import { connectDb } from "@/lib/mongodb";
import { publishNoticeToRedis } from "@/app/api/notices/stream/route";
import { createNoticeSchema, withValidation } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function publishNotice(request, validData) {
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);

  // Gating access inside the route handler
  if (!profile || !["teacher", "admin", "staff"].includes(profile.role)) {
    throw new ForbiddenError(
      "Forbidden: Only teachers, admins, and staff can post notices."
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `publish_notice_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const adminDb = getAdminDb();
  const instituteId = profile.instituteId || null;

  const newNotice = {
    ...validData,
    author: decodedToken.name || decodedToken.email.split("@")[0],
    authorId: decodedToken.uid,
    authorRole: profile.role,
    instituteId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await adminDb.collection("notices").add(newNotice);

  // Sync to MongoDB for SSE Change Stream support
  try {
    const mongoDb = await connectDb();
    await mongoDb.collection("notices").insertOne({
      ...newNotice,
      _id: result.id,
    });
  } catch (mongoError) {
    console.error("Failed to sync notice to MongoDB:", mongoError);
  }

  // Publish to Redis for real-time SSE delivery
  try {
    await publishNoticeToRedis({
      ...newNotice,
      _id: result.id,
    });
  } catch (redisError) {
    console.error("Failed to publish notice to Redis:", redisError);
  }

  return NextResponse.json({
    success: true,
    notice: { id: result.id, ...newNotice },
  });
}

export const POST = withErrorHandler(
  withValidation(createNoticeSchema, publishNotice, { maxBytes: 1024 * 50 })
);

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `get_notices_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const userRole = profile?.role || "student";
  const instituteId = profile?.instituteId || profile?.uid || decodedToken.uid;

  if (!instituteId) {
    throw new AppError("Unauthorized: Missing institute configuration.", 401);
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";
  const priority = searchParams.get("priority") || "all";
  const tags = searchParams.get("tags") || "";
  const dateRange = searchParams.get("dateRange") || "all";
  const sort = searchParams.get("sort") || "newest";
  const showOnlyUnread = searchParams.get("showOnlyUnread") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  // Parse readNotices from query parameter or userProfile
  let readNoticeIds = [];
  const readNoticesParam = searchParams.get("readNotices");
  if (readNoticesParam) {
    readNoticeIds = readNoticesParam.split(",").map(id => id.trim()).filter(Boolean);
  } else if (profile && Array.isArray(profile.readNotices)) {
    readNoticeIds = profile.readNotices;
  }

  // Base filters: match role in targetAudience AND match instituteId
  const baseFilter = {
    targetAudience: userRole,
    instituteId: instituteId
  };

  // Build query filters on top of base filter
  const queryFilter = { ...baseFilter };

  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    queryFilter.$or = [
      { title: searchRegex },
      { content: searchRegex },
      { category: searchRegex },
      { tags: searchRegex }
    ];
  }

  if (category && category !== "all") {
    queryFilter.category = category;
  }

  if (priority && priority !== "all") {
    queryFilter.priority = priority;
  }

  if (tags) {
    const tagsList = tags.split(",").map(t => t.trim()).filter(Boolean);
    if (tagsList.length > 0) {
      queryFilter.tags = { $all: tagsList };
    }
  }

  if (dateRange && dateRange !== "all") {
    const now = new Date();
    let minDate;
    if (dateRange === "today") {
      minDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateRange === "7d") {
      minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30d") {
      minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (minDate) {
      queryFilter.createdAt = { $gte: minDate };
    }
  }

  if (showOnlyUnread && readNoticeIds.length > 0) {
    queryFilter._id = { $nin: readNoticeIds };
  }

  const mongoDb = await connectDb();

  // Parallelize counts for stats, matching notices count for pagination, and unique tags database-wide
  const [totalCount, pinnedCount, highCount, unreadCount, totalNotices, results, uniqueTags] = await Promise.all([
    mongoDb.collection("notices").countDocuments(baseFilter),
    mongoDb.collection("notices").countDocuments({ ...baseFilter, isPinned: true }),
    mongoDb.collection("notices").countDocuments({ ...baseFilter, priority: "high" }),
    mongoDb.collection("notices").countDocuments({ ...baseFilter, _id: { $nin: readNoticeIds } }),
    mongoDb.collection("notices").countDocuments(queryFilter),
    mongoDb.collection("notices")
      .find(queryFilter)
      .sort({ isPinned: -1, createdAt: sort === "oldest" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    mongoDb.collection("notices").distinct("tags", baseFilter)
  ]);

  // Format response notices
  const formattedNotices = results.map(doc => {
    const { _id, ...rest } = doc;
    return { id: _id, ...rest };
  });

  return NextResponse.json({
    success: true,
    notices: formattedNotices,
    stats: {
      total: totalCount,
      unread: unreadCount,
      pinned: pinnedCount,
      high: highCount
    },
    totalNotices,
    tags: uniqueTags.filter(Boolean)
  });
});

