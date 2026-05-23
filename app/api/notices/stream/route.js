import { authenticateRequest } from "@/lib/error-handler";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Authenticate and establish tenant/role context BEFORE opening stream
    const decodedToken = await authenticateRequest(request);
    const userRole = decodedToken.role || "student";
    
    let isConnected = true;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event, data) => {
          if (!isConnected) return;
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const db = await connectDb();
        const noticesCollection = db.collection("notices");

        // 1. Send initial batch of notices instantly
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

        let changeStream;
        let pollInterval;

        function startPollingFallback() {
          let lastCheckTime = new Date();
          pollInterval = setInterval(async () => {
             if (!isConnected) return clearInterval(pollInterval);
             try {
                const newNotices = await noticesCollection
                  .find({ 
                    targetAudience: userRole, 
                    createdAt: { $gt: lastCheckTime } 
                  })
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
          }, 10000); // 10s fallback polling internally
        }

        // 2. Setup Realtime Broadcast
        try {
          // Attempt MongoDB Change Stream (Only works on Replica Sets)
          changeStream = noticesCollection.watch([
            { $match: { operationType: "insert" } }
          ]);

          changeStream.on("change", (change) => {
             if (!isConnected) return;
             const notice = change.fullDocument;
             
             // Strict Multi-Tenant Enforcement: only send if user is in target audience
             if (notice.targetAudience && notice.targetAudience.includes(userRole)) {
               const formatted = { ...notice, id: notice._id.toString() };
               sendEvent("new-notice", formatted);
             }
          });

          changeStream.on("error", (error) => {
             console.error("Change stream error, falling back to polling:", error.message);
             if (changeStream) changeStream.close().catch(() => {});
             startPollingFallback();
          });
        } catch (error) {
          console.warn("Change Stream not supported. Falling back to internal polling.");
          startPollingFallback();
        }

        // 3. Keep-alive Heartbeat to prevent premature proxy termination
        const heartbeatInterval = setInterval(() => {
          sendEvent("ping", { time: new Date().toISOString() });
        }, 15000);

        // 4. Clean up completely on disconnect
        request.signal.addEventListener("abort", () => {
           isConnected = false;
           clearInterval(heartbeatInterval);
           if (pollInterval) clearInterval(pollInterval);
           if (changeStream) changeStream.close().catch(() => {});
           try { controller.close(); } catch (e) {}
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no" // Disables Nginx buffering on platforms like Vercel
      }
    });

  } catch (error) {
    console.error("SSE stream auth error:", error);
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
