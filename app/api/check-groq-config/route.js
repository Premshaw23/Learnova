import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hasKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "";
    
    return NextResponse.json({ hasKey }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ hasKey: false }, { status: 500 });
  }
}