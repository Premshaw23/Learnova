import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const authResult = await verifyFirebaseToken(token);

    if (!authResult || authResult.valid === false) {
      return jsonError("Unauthorized", 401);
    }

    const decodedToken = authResult.decodedToken || authResult;

    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10)
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );

    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get("search") || "";

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";

    const sortOrder =
      searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const db = await connectDb();
    const collection = db.collection("exceptions");

    // Base query
    const query = {
      status: "pending",
    };

    // Role-based filtering
    if (profile.role === "student") {
      query.studentEmail = decodedToken.email;
    } else if (
      profile.role !== "admin" &&
      profile.role !== "teacher"
    ) {
      return jsonError("Forbidden", 403);
    }

    // Search filter
    if (search) {
      query.$or = [
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

    return jsonSuccess({
      exceptions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
