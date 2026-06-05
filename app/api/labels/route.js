import { connectDb } from "@/lib/mongodb";
import { AppError } from "@/lib/errors";
import { jsonSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { escapeRegex } from "@/utils/mongoUtils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-proxied-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const rateLimitResult = await checkRateLimit(`labels_${ip}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  // Authentication and Role Verification
  const { profile } = await requireRole(request, [
    "admin",
    "teacher",
    "student",
  ]);

  // Search query — escape metacharacters to prevent ReDoS
  const { searchParams } = new URL(request.url);
  const rawSearch = searchParams.get("search") || "";
  const search = escapeRegex(rawSearch);

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  if (profile.role !== "admin") {
    if (profile.instituteId) {
      query.instituteId = profile.instituteId;
    } else {
      // If a non-admin (like a student) doesn't have an instituteId,
      // they shouldn't be able to search other users globally.
      query.instituteId = "unassigned_no_match";
    }
  }

  // Database — faceDescriptor is excluded from the projection.
  // Biometric embeddings are sensitive personal data and must not be
  // returned to arbitrary authenticated callers.
  const db = await connectDb();
  const users = db.collection("users");

  const allUsers = await users
    .find(query, {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
      },
    })
    .limit(50)
    .toArray();

  const showImageFlag = profile.role !== "student";
  const sanitizedUsers = allUsers.map(({ image, ...rest }) => ({
    ...rest,
    ...(showImageFlag ? { hasImage: !!image } : {}),
  }));

  return jsonSuccess(sanitizedUsers, 200);
});
