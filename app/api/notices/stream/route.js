import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { connectDbForSSE } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_PER_USER = 3;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15000;
const POLL_INTERVAL_MS = 10000;
const STREAM_RECONNECT_BASE_MS = 1000;
const STREAM_RECONNECT_MAX_MS = 30000;

// ── Connection Registry ────────────────────────────────────────────────────────
const connections = new Map();
const userConnectionCount = new Map();
let nextConnId = 1;

function registerConnection(userId) {
  const current = userConnectionCount.get(userId) || 0;
  if (current >= MAX_PER_USER) return null;
  const connId = nextConnId++;
  connections.set(connId, userId);
  userConnectionCount.set(userId, current + 1);
  return connId;
}

function unregisterConnection(connId) {
  const userId = connections.get(connId);
  if (!userId) return;
  connections.delete(connId);
  const count = userConnectionCount.get(userId) || 0;
  if (count <= 1) {
    userConnectionCount.delete(userId);
  } else {
    userConnectionCount.set(userId, count - 1);
  }
}

// ── Shared Notice Listener Bus ─────────────────────────────────────────────────
const noticeListeners = new Map();

function addNoticeListener(userId, cb) {
  if (!noticeListeners.has(userId)) {
    noticeListeners.set(userId, new Set());
  }
  noticeListeners.get(userId).add(cb);
}

function removeNoticeListener(userId, cb) {
  const cbs = noticeListeners.get(userId);
  if (!cbs) return;
  cbs.delete(cb);
  if (cbs.size === 0) noticeListeners.delete(userId);
}

function broadcastNotice(doc) {
  for (const [, cbs] of noticeListeners) {
    for (const cb of cbs) cb(doc);
  }
}

// ── MongoDB Change Stream (single per process, auto-reconnect) ─────────────────
let sharedStream = null;
let sharedDb = null;
let streamReconnectTimer = null;
let streamReconnectRetryCount = 0;
let streamGeneration = 0;

async function startChangeStream() {
  stopChangeStream();
  const gen = ++streamGeneration;
  try {
    sharedDb = await connectDbForSSE();
    const coll = sharedDb.collection("notices");
    sharedStream = coll.watch([{ $match: { operationType: "insert" } }]);
    sharedStream.on("change", (change) => {
      const doc = change.fullDocument;
      if (doc) broadcastNotice(doc);
    });
    sharedStream.on("error", () => {
      if (streamGeneration !== gen) return;
      scheduleChangeStreamReconnect();
    });
    sharedStream.on("close", () => {
      if (streamGeneration !== gen) return;
      scheduleChangeStreamReconnect();
    });
    streamReconnectRetryCount = 0;
  } catch {
    if (streamGeneration === gen) {
      scheduleChangeStreamReconnect();
    }
  }
}

function stopChangeStream() {
  streamGeneration++;
  if (streamReconnectTimer) {
    clearTimeout(streamReconnectTimer);
    streamReconnectTimer = null;
  }
  if (sharedStream) {
    try { sharedStream.close(); } catch {}
    sharedStream = null;
  }
  sharedDb = null;
}

function scheduleChangeStreamReconnect() {
  const delay = Math.min(
    STREAM_RECONNECT_BASE_MS * Math.pow(2, streamReconnectRetryCount),
    STREAM_RECONNECT_MAX_MS
  );
  streamReconnectRetryCount++;
  streamReconnectTimer = setTimeout(() => {
    streamReconnectTimer = null;
    startChangeStream();
  }, delay);
}

// ── Shared Polling Fallback ────────────────────────────────────────────────────
let pollingInterval = null;
let pollingLastCheck = new Date();

function startPollingIfNeeded() {
  if (pollingInterval || noticeListeners.size === 0) return;
  pollingInterval = setInterval(async () => {
    if (noticeListeners.size === 0) {
      stopPolling();
      return;
    }
    try {
      if (!sharedDb) sharedDb = await connectDbForSSE();
      const newNotices = await sharedDb
        .collection("notices")
        .find({ createdAt: { $gt: pollingLastCheck } })
        .toArray();
      if (newNotices.length > 0) {
        pollingLastCheck = new Date();
        newNotices.forEach((n) => broadcastNotice(n));
      }
    } catch {}
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// ── Request Handler ────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const decodedToken = await authenticateRequest(request);
    const profile = await getUserProfile(decodedToken.uid);
    const userRole = profile?.role || "student";
    const userId = decodedToken.uid;
    const instituteId = profile?.instituteId || null;

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(`notices_stream_${ip}_${userId}`);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many connections. Please slow down." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    let isConnected = true;
    let heartbeatTimer;
    let idleTimer;
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

        const cleanup = () => {
          if (!isConnected) return;
          isConnected = false;
          clearInterval(heartbeatTimer);
          if (idleTimer) clearTimeout(idleTimer);
          if (connId) {
            unregisterConnection(connId);
            connId = null;
          }
          removeNoticeListener(userId, onNotice);
          if (noticeListeners.size === 0) {
            stopChangeStream();
            stopPolling();
          }
          try { controller.close(); } catch {}
        };

        connId = registerConnection(userId);
        if (connId === null) {
          sendEvent("error", {
            message:
              "Too many connections. Close other tabs and try again.",
          });
          cleanup();
          return;
        }

        request.signal.addEventListener("abort", cleanup);

        const db = await connectDbForSSE();
        const noticesCollection = db.collection("notices");

        try {
          const initialNotices = await noticesCollection
            .find({ 
              targetAudience: userRole,
              instituteId: instituteId 
            })
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(50)
            .toArray();
          const formattedNotices = initialNotices.map((n) => ({
            ...n,
            id: n._id.toString(),
          }));
          sendEvent("initial", formattedNotices);
        } catch (err) {
          console.error("Initial fetch error:", err);
          sendEvent("error", { message: "Failed to fetch initial notices" });
          cleanup();
          return;
        }

        const onNotice = (doc) => {
          if (!isConnected) return;
          if (
            doc.targetAudience &&
            doc.targetAudience.includes(userRole) &&
            String(doc.instituteId) === String(instituteId)
          ) {
            sendEvent("new-notice", {
              ...doc,
              id: doc._id.toString(),
            });
          }
        };

        addNoticeListener(userId, onNotice);

        if (!sharedStream) {
          startChangeStream();
        }
        startPollingIfNeeded();

        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => cleanup(), IDLE_TIMEOUT_MS);
        };
        resetIdle();

        heartbeatTimer = setInterval(() => {
          sendEvent("ping", { time: new Date().toISOString() });
        }, HEARTBEAT_INTERVAL_MS);

      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
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
