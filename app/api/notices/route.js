import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireRole, requireApiAccess } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/lib/mongodb";
import { publishNoticeToRedis } from "@/app/api/notices/stream/route";
import { createNoticeSchema, withValidation } from "@/lib/validations";
import { escapeRegex } from "@/utils/mongoUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function publishNotice(request, validData) {
  const allowedRoles = ["teacher", "admin", "staff"];
  const { payload: decodedToken, profile } = await requireRole(
    request,
    allowedRoles
  );

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

  // Publish to Redis for SSE real-time stream
  try {
    await publishNoticeToRedis({ ...newNotice, _id: result.id });
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
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`get_notices_${ip}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const { profile } = await requireApiAccess(request, {
    allowedRoles: ["student", "parent", "teacher", "admin", "staff", "institute"],
  });

  const userRole = profile?.role || "student";
  const instituteId = profile?.instituteId || profile?.uid || null;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const skip = (page - 1) * limit;

  const searchVal = searchParams.get("search") || "";
  const category = searchParams.get("category") || "all";
  const priority = searchParams.get("priority") || "all";
  const tags = searchParams.get("tags") || "";
  const dateRange = searchParams.get("dateRange") || "all";
  const sort = searchParams.get("sort") || "newest";
  const unreadOnly = searchParams.get("unreadOnly") || "false";
  const readNotices = searchParams.get("readNotices") || "";

  const filter = {
    targetAudience: userRole,
    instituteId: instituteId,
  };

  if (category !== "all") {
    filter.category = category;
  }

  if (priority !== "all") {
    filter.priority = priority;
  }

  if (tags) {
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $all: tagList };
    }
  }

  if (dateRange !== "all") {
    const now = new Date();
    let cutoff;
    if (dateRange === "today") {
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateRange === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (cutoff) {
      filter.createdAt = { $gte: cutoff };
    }
  }

  if (unreadOnly === "true" && readNotices) {
    const readIds = readNotices.split(",").map((id) => id.trim()).filter(Boolean);
    if (readIds.length > 0) {
      filter._id = { $nin: readIds };
    }
  }

  const escapedSearch = escapeRegex(searchVal);
  if (escapedSearch) {
    const regex = new RegExp(escapedSearch, "i");
    filter.$or = [
      { title: regex },
      { content: regex },
      { category: regex },
      { tags: regex },
    ];
  }

  const db = await connectDb();
  const noticesCol = db.collection("notices");

  const sortObj = {
    isPinned: -1,
    createdAt: sort === "oldest" ? 1 : -1,
  };

  let notices = [];
  let totalCount = 0;

  if (escapedSearch) {
    try {
      const searchStage = {
        $search: {
          index: "notices-search",
          text: {
            query: searchVal,
            path: ["title", "content", "category", "tags"],
            fuzzy: { maxEdits: 1 },
          },
        },
      };

      const matchStage = {
        $match: { ...filter },
      };

      delete matchStage.$match.$or;

      const countPipeline = [searchStage, matchStage, { $count: "total" }];
      const dataPipeline = [
        searchStage,
        matchStage,
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit },
      ];

      const [countResult, dataResult] = await Promise.all([
        noticesCol.aggregate(countPipeline).toArray(),
        noticesCol.aggregate(dataPipeline).toArray(),
      ]);

      totalCount = countResult[0]?.total || 0;
      notices = dataResult.map((n) => ({ ...n, id: n._id.toString() }));
    } catch (atlasError) {
      console.warn("Atlas Search failed, using regex query fallback:", atlasError.message);
      const [count, data] = await Promise.all([
        noticesCol.countDocuments(filter),
        noticesCol
          .find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .toArray(),
      ]);
      totalCount = count;
      notices = data.map((n) => ({ ...n, id: n._id.toString() }));
    }
  } else {
    const [count, data] = await Promise.all([
      noticesCol.countDocuments(filter),
      noticesCol
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);
    totalCount = count;
    notices = data.map((n) => ({ ...n, id: n._id.toString() }));
  }

  // Dynamic tags, suggestions, and stats
  const baseFilter = {
    targetAudience: userRole,
    instituteId: instituteId,
  };
  const availableTags = await noticesCol.distinct("tags", baseFilter);

  const suggestionNotices = await noticesCol
    .find(baseFilter, { projection: { title: 1, category: 1, tags: 1 } })
    .limit(200)
    .toArray();

  const uniqueSuggestions = new Set();
  suggestionNotices.forEach((n) => {
    if (n.title) uniqueSuggestions.add(n.title);
    if (n.category) uniqueSuggestions.add(n.category);
    if (n.tags) n.tags.forEach((t) => uniqueSuggestions.add(t));
  });

  const [totalStatsCount, pinnedCount, highCount] = await Promise.all([
    noticesCol.countDocuments(baseFilter),
    noticesCol.countDocuments({ ...baseFilter, isPinned: true }),
    noticesCol.countDocuments({ ...baseFilter, priority: "high" }),
  ]);

  let unreadCount = totalStatsCount;
  if (readNotices) {
    const readIds = readNotices.split(",").map((id) => id.trim()).filter(Boolean);
    if (readIds.length > 0) {
      unreadCount = await noticesCol.countDocuments({
        ...baseFilter,
        _id: { $nin: readIds },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      notices,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      currentPage: page,
      tags: availableTags.sort(),
      suggestions: Array.from(uniqueSuggestions).sort(),
      stats: {
        total: totalStatsCount,
        unread: unreadCount,
        pinned: pinnedCount,
        high: highCount,
      },
    },
  });
});
