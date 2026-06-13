import { authenticateRequest } from "@/lib/error-handler";
import { pollEvents } from "@/lib/ssePublisher";
import { connectDbForSSE } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL_MS = 15000;
const POLL_INTERVAL_MS = 8000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get("token");
    if (queryToken) {
      const headers = new Headers(request.headers);
      headers.set("authorization", `Bearer ${queryToken}`);
      request = new Request(request.url, { headers });
    }
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(`events_stream_${ip}_${userId}`);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Too many connections. Please slow down." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    let isConnected = true;
    let heartbeatTimer;
    let idleTimer;
    let pollInterval;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event, data) => {
          if (!isConnected) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            cleanup();
          }
        };

        const cleanup = () => {
          if (!isConnected) return;
          isConnected = false;
          clearInterval(heartbeatTimer);
          clearInterval(pollInterval);
          if (idleTimer) clearTimeout(idleTimer);
          try { controller.close(); } catch {}
        };

        request.signal.addEventListener("abort", () => cleanup());

        let lastEventTime = new Date();

        const pollForEvents = async () => {
          if (!isConnected) return;
          try {
            const notifications = await pollEvents("notifications", lastEventTime);
            for (const doc of notifications) {
              if (!isConnected) break;
              if (doc.payload?.recipientId && String(doc.payload.recipientId) === String(userId)) {
                sendEvent("notification", doc.payload);
              } else if (!doc.payload?.recipientId) {
                sendEvent("notification", doc.payload);
              }
              const ts = doc._timestamp || new Date(doc.payload?.createdAt).getTime();
              if (ts > lastEventTime.getTime()) {
                lastEventTime = new Date(ts);
              }
            }

            const attendance = await pollEvents("attendance", lastEventTime);
            for (const doc of attendance) {
              if (!isConnected) break;
              sendEvent("attendance", doc.payload);
              const ts = doc._timestamp || new Date(doc.payload?.timestamp).getTime();
              if (ts > lastEventTime.getTime()) {
                lastEventTime = new Date(ts);
              }
            }
          } catch {}
        };

        pollInterval = setInterval(pollForEvents, POLL_INTERVAL_MS);

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
    console.error("SSE events stream auth error:", error);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
