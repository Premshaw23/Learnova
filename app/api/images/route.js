import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing user id parameter" },
        { status: 400 }
      );
    }

    let token = null;

    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7);
    }

    if (!token) {
      token = request.cookies.get("authToken")?.value;
    }

    const authResult = await verifyFirebaseToken(token);

    if (!authResult || authResult.valid === false) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decodedToken = authResult.decodedToken || authResult;

    const db = await connectDb();
    const users = db.collection("users");

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 }
      );
    }

    const user = await users.findOne(
      { _id: objectId },
      { projection: { image: 1 } }
    );

    if (!user || !user.image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    const imageResponse = await fetch(user.image);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
