import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";

const COLLECTION = "webhook_deliveries";
let indexesEnsured = false;

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await db
      .collection(COLLECTION)
      .createIndex({ webhookId: 1, createdAt: -1 });
    await db.collection(COLLECTION).createIndex({ status: 1 });
    await db
      .collection(COLLECTION)
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });
  } catch {}
}

export function serializeDelivery(doc) {
  if (!doc) return null;
  return { ...doc, _id: doc._id?.toString?.() || doc._id };
}

export async function createDeliveryLog(data) {
  const db = await connectDb();
  await ensureIndexes(db);
  const doc = {
    deliveryId: randomUUID(),
    webhookId: data.webhookId,
    eventType: data.eventType,
    url: data.url,
    status: data.status || "pending",
    statusCode: data.statusCode || null,
    responseBody: data.responseBody || null,
    error: data.error || null,
    attempts: data.attempts || 0,
    createdAt: new Date().toISOString(),
  };
  await db.collection(COLLECTION).insertOne(doc);
  return serializeDelivery(doc);
}

export async function updateDeliveryLog(deliveryId, updates) {
  const db = await connectDb();
  await db
    .collection(COLLECTION)
    .updateOne({ deliveryId }, { $set: updates });
}

export async function listDeliveries(filter = {}, { limit = 50, skip = 0 } = {}) {
  const db = await connectDb();
  const query = {};
  if (filter.webhookId) query.webhookId = filter.webhookId;
  if (filter.status) query.status = filter.status;
  const docs = await db
    .collection(COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map(serializeDelivery);
}
