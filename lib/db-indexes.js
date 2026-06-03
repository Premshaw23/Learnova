import { connectDb } from "./mongodb";

let indexesEnsured = false;

export async function ensureIndexes() {
  if (indexesEnsured) return;
  indexesEnsured = true;

  const db = await connectDb();

  await Promise.all([
    db.collection("attendance").createIndex({ date: 1, instituteId: 1 }),
    db.collection("users").createIndex({ role: 1 }),
    db.collection("warning_logs").createIndex({ userId: 1, createdAt: 1 }),
    db.collection("notices").createIndex(
      { targetAudience: 1, instituteId: 1, isPinned: -1, createdAt: -1 }
    ),
    db.collection("pomodoro_sessions").createIndex(
      { firebaseUid: 1, completedAt: -1 }
    ),
    db.collection("notifications").createIndex(
      { userId: 1, createdAt: -1 }
    ),
  ]);
}
