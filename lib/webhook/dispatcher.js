import {
  getActiveWebhooksByEvent,
  getWebhookSecretForSigning,
} from "@/lib/models/webhookModel";
import {
  createDeliveryLog,
  updateDeliveryLog,
} from "@/lib/models/webhookDeliveryModel";
import { signPayload } from "@/lib/webhook/signer";
import { validateWebhookUrl } from "@/lib/webhook/urlValidator";

async function sendWithRetry(url, payload, signature, webhookId, eventType, deliveryId) {
  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": eventType,
          "User-Agent": "Learnova-Webhook/1.0",
        },
        body: JSON.stringify({ ...payload, signature }),
        signal: AbortSignal.timeout(10000),
      });

      await updateDeliveryLog(deliveryId, {
        status: response.ok ? "delivered" : "failed",
        statusCode: response.status,
        responseBody: await response.text().catch(() => null),
        attempts: attempt,
      });

      if (response.ok) return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  await updateDeliveryLog(deliveryId, {
    status: "dead",
    error: lastError?.message || "Max retries exceeded",
    attempts: MAX_RETRIES,
  });
}

export async function emitWebhookEvent(eventType, data) {
  try {
    const webhooks = await getActiveWebhooksByEvent(eventType);
    if (webhooks.length === 0) return;

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const webhook of webhooks) {
      const signingSecret = await getWebhookSecretForSigning(webhook.webhookId);
      if (!signingSecret) {
        console.error(`[webhook] Failed to decrypt secret for webhook ${webhook.webhookId}, skipping`);
        continue;
      }

      const urlValidation = await validateWebhookUrl(webhook.url);
      if (!urlValidation.valid) {
        console.error(`[webhook] URL validation failed for webhook ${webhook.webhookId}: ${urlValidation.reason}`);
        await createDeliveryLog({
          webhookId: webhook.webhookId,
          eventType,
          url: webhook.url,
          status: "failed",
          attempts: 0,
          error: `URL validation failed: ${urlValidation.reason}`,
        });
        continue;
      }

      const signature = signPayload(payload, signingSecret);
      const deliveryLog = await createDeliveryLog({
        webhookId: webhook.webhookId,
        eventType,
        url: webhook.url,
        status: "pending",
        attempts: 0,
      });

      sendWithRetry(
        webhook.url,
        payload,
        signature,
        webhook.webhookId,
        eventType,
        deliveryLog.deliveryId,
      );
    }
  } catch (error) {
    console.error("[webhook] Failed to emit event:", error);
  }
}
