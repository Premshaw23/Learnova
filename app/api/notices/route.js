import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL = 300_000;
const noticesCache = new Map();

function getCachedNotices(userRole) {
  const key = `notices:${userRole}`;
  const entry = noticesCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  if (entry) noticesCache.delete(key);
  return null;
}

function setCachedNotices(userRole, data) {
  noticesCache.set(`notices:${userRole}`, { data, timestamp: Date.now() });
}

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["academic", "administrative", "financial", "general", "technical", "all"]),
  priority: z.enum(["low", "medium", "high"]),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).min(1, "Target audience is required"),
});

async function publishNotice(request) {
  const allowedRoles = ["teacher", "admin", "staff"];
  const { payload: decodedToken, profile } = await requireRole(request, allowedRoles);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`publish_notice_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 50);
  const validData = noticeSchema.parse(body);

  const adminDb = getAdminDb();

  const newNotice = {
    ...validData,
    author: decodedToken.name || decodedToken.email.split("@")[0],
    authorId: decodedToken.uid,
    authorRole: profile.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await adminDb
    .collection("notices")
    .add(newNotice);

  return NextResponse.json({
    success: true,
    notice: { id: result.id, ...newNotice }
  });
}

async function getNotices(request) {
  const { payload: decodedToken } = await requireAuth(request);
  const userRole = decodedToken.role || "student";

  const cached = getCachedNotices(userRole);
  if (cached) {
    return NextResponse.json({ success: true, data: { notices: cached, cached: true } });
  }

  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("notices")
    .where("targetAudience", "array-contains", userRole)
    .orderBy("isPinned", "desc")
    .orderBy("createdAt", "desc")
    .get();

  const notices = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
  }));

  setCachedNotices(userRole, notices);
  return NextResponse.json({ success: true, data: { notices, cached: false } });
}

export const GET = withErrorHandler(getNotices);
export const POST = withErrorHandler(publishNotice);
