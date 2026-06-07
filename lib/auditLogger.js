import { connectDb } from "@/lib/mongodb";
import logger from "@/utils/logger";

export async function logAudit({ req, actor, action, target, details, success = true }) {
  try {
    const db = await connectDb();
    
    // Extract IP and User-Agent, handling both Next.js standard req objects and edge cases
    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    
    if (req) {
      if (typeof req.headers?.get === 'function') {
        ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        userAgent = req.headers.get('user-agent') || 'unknown';
      } else if (req.headers) {
        ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
        userAgent = req.headers['user-agent'] || 'unknown';
      }
    }

    await db.collection("audit_logs").insertOne({
      actor: {
        uid: actor?.uid,
        email: actor?.email,
        role: actor?.role
      },
      action,
      target: target ? {
        type: target.type,
        id: target.id
      } : null,
      details: details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success
    });
  } catch (error) {
    if (logger?.error) {
      logger.error('Failed to write audit log:', { error: error.message, action });
    } else {
      console.error('Failed to write audit log:', error);
    }
  }
}
