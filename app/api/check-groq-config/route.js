import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const hasKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "";
  
  if (!hasKey) {
    throw new AppError("Groq API key is not configured", 500);
  }
  
  return NextResponse.json({ hasKey }, { status: 200 });
});