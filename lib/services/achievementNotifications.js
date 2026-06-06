import { connectDb } from "@/lib/mongodb";
import { getLinkedParentIds } from "@/lib/services/achievementAccess";

async function insertNotification(userId, message, type = "achievement") {
  const db = await connectDb();
  await db.collection("notifications").insertOne({
    userId,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function notifyStudentAchievement(
  studentId,
  message,
  { notifyParents = false } = {}
) {
  await insertNotification(studentId, message);

  if (notifyParents) {
    try {
      const parentIds = await getLinkedParentIds(studentId);
      await Promise.all(
        parentIds.map((parentId) => insertNotification(parentId, message))
      );
    } catch (err) {
      console.error("Failed to notify linked parents:", err);
    }
  }
}

export async function notifyAchievementCreated(studentId, title, issuerName) {
  await notifyStudentAchievement(
    studentId,
    `New achievement "${title}" has been added by ${issuerName}. Pending verification.`,
    { notifyParents: false }
  );
}

export async function notifyAchievementVerified(studentId, title) {
  await notifyStudentAchievement(
    studentId,
    `Your certificate for "${title}" has been verified.`,
    { notifyParents: true }
  );
}

export async function notifyAchievementRejected(studentId, title, remarks) {
  const remarkText = remarks ? ` Remarks: ${remarks}` : "";
  await notifyStudentAchievement(
    studentId,
    `Your certificate for "${title}" was rejected.${remarkText}`,
    { notifyParents: false }
  );
}
