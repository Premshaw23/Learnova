import { connectDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";

/**
 * Get all active webhooks for a specific event
 */
export async function getWebhooksForEvent(event) {
  const db = await connectDb();
  return db
    .collection("webhooks")
    .find({ events: event, isActive: true })
    .toArray();
}

/**
 * Log a webhook delivery attempt
 */
export async function logDelivery(webhookId, event, url, status, payload, response, error = null) {
  const db = await connectDb();
  
  const delivery = {
    deliveryId: randomUUID(),
    webhookId,
    event,
    url,
    status, // 'success', 'failed', 'pending', 'dead-letter'
    payload,
    response,
    error,
    timestamp: new Date(),
  };

  await db.collection("webhook_deliveries").insertOne(delivery);
  return delivery;
}

/**
 * Get all webhooks (admin only)
 */
export async function getAllWebhooks() {
  const db = await connectDb();
  return db.collection("webhooks").find().sort({ createdAt: -1 }).toArray();
}

/**
 * Create a new webhook
 */
export async function createWebhook(data) {
  const db = await connectDb();
  
  const webhook = {
    webhookId: randomUUID(),
    url: data.url,
    secret: data.secret || randomUUID(), // Used for signing
    events: data.events || [], // Array of event names
    isActive: true,
    description: data.description || "",
    createdAt: new Date(),
    createdBy: data.userId,
  };

  await db.collection("webhooks").insertOne(webhook);
  return webhook;
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(webhookId, updates) {
  const db = await connectDb();
  
  await db.collection("webhooks").updateOne(
    { webhookId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  
  return db.collection("webhooks").findOne({ webhookId });
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId) {
  const db = await connectDb();
  await db.collection("webhooks").deleteOne({ webhookId });
}

/**
 * Get delivery logs
 */
export async function getDeliveryLogs(limit = 100, skip = 0) {
  const db = await connectDb();
  return db
    .collection("webhook_deliveries")
    .find()
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}
