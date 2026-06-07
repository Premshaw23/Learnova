import { getWebhooksForEvent, logDelivery } from "@/db/webhookStore";
import { signPayload } from "./crypto";

const MAX_RETRIES = 3;
const DEAD_LETTER_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Helper to sleep for a given duration
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatch an event to all registered webhooks
 */
export async function dispatchEvent(event, data) {
  try {
    const webhooks = await getWebhooksForEvent(event);
    
    if (!webhooks || webhooks.length === 0) {
      return; // No webhooks registered for this event
    }

    const timestamp = new Date().toISOString();
    
    // Process all webhooks concurrently
    await Promise.all(
      webhooks.map((webhook) => deliverWithRetry(webhook, event, data, timestamp))
    );
  } catch (err) {
    console.error(`[Webhook Dispatcher] Error dispatching event ${event}:`, err);
  }
}

/**
 * Deliver a payload to a specific webhook with exponential backoff
 */
async function deliverWithRetry(webhook, event, data, timestamp) {
  const payload = {
    event,
    timestamp,
    data,
  };
  
  // Create signature using the secret
  const signature = signPayload(payload, webhook.secret);
  
  // Add signature to the payload for verification on the receiver end
  payload.signature = signature;
  
  const payloadString = JSON.stringify(payload);
  
  let attempt = 0;
  let status = "pending";
  let lastError = null;
  let responseData = null;
  
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-learnova-signature": signature,
          "x-learnova-event": event,
        },
        body: payloadString,
        // Short timeout for webhooks
        signal: AbortSignal.timeout(10000), 
      });

      if (response.ok) {
        status = "success";
        responseData = { status: response.status, statusText: response.statusText };
        break; // Success, break the retry loop
      } else {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (err) {
      attempt++;
      lastError = err.message;
      
      if (attempt <= MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s...
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`[Webhook Dispatcher] Delivery to ${webhook.url} failed. Retrying in ${backoffMs}ms (Attempt ${attempt}/${MAX_RETRIES}). Error: ${lastError}`);
        await sleep(backoffMs);
      }
    }
  }

  if (status !== "success") {
    // If it failed all retries, mark as dead-letter
    status = "dead-letter";
    console.error(`[Webhook Dispatcher] Delivery to ${webhook.url} failed permanently after ${MAX_RETRIES} retries.`);
  }

  // Log the final result
  await logDelivery(
    webhook.webhookId,
    event,
    webhook.url,
    status,
    payload,
    responseData,
    lastError
  );
}
