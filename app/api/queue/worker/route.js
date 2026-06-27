import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { claimNextJob, completeJob, failJob, JOB_TYPES } from "@/lib/queue";
import { awardXp } from "@/lib/gamification-service";
import logger from "@/utils/logger";

export const dynamic = "force-dynamic";

async function handleSendBulkEmails(payload) {
  const { emails } = payload;
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return { sent: 0 };
  }

  const hasEmailConfig =
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY;

  if (!hasEmailConfig) {
    logger.warn("[queue-worker] EmailJS not configured, skipping bulk emails");
    return { sent: 0, skipped: true };
  }

  let sent = 0;
  let failed = 0;

  for (const emailData of emails) {
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          template_params: emailData,
        }),
      });

      if (response.ok) {
        sent++;
      } else {
        failed++;
        logger.error("[queue-worker] Email send failed", {
          to: emailData.to_email,
          status: response.status,
        });
      }
    } catch (error) {
      failed++;
      logger.error("[queue-worker] Email send error", {
        to: emailData.to_email,
        error: error.message,
      });
    }
  }

  return { sent, failed, total: emails.length };
}

async function handleAwardGamificationXp(payload) {
  const { firebaseUid, actionType, metadata } = payload;
  const result = await awardXp(firebaseUid, actionType, metadata || {});
  return result;
}

const HANDLERS = {
  [JOB_TYPES.SEND_BULK_EMAILS]: handleSendBulkEmails,
  [JOB_TYPES.AWARD_GAMIFICATION_XP]: handleAwardGamificationXp,
};

export async function GET(request) {
  const cronAuth = authorizeCronRequest(request);
  if (!cronAuth.authorized) {
    return cronAuth.response;
  }

  const job = await claimNextJob();
  if (!job) {
    return NextResponse.json({ processed: false, reason: "no_pending_jobs" });
  }

  const handler = HANDLERS[job.type];
  if (!handler) {
    await failJob(job.id, `Unknown job type: ${job.type}`);
    return NextResponse.json({
      processed: true,
      jobId: job.id,
      status: "failed",
      error: `Unknown job type: ${job.type}`,
    });
  }

  try {
    const result = await handler(job.payload);
    await completeJob(job.id, result);

    logger.info("[queue-worker] Job completed", {
      jobId: job.id,
      type: job.type,
    });

    return NextResponse.json({
      processed: true,
      jobId: job.id,
      status: "completed",
      result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await failJob(job.id, errorMessage);

    logger.error("[queue-worker] Job failed", {
      jobId: job.id,
      type: job.type,
      error: errorMessage,
    });

    return NextResponse.json({
      processed: true,
      jobId: job.id,
      status: "failed",
      error: errorMessage,
    });
  }
}
