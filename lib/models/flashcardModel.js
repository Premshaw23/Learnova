import { ObjectId } from "mongodb";
import { connectDb } from "@/lib/mongodb";

const COLLECTION = "flashcards";

/**
 * Creates a new flashcard document for a user.
 * @param {Object} card
 * @param {string} card.firebaseUid - Owner's Firebase UID
 * @param {string} card.courseId - Optional course id the card belongs to
 * @param {string} card.front - Front text (question)
 * @param {string} card.back - Back text (answer)
 * @param {string[]} [card.tags]
 */
export async function createFlashcard(card) {
  if (!card || !card.firebaseUid || !card.front || !card.back) {
    throw new Error("Missing required fields: firebaseUid, front, back");
  }

  const now = new Date().toISOString();

  const doc = {
    firebaseUid: card.firebaseUid,
    courseId: card.courseId || null,
    front: String(card.front).trim(),
    back: String(card.back).trim(),
    origin: card.origin ? String(card.origin).trim() : null,
    tags: Array.isArray(card.tags) ? card.tags : [],

    // Simple SM-2 / SRS fields (defaults)
    interval: 0, // days until next review
    repetition: 0, // consecutive successful reviews
    easiness: 2.5, // easiness factor
    dueDate: now,
    lastReviewedAt: null,

    createdAt: now,
    updatedAt: now,
  };

  const db = await connectDb();
  const result = await db.collection(COLLECTION).insertOne(doc);

  return { ...doc, _id: result.insertedId };
}

export async function getUserFlashcards(firebaseUid, { courseId, limit = 200, cursor } = {}) {
  if (!firebaseUid) throw new Error("firebaseUid is required");
  const db = await connectDb();
  const query = { firebaseUid };
  if (courseId) query.courseId = courseId;
  if (cursor) {
    query._id = { $gt: typeof cursor === "string" ? new ObjectId(cursor) : cursor };
  }
  const items = await db.collection(COLLECTION)
    .find(query)
    .sort({ dueDate: 1, updatedAt: -1 })
    .limit(limit)
    .toArray();
  return items;
}

export async function updateFlashcard(id, update) {
  if (!id) throw new Error("id is required");
  const db = await connectDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  update.updatedAt = new Date().toISOString();
  await db.collection(COLLECTION).updateOne({ _id }, { $set: update });
  return await db.collection(COLLECTION).findOne({ _id });
}

export default {
  createFlashcard,
  getUserFlashcards,
  updateFlashcard,
};
