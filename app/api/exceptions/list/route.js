import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Search params
    const search = searchParams.get("search") || "";

    // Sorting params
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Validation
    if (page < 1 || limit < 1) {
      return jsonError(
        "Page and limit must be greater than 0",
        400
      );
    }

    const skip = (page - 1) * limit;

    const db = await connectDb();
    const collection = db.collection("exceptions");

    // Base query
    let query = {
      status: "pending",
    };

    // Student restriction
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

    // Fetch paginated data
    const exceptions = await collection
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit);

    return jsonSuccess(
      {
        exceptions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
        },
      },
      200
    );
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
