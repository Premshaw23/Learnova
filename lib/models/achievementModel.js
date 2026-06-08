import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";

const COLLECTION = "achievements";
let indexesEnsured = false;

async function ensureAchievementIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const col = db.collection(COLLECTION);
    await Promise.all([
      col.createIndex({ achievementId: 1 }, { unique: true, background: true }),
      col.createIndex({ studentId: 1, achievementDate: -1 }, { background: true }),
      col.createIndex({ instituteId: 1, achievementDate: -1 }, { background: true }),
      col.createIndex({ verificationStatus: 1 }, { background: true }),
      col.createIndex({ category: 1 }, { background: true }),
    ]);
  } catch {
    // best-effort
  }
}

export function serializeAchievement(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id?.toString?.() || doc._id,
  };
}

export function buildAchievementFilter({
  studentId,
  instituteId,
  category,
  verificationStatus,
  search,
  from,
  to,
} = {}) {
  const filter = {};

  if (studentId) filter.studentId = studentId;
  if (instituteId) filter.instituteId = instituteId;
  if (category) filter.category = category;
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  if (from || to) {
    filter.achievementDate = {};
    if (from) filter.achievementDate.$gte = from;
    if (to) filter.achievementDate.$lte = to;
  }

  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };
    filter.$or = [{ title: regex }, { studentName: regex }];
  }

  return filter;
}

export async function createAchievement(data) {
  const db = await connectDb();
  await ensureAchievementIndexes(db);

  const now = new Date().toISOString();
  const doc = {
    achievementId: randomUUID(),
    studentId: data.studentId,
    studentName: data.studentName,
    instituteId: data.instituteId || null,
    title: data.title,
    description: data.description,
    category: data.category,
    certificateUrl: data.certificateUrl || null,
    achievementDate: data.achievementDate,
    issuedBy: data.issuedBy,
    verificationStatus: "Pending",
    verifiedBy: null,
    remarks: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return serializeAchievement({ ...doc, _id: result.insertedId });
}

export async function getAchievementById(achievementId) {
  const db = await connectDb();
  const doc = await db.collection(COLLECTION).findOne({ achievementId });
  return serializeAchievement(doc);
}

export async function updateAchievement(achievementId, updates) {
  const db = await connectDb();
  const now = new Date().toISOString();
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { achievementId },
    { $set: { ...updates, updatedAt: now } },
    { returnDocument: "after" }
  );
  return serializeAchievement(result);
}

export async function deleteAchievement(achievementId) {
  const db = await connectDb();
  const result = await db.collection(COLLECTION).deleteOne({ achievementId });
  return result.deletedCount > 0;
}

export async function listAchievements(filter = {}, { limit = 100, skip = 0 } = {}) {
  const db = await connectDb();
  await ensureAchievementIndexes(db);

  const docs = await db
    .collection(COLLECTION)
    .find(filter)
    .sort({ achievementDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return docs.map(serializeAchievement);
}

export async function countAchievements(filter = {}) {
  const db = await connectDb();
  return db.collection(COLLECTION).countDocuments(filter);
}

export async function getAchievementAnalytics(filter = {}) {
  const db = await connectDb();
  await ensureAchievementIndexes(db);
  const col = db.collection(COLLECTION);

  const [total, byStatus, byCategory, monthlyTrend, topPerformers] =
    await Promise.all([
      col.countDocuments(filter),
      col
        .aggregate([
          { $match: filter },
          { $group: { _id: "$verificationStatus", count: { $sum: 1 } } },
        ])
        .toArray(),
      col
        .aggregate([
          { $match: filter },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ])
        .toArray(),
      col
        .aggregate([
          { $match: filter },
          {
            $group: {
              _id: { $substr: ["$achievementDate", 0, 7] },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      col
        .aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$studentId",
              studentName: { $first: "$studentName" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ]);

  const verificationStats = {
    Pending: 0,
    Verified: 0,
    Rejected: 0,
  };
  for (const row of byStatus) {
    if (row._id && verificationStats[row._id] !== undefined) {
      verificationStats[row._id] = row.count;
    }
  }

  const categoryDistribution = byCategory.map((row) => ({
    category: row._id || "Other",
    count: row.count,
  }));

  const growthTrend = monthlyTrend.map((row) => ({
    month: row._id || "Unknown",
    count: row.count,
  }));

  const topStudents = topPerformers.map((row) => ({
    studentId: row._id,
    studentName: row.studentName || "Unknown",
    count: row.count,
  }));

  const instituteLeaderboard = await col
    .aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$instituteId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])
    .toArray();

  return {
    total,
    verificationStats,
    categoryDistribution,
    growthTrend,
    topPerformers: topStudents,
    instituteLeaderboard: instituteLeaderboard.map((row) => ({
      instituteId: row._id || "unknown",
      count: row.count,
    })),
  };
}
