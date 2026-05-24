import { connectDb } from "@/lib/mongodb";

import {
  jsonSuccess,
  jsonError,
} from "@/lib/api-response";

import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { escapeRegex } from "@/utils/mongoUtils";

export const dynamic = "force-dynamic";

export const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW =
  60 * 1000;

const MAX_ATTEMPTS = 10;

export const GET = withErrorHandler(async (request) => {
    // Rate limiting
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-vercel-proxied-for") ||
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const attempts = rateLimitMap
      .get(ip)
      .filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

    attempts.push(now);
    rateLimitMap.set(ip, attempts);

    if (attempts.length > MAX_ATTEMPTS) {
      const { AppError } = require("@/lib/errors");
      throw new AppError("Too many attempts. Please try again later.", 429);
    }

    // Authentication and Role Verification
    await requireRole(request, ["admin", "teacher"]);

    // Search query — escape metacharacters to prevent ReDoS
    const { searchParams } =
      new URL(request.url);

    const rawSearch =
      searchParams.get("search") || "";

    const search =
      escapeRegex(rawSearch);

    const query = search
      ? {
          $or: [
            {
              name: {
                $regex:
                  search,

                $options:
                  "i",
              },
            },

            {
              email: {
                $regex:
                  search,

                $options:
                  "i",
              },
            },
          ],
        }
      : {};

    // Database
    const db =
      await connectDb();

    const users =
      db.collection("users");

    const allUsers =
      await users
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

    const sanitizedUsers =
      allUsers.map(
        ({
          image,
          ...rest
        }) => ({
          ...rest,
          hasImage:
            !!image,
        })
      );

    return jsonSuccess(
      sanitizedUsers,
      200
    );
});
