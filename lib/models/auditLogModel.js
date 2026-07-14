import { connectDb } from "@/lib/mongodb";

const COLLECTION = "audit_logs";
let indexesEnsured = false;

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await Promise.all([
      db.collection(COLLECTION).createIndex({ "actor.uid": 1, timestamp: -1 }),
      db.collection(COLLECTION).createIndex({ action: 1, timestamp: -1 }),
      db.collection(COLLECTION).createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 7776000 }
      ),
    ]);
  } catch {}
}

export function serializeAuditLog(doc) {
  if (!doc) return null;
  return { ...doc, _id: doc._id?.toString?.() || doc._id };
}

export async function insertAuditLog(data) {
  const db = await connectDb();
  await ensureIndexes(db);
  const doc = {
    actor: data.actor,
    action: data.action,
    target: data.target,
    details: data.details || {},
    ip: data.ip || null,
    userAgent: data.userAgent || null,
    success: data.success !== false,
    timestamp: new Date().toISOString(),
  };
  await db.collection(COLLECTION).insertOne(doc);
  return serializeAuditLog(doc);
}

export async function queryAuditLogs(filter = {}, { limit = 50, skip = 0 } = {}) {
  const db = await connectDb();
  const query = {};
  if (filter.actorUid) query["actor.uid"] = filter.actorUid;
  if (filter.action) query.action = filter.action;
  if (filter.targetType) query["target.type"] = filter.targetType;
  if (filter.startDate || filter.endDate) {
    query.timestamp = {};
    if (filter.startDate) query.timestamp.$gte = filter.startDate;
    if (filter.endDate) query.timestamp.$lte = filter.endDate;
  }
  const docs = await db
    .collection(COLLECTION)
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map(serializeAuditLog);
}
