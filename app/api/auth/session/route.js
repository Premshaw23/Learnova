import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await createSessionCookie(idToken, expiresIn);

    if (!sessionCookie) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Session creation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Session destruction failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
