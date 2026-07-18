import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";
import { encryptSecret, decryptSecret, hashSecret } from "@/lib/webhook/crypto";

const COLLECTION = "webhooks";
let indexesEnsured = false;

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await db.collection(COLLECTION).createIndex({ createdBy: 1 });
    await db.collection(COLLECTION).createIndex({ status: 1, events: 1 });
  } catch {}
}

export function serializeWebhook(doc) {
  if (!doc) return null;
  const { _id, secret, secretHash, ...rest } = doc;
  return { ...rest, _id: _id?.toString?.() || _id };
}

export async function createWebhook(data) {
  const db = await connectDb();
  await ensureIndexes(db);
  const now = new Date().toISOString();
  const doc = {
    webhookId: randomUUID(),
    url: data.url,
    encryptedSecret: encryptSecret(data.secret),
    secretHash: hashSecret(data.secret),
    events: data.events,
    status: data.status || "active",
    description: data.description || "",
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(COLLECTION).insertOne(doc);
  return serializeWebhook(doc);
}

export async function getWebhookById(webhookId) {
  const db = await connectDb();
  const doc = await db.collection(COLLECTION).findOne({ webhookId });
  return serializeWebhook(doc);
}

export async function getWebhookSecretForSigning(webhookId) {
  const db = await connectDb();
  const doc = await db.collection(COLLECTION).findOne({ webhookId });
  if (!doc || !doc.encryptedSecret) return null;
  try {
    return decryptSecret(doc.encryptedSecret);
  } catch {
    return null;
  }
}

export async function updateWebhook(webhookId, updates) {
  const db = await connectDb();
  const allowed = ["url", "events", "status", "description"];
  const setFields = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) setFields[key] = updates[key];
  }

  if (updates.secret !== undefined) {
    setFields.encryptedSecret = encryptSecret(updates.secret);
    setFields.secretHash = hashSecret(updates.secret);
  }

  setFields.updatedAt = new Date().toISOString();
  await db.collection(COLLECTION).updateOne({ webhookId }, { $set: setFields });
  return getWebhookById(webhookId);
}

export async function deleteWebhook(webhookId) {
  const db = await connectDb();
  await db.collection(COLLECTION).deleteOne({ webhookId });
}

export async function listWebhooks(filter = {}) {
  const db = await connectDb();
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.createdBy) query.createdBy = filter.createdBy;
  const docs = await db
    .collection(COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(serializeWebhook);
}

export async function getActiveWebhooksByEvent(eventType) {
  const db = await connectDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ status: "active", events: eventType })
    .toArray();
  return docs.map(serializeWebhook);
}
