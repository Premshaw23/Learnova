import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

  const body = await request.json();
  const validData = noticeSchema.parse(body);

  const db = await connectDb();
  
  const newNotice = {
    ...validData,
    author: decodedToken.name || decodedToken.email.split("@")[0],
    authorId: decodedToken.uid,
    authorRole: profile.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("notices").insertOne(newNotice);

  return NextResponse.json({
    success: true,
    notice: { id: result.insertedId, ...newNotice }
  });
}

export const POST = withErrorHandler(publishNotice);
