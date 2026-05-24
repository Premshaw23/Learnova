import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { connectDbForSSE } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const userStreams = new Map();
const streamListeners = new Map();
let connectionCount = 0;
let nextConnId = 0;
const MAX_CONNECTIONS = 50;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

let sharedStream = null;
let sharedDb = null;

async function getSharedStream() {
  if (sharedStream) return true;
  try {
    sharedDb = await connectDbForSSE();
    const coll = sharedDb.collection("notices");
    sharedStream = coll.watch([{ $match: { operationType: "insert" } }]);
    sharedStream.on("change", (change) => {
      const doc = change.fullDocument;
      if (!doc) return;
      for (const [, cbs] of streamListeners) {
        for (const cb of cbs) cb(doc);
      }
    });
    sharedStream.on("error", () => {
      sharedStream?.close().catch(() => {});
      sharedStream = null;
      sharedDb = null;
    });
    sharedStream.on("close", () => {
      sharedStream = null;
      sharedDb = null;
    });
    return true;
  } catch {
    return false;
  }
}

function addListener(userId, cb) {
  if (!streamListeners.has(userId)) {
    streamListeners.set(userId, new Set());
  }
  streamListeners.get(userId).add(cb);
}

function removeListener(userId, cb) {
  const cbs = streamListeners.get(userId);
  if (!cbs) return;
  cbs.delete(cb);
  if (cbs.size === 0) {
    streamListeners.delete(userId);
  }
  if (streamListeners.size === 0 && sharedStream) {
    sharedStream.close().catch(() => {});
    sharedStream = null;
    sharedDb = null;
  }
}

export async function GET(request) {
  try {
    const decodedToken = await authenticateRequest(request);
    const profile = await getUserProfile(decodedToken.uid);
    const userRole = profile?.role || "student";
    const userId = decodedToken.uid;

    if (connectionCount >= MAX_CONNECTIONS) {
      return new Response(JSON.stringify({ error: "Too many connections" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = userStreams.get(userId);
    if (existing) {
      existing.close();
    }

    const connId = nextConnId++;
    let isConnected = true;
    let heartbeatInterval;
    let pollInterval;
    let idleTimer;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event, data) => {
          if (!isConnected) return;
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const db = await connectDbForSSE();
        const noticesCollection = db.collection("notices");

        try {
          const initialNotices = await noticesCollection
            .find({ targetAudience: userRole })
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(50)
            .toArray();

          const formattedNotices = initialNotices.map(n => ({ ...n, id: n._id.toString() }));
          sendEvent("initial", formattedNotices);
        } catch (error) {
          console.error("Initial fetch error:", error);
          sendEvent("error", { message: "Failed to fetch initial notices" });
          return controller.close();
        }

        const entry = {
          id: connId,
          close() {
            isConnected = false;
            try { controller.close(); } catch {}
          },
        };

        userStreams.set(userId, entry);
        connectionCount++;

        const onNotice = (doc) => {
          if (!isConnected) return;
          if (doc.targetAudience && doc.targetAudience.includes(userRole)) {
            sendEvent("new-notice", { ...doc, id: doc._id.toString() });
          }
        };

        addListener(userId, onNotice);
        const hasStream = await getSharedStream();

        if (!hasStream) {
          let lastCheckTime = new Date();
          pollInterval = setInterval(async () => {
            if (!isConnected) return clearInterval(pollInterval);
            try {
              const newNotices = await noticesCollection
                .find({ targetAudience: userRole, createdAt: { $gt: lastCheckTime } })
                .toArray();

              if (newNotices.length > 0) {
                lastCheckTime = new Date();
                newNotices.forEach(notice => {
                  sendEvent("new-notice", { ...notice, id: notice._id.toString() });
                });
              }
            } catch (e) {
              console.error("Polling error:", e);
            }
          }, 10000);
        }

        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            if (!isConnected) return;
            isConnected = false;
            try { controller.close(); } catch {}
          }, IDLE_TIMEOUT_MS);
        };
        resetIdle();

        heartbeatInterval = setInterval(() => {
          sendEvent("ping", { time: new Date().toISOString() });
        }, 15000);

        request.signal.addEventListener("abort", () => {
          const current = userStreams.get(userId);
          if (current && current.id === connId) {
            userStreams.delete(userId);
            connectionCount = Math.max(0, connectionCount - 1);
          }
          isConnected = false;
          clearInterval(heartbeatInterval);
          if (pollInterval) clearInterval(pollInterval);
          if (idleTimer) clearTimeout(idleTimer);
          removeListener(userId, onNotice);
          try { controller.close(); } catch {}
        });
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
