import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { connectDbForSSE } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const MAX_PER_USER = 3;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15000;
const POLL_INTERVAL_MS = 10000;
const NOTICE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// ── Redis Client ─────────────────────────────────────────────────────────────
let redisClient;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

// ── Redis Keys ───────────────────────────────────────────────────────────────
const redisKeys = {
  connectionCount: (userId) => `sse:conn:${userId}`,
  recentNotices: () => "sse:notices:recent",
};

// ── In-memory connection fallback (used when Redis is unavailable) ────────────
// Entries carry a TTL so abnormally terminated connections (serverless timeout,
// browser crash, process kill) self-heal instead of permanently blocking slots.
const MEMORY_CONNECTION_TTL_MS = 5 * 60 * 1000;
const memoryConnections = new Map();

function getMemoryConnectionCount(userId) {
  const entry = memoryConnections.get(userId);
  if (!entry) return 0;
  if (Date.now() > entry.expiresAt) {
    memoryConnections.delete(userId);
    return 0;
  }
  return entry.count;
}

function incrementMemoryConnection(userId) {
  const count = getMemoryConnectionCount(userId) + 1;
  memoryConnections.set(userId, {
    count,
    expiresAt: Date.now() + MEMORY_CONNECTION_TTL_MS,
  });
  return count;
}

function decrementMemoryConnection(userId) {
  const count = Math.max(0, getMemoryConnectionCount(userId) - 1);
  if (count === 0) {
    memoryConnections.delete(userId);
  } else {
    memoryConnections.set(userId, {
      count,
      expiresAt: Date.now() + MEMORY_CONNECTION_TTL_MS,
    });
  }
  return count;
}

// Periodic eviction of stale entries — same pattern as lib/rateLimit.js
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of memoryConnections.entries()) {
    if (now > entry.expiresAt) {
      memoryConnections.delete(userId);
    }
  }
}, 60 * 1000).unref();

// ── Connection Registry (Redis-backed with in-memory fallback) ────────────────
async function registerConnection(userId) {
  const redis = getRedis();
  if (!redis) {
    // Fallback: use in-memory connection tracking with the same limit
    const count = incrementMemoryConnection(userId);
    if (count > MAX_PER_USER) {
      decrementMemoryConnection(userId);
      return { connId: null, allowed: false };
    }
    const connId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    return { connId, allowed: true };
  }

  const key = redisKeys.connectionCount(userId);
  const count = await redis.incr(key);
  await redis.expire(key, Math.ceil(IDLE_TIMEOUT_MS / 1000));

  if (count > MAX_PER_USER) {
    await redis.decr(key);
    return { connId: null, allowed: false };
  }

  const connId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  return { connId, allowed: true };
}

async function unregisterConnection(userId) {
  const redis = getRedis();
  if (!redis) {
    decrementMemoryConnection(userId);
    return;
  }
  const key = redisKeys.connectionCount(userId);
  const newCount = await redis.decr(key);
  if (newCount < 0) {
    await redis.set(key, 0, { ex: Math.ceil(IDLE_TIMEOUT_MS / 1000) });
  }
}

// ── Notice Publishing (Redis-backed) ─────────────────────────────────────────
export async function publishNoticeToRedis(doc) {
  const redis = getRedis();
  if (!redis) return;
  const key = redisKeys.recentNotices();
  const score = Date.now();
  const member = JSON.stringify({
    ...doc,
    _id: doc._id?.toString?.() || doc.id,
    id: doc._id?.toString?.() || doc.id,
  });
  await redis.zadd(key, { score, member });
  await redis.expire(key, NOTICE_TTL_SECONDS);
}

// ── Request Handler ──────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const decodedToken = await authenticateRequest(request);
    const profile = await getUserProfile(decodedToken.uid);
    const userRole = profile?.role || "student";
    const userId = decodedToken.uid;
    const instituteId =
      profile?.instituteId || profile?.uid || decodedToken.uid;

    if (!instituteId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Missing institute configuration.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(
      `notices_stream_${ip}_${userId}`
    );
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many connections. Please slow down." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let isConnected = true;
    let heartbeatTimer;
    let idleTimer;
    let pollInterval;
    let connId;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event, data) => {
          if (!isConnected) return;
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          } catch {
            cleanup();
          }
        };

        const cleanup = async () => {
          if (!isConnected) return;
          isConnected = false;
          clearInterval(heartbeatTimer);
          clearInterval(pollInterval);
          if (idleTimer) clearTimeout(idleTimer);
          if (connId) {
            await unregisterConnection(userId);
            connId = null;
          }
          try {
            controller.close();
          } catch {}
        };

        const { connId: newConnId, allowed } = await registerConnection(userId);
        connId = newConnId;
        if (!allowed) {
          sendEvent("error", {
            message: "Too many connections. Close other tabs and try again.",
          });
          await cleanup();
          return;
        }

        request.signal.addEventListener("abort", () => cleanup());

        // Fetch initial notices from MongoDB
        let lastNoticeTime = new Date();
        let lastNoticeId = null;
        try {
          const db = await connectDbForSSE();
          const noticesCollection = db.collection("notices");
          const initialNotices = await noticesCollection
            .find({
              targetAudience: userRole,
              instituteId: instituteId,
            })
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(50)
            .toArray();
          const formattedNotices = initialNotices.map((n) => ({
            ...n,
            id: n._id.toString(),
          }));
          sendEvent("initial", formattedNotices);
          if (initialNotices.length > 0) {
            const newest = initialNotices.reduce((latest, n) => {
              const t = n.createdAt;
              return t && t > latest.createdAt ? n : latest;
            }, initialNotices[0]);
            lastNoticeTime = newest.createdAt || new Date();
            lastNoticeId = newest._id?.toString() || newest.id || null;
          }
        } catch (err) {
          console.error("Initial fetch error:", err);
          sendEvent("error", { message: "Failed to fetch initial notices" });
          await cleanup();
          return;
        }

        // Poll for new notices from Redis (fallback to MongoDB when Redis is unavailable)
        const pollForNotices = async () => {
          if (!isConnected) return;
          try {
            const redis = getRedis();
            if (redis) {
              const key = redisKeys.recentNotices();
              const lastScore = lastNoticeTime.getTime();
              const members = await redis.zrange(key, lastScore, "+inf", {
                byScore: true,
                rev: false,
              });
              for (const member of members) {
                if (!isConnected) break;
                try {
                  const doc =
                    typeof member === "string" ? JSON.parse(member) : member;
                  const docId = doc._id || doc.id;
                  const memberTime = new Date(doc.createdAt).getTime();
                  // Skip the notice that was the last processed watermark (deterministic tie-breaker)
                  if (
                    memberTime === lastNoticeTime.getTime() &&
                    docId === lastNoticeId
                  ) {
                    continue;
                  }
                  const docAudience = Array.isArray(doc.targetAudience)
                    ? doc.targetAudience
                    : typeof doc.targetAudience === "string"
                      ? [doc.targetAudience]
                      : [];
                  if (
                    docAudience.includes(userRole) &&
                    doc.instituteId &&
                    String(doc.instituteId) === String(instituteId)
                  ) {
                    sendEvent("new-notice", {
                      ...doc,
                      id: docId,
                    });
                  }
                  if (memberTime > lastNoticeTime.getTime()) {
                    lastNoticeTime = new Date(doc.createdAt);
                    lastNoticeId = docId;
                  } else if (
                    memberTime === lastNoticeTime.getTime() &&
                    docId !== lastNoticeId
                  ) {
                    lastNoticeId = docId;
                  }
                } catch {}
              }
            } else {
              // Fallback: poll MongoDB directly
              const db = await connectDbForSSE();
              const noticesCollection = db.collection("notices");
              const newNotices = await noticesCollection
                .find({
                  targetAudience: userRole,
                  instituteId: instituteId,
                  createdAt: { $gt: lastNoticeTime },
                })
                .sort({ createdAt: -1 })
                .limit(20)
                .toArray();
              for (const doc of newNotices) {
                if (!isConnected) break;
                sendEvent("new-notice", {
                  ...doc,
                  id: doc._id.toString(),
                });
                const docTime = new Date(doc.createdAt).getTime();
                if (docTime > lastNoticeTime.getTime()) {
                  lastNoticeTime = new Date(doc.createdAt);
                }
              }
            }
          } catch {}
        };

        pollInterval = setInterval(pollForNotices, POLL_INTERVAL_MS);

        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => cleanup(), IDLE_TIMEOUT_MS);
        };
        resetIdle();

        heartbeatTimer = setInterval(() => {
          sendEvent("ping", { time: new Date().toISOString() });
          resetIdle();
        }, HEARTBEAT_INTERVAL_MS);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE stream auth error:", error);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
