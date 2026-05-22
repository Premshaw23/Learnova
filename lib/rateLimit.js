import { connectDb } from "./mongodb";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

let cleanupInterval = null;
const fallbackRateLimitMap = new Map();

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

  if (cleanupInterval && typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }
}

export async function checkRateLimit(userId) {
  if (!process.env.MONGODB_URI) {
    const now = Date.now();
    if (!fallbackRateLimitMap.has(userId)) {
      fallbackRateLimitMap.set(userId, [now]);
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    const timestamps = fallbackRateLimitMap.get(userId);
    const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      fallbackRateLimitMap.set(userId, validTimestamps);
      return { allowed: false, remaining: 0 };
    }

    validTimestamps.push(now);
    fallbackRateLimitMap.set(userId, validTimestamps);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length };
  }

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
        timestamps: [now],
        expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2),
      });
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    const requests = record.requests || record.timestamps || [];
    const recentRequests = requests.filter((t) => new Date(t) >= windowStart);

    const updateDoc = {
      expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2),
    };

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      if (record.timestamps || !record.requests) {
        updateDoc.timestamps = recentRequests;
      }
      if (record.requests || !record.timestamps) {
        updateDoc.requests = recentRequests;
      }
      await collection.updateOne(
        { userId },
        { $set: updateDoc }
      );
      return { allowed: false, remaining: 0 };
    }

    recentRequests.push(now);

    if (record.timestamps || !record.requests) {
      updateDoc.timestamps = recentRequests;
    }
    if (record.requests || !record.timestamps) {
      updateDoc.requests = recentRequests;
    }

    await collection.updateOne(
      { userId },
      { $set: updateDoc }
    );

    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length };
  } catch (err) {
    console.error("[rate-limit] MongoDB error, falling back to allow:", err.message);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }
}
