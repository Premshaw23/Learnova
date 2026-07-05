import { connectDb } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

/**
 * Sends an automated SMS/Email alert to parents/guardians for consecutive absences.
 * @param {Object} student - The student object (needs userId, studentName, email, etc.)
 * @param {number} consecutiveAbsences - The number of consecutive days missed
 */
export async function sendAbsenceAlert(student, consecutiveAbsences) {
  try {
    const db = await connectDb();

    // Check if we already notified for this student recently (cooldown of 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNotification = await db
      .collection("absence_notifications")
      .findOne({
        userId: student.userId,
        createdAt: { $gte: sevenDaysAgo },
      });

    if (recentNotification) {
      logger.info(
        `Notification already sent for ${student.studentName} recently. Skipping.`
      );
      return false;
    }

    // Mock API call to Twilio or SendGrid/Resend
    // In a real app, you would fetch the parent/guardian contact from the user profile
    const parentContact =
      student.guardianPhone || student.guardianEmail || student.email;

    logger.info(
      `[Twilio/SendGrid Mock] Sending Alert to ${parentContact} for student ${student.studentName}. Reason: ${consecutiveAbsences} consecutive absences.`
    );

    // Record the notification to prevent spamming
    await db.collection("absence_notifications").insertOne({
      userId: student.userId,
      studentName: student.studentName,
      consecutiveAbsences,
      contact: parentContact,
      createdAt: new Date(),
      status: "sent",
    });

    return true;
  } catch (error) {
    logger.error(
      `Failed to send absence alert for ${student.userId}: ${error.message}`
    );
    return false;
  }
}
