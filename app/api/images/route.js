import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors";
export const GET = withErrorHandler(async (request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Missing user id parameter");
    }

    await requireAuth(request);

    const db = await connectDb();
    const users = db.collection("users");

    const { ObjectId } = require("mongodb");
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new ValidationError("Invalid user id");
    }

    const user = await users.findOne(
      { _id: objectId },
      { projection: { image: 1 } }
    );

    if (!user || !user.image) {
      throw new NotFoundError("Image not found");
    }

    const imageResponse = await fetch(user.image);
    if (!imageResponse.ok) {
      throw new AppError("Failed to fetch image", 502);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
});
