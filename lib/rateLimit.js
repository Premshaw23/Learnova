import { connectDb } from "./mongodb";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

let cleanupInterval = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(async () => {
    try {
      const db = await connectDb();
      await db.collection("rate_limits").deleteMany({
        expiresAt: { $lt: new Date() },
      });
    } catch (err) {
      console.error("[rate-limit-cleanup] Failed to clean up expired entries:", err.message);
    }
  }, 5 * 60 * 1000);

  cleanupInterval.unref();
}

export async function checkRateLimit(userId) {
  try {
    const db = await connectDb();
    const collection = db.collection("rate_limits");

    startCleanup();

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    const record = await collection.findOne({ userId });

    if (!record) {
      await collection.insertOne({
        userId,
        requests: [now],
        expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2),
      });
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    const recentRequests = record.requests.filter((t) => new Date(t) >= windowStart);

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      await collection.updateOne(
        { userId },
        { $set: { requests: recentRequests, expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2) } }
      );
      return { allowed: false, remaining: 0 };
    }

    recentRequests.push(now);

    await collection.updateOne(
      { userId },
      { $set: { requests: recentRequests, expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2) } }
    );

    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length };
  } catch (err) {
    console.error("[rate-limit] MongoDB error, falling back to allow:", err.message);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }
}
