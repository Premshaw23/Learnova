import { ObjectId } from "mongodb";
import { connectDb } from "@/lib/mongodb";

const COLLECTION = "video_notes";

/**
 * Serializes a note document for JSON responses by converting MongoDB ObjectId to string.
 */
export function serializeNote(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id?.toString?.() || doc._id,
  };
}

/**
 * Creates a new note.
 * @param {Object} note
 * @param {string} note.firebaseUid - Firebase UID of the owner
 * @param {number} note.timestamp - Current playback time in seconds
 * @param {string} note.text - The note description
 * @param {string} note.videoId - The video ID
 * @param {string} [note.courseId] - Optional course ID
 */
export async function createNote(note) {
  if (!note || !note.firebaseUid || note.timestamp === undefined || !note.text || !note.videoId) {
    throw new Error("Missing required fields: firebaseUid, timestamp, text, videoId");
  }

  const now = new Date().toISOString();
  const doc = {
    firebaseUid: note.firebaseUid,
    timestamp: Number(note.timestamp),
    text: String(note.text).trim(),
    videoId: String(note.videoId).trim(),
    courseId: note.courseId ? String(note.courseId).trim() : null,
    createdAt: now,
    updatedAt: now,
  };

  const db = await connectDb();
  const result = await db.collection(COLLECTION).insertOne(doc);

  return serializeNote({ ...doc, _id: result.insertedId });
}

/**
 * Retrieves notes for a user, sorted by video timestamp ascending.
 * @param {string} firebaseUid
 * @param {Object} [filter]
 * @param {string} [filter.courseId]
 * @param {string} [filter.videoId]
 */
export async function getUserNotes(firebaseUid, { courseId, videoId } = {}) {
  if (!firebaseUid) throw new Error("firebaseUid is required");
  const db = await connectDb();
  
  const query = { firebaseUid };
  if (courseId) query.courseId = courseId;
  if (videoId) query.videoId = videoId;

  const items = await db
    .collection(COLLECTION)
    .find(query)
    .sort({ timestamp: 1, createdAt: -1 })
    .toArray();

  return items.map(serializeNote);
}

/**
 * Updates an existing note owned by the user.
 * @param {string} id - The note ObjectId or string
 * @param {string} firebaseUid - Owner's Firebase UID for security
 * @param {Object} updates
 * @param {string} [updates.text]
 * @param {number} [updates.timestamp]
 */
export async function updateNote(id, firebaseUid, updates) {
  if (!id || !firebaseUid) throw new Error("id and firebaseUid are required");
  const db = await connectDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const updateDoc = {
    updatedAt: new Date().toISOString(),
  };
  if (updates.text !== undefined) {
    updateDoc.text = String(updates.text).trim();
  }
  if (updates.timestamp !== undefined) {
    updateDoc.timestamp = Number(updates.timestamp);
  }

  const result = await db.collection(COLLECTION).updateOne(
    { _id, firebaseUid },
    { $set: updateDoc }
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const updatedDoc = await db.collection(COLLECTION).findOne({ _id });
  return serializeNote(updatedDoc);
}

/**
 * Deletes a note owned by the user.
 * @param {string} id
 * @param {string} firebaseUid - Owner's UID for security
 */
export async function deleteNote(id, firebaseUid) {
  if (!id || !firebaseUid) throw new Error("id and firebaseUid are required");
  const db = await connectDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const result = await db.collection(COLLECTION).deleteOne({ _id, firebaseUid });
  return result.deletedCount > 0;
}
