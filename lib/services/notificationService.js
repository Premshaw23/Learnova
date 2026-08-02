import { connectDb } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { withLock } from "@/lib/lockManager";

/**
 * Sends an automated SMS/Email alert to parents/guardians for consecutive absences.
 *
 * Duplicate-prevention is atomic: we insertOne() into absence_notifications
 * *before* sending, relying on the unique index on userId (see
 * lib/mongodb.js) to fail with E11000 if another invocation already reserved
 * this student's cooldown slot. This closes the check-then-insert race from
 * issue #4048, where two overlapping/retried cron runs could both pass a
 * separate findOne() cooldown check before either had inserted its record.
 * A per-student distributed lock adds a second layer of protection so
 * concurrent invocations don't even attempt the insert simultaneously.
 *
 * @param {Object} student - The student object (needs userId, studentName, email, etc.)
 * @param {number} consecutiveAbsences - The number of consecutive days missed
 */
export async function sendAbsenceAlert(student, consecutiveAbsences) {
  try {
    const db = await connectDb();

    return await withLock(`lock:absence-alert:${student.userId}`, async () => {
      const parentContact =
        student.guardianPhone || student.guardianEmail || student.email;

      try {
        // Atomically reserve the cooldown slot. If another invocation
        // already reserved it within the 7-day TTL window, this throws
        // E11000 and we skip sending.
        await db.collection("absence_notifications").insertOne({
          userId: student.userId,
          studentName: student.studentName,
          consecutiveAbsences,
          contact: parentContact,
          createdAt: new Date(),
          status: "sent",
        });
      } catch (insertError) {
        if (insertError?.code === 11000) {
          logger.info(
            `Notification already sent for ${student.studentName} recently. Skipping.`
          );
          return false;
        }
        throw insertError;
      }

      // Mock API call to Twilio or SendGrid/Resend
      // In a real app, you would fetch the parent/guardian contact from the user profile
      logger.info(
        `[Twilio/SendGrid Mock] Sending Alert to ${parentContact} for student ${student.studentName}. Reason: ${consecutiveAbsences} consecutive absences.`
      );

      return true;
    });
  } catch (error) {
    logger.error(
      `Failed to send absence alert for ${student.userId}: ${error.message}`
    );
    return false;
  }
}
