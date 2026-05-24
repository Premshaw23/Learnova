import { connectDb } from "./mongodb";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

let indexEnsured = false;

async function ensureIndexes(collection) {
  if (indexEnsured) return;
  await collection.createIndex({ userId: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexEnsured = true;
}

export async function checkRateLimit(userId) {
  try {
    const db = await connectDb();
    if (!db || typeof db.collection !== "function") {
      console.error("[rate-limit] MongoDB unavailable (null db), failing closed");
      return { allowed: false, remaining: 0 };
    }
    const collection = db.collection("rate_limits");

    await ensureIndexes(collection);

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    const result = await collection.findOneAndUpdate(
      { userId },
      {
        $push: {
          requests: {
            $each: [now],
            $slice: -(MAX_REQUESTS_PER_WINDOW + 1),
          },
        },
        $set: {
          expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2),
        },
        $setOnInsert: { userId },
      },
      { upsert: true, returnDocument: "after" }
    );

    const recentRequests = (result?.requests ?? []).filter(
      (t) => new Date(t) >= windowStart
    );

    if (recentRequests.length > MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length,
    };
  } catch (err) {
    console.error("[rate-limit] MongoDB rate limiting failed, failing closed:", err.message);
    return { allowed: false, remaining: 0 };
  }
}
