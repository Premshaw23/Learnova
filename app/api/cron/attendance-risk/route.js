import { jsonError, jsonSuccess } from "@/lib/api-response";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { connectDb } from "@/lib/mongodb";

/**
 * GET /api/cron/attendance-risk
 *
 * Nightly Vercel Cron job (configured in vercel.json) that:
 *  1. Reads all attendance records from the last 28 days
 *  2. Computes risk scores per student per institute
 *  3. Upserts results into the `attendance_risk_scores` collection
 *  4. Triggers EmailJS alert for students who crossed the 80% threshold
 *
 * Secured with CRON_SECRET env variable so only Vercel can call it.
 */
export const GET = async (request) => {
  // Verify this is called by Vercel Cron (or an authorised internal caller)
  const cronAuth = authorizeCronRequest(request);
  if (!cronAuth.authorized) {
    return cronAuth.response;
  }

  try {
    const db = await connectDb();

    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    // Discover distinct institutes with attendance data for tenant-scoped processing
    const distinctInstitutes = await db
      .collection("attendance")
      .distinct("instituteId", {
        date: { $gte: fourWeeksAgo.toISOString().slice(0, 10) },
      });

    let processed = 0;
    let alertsSent = 0;
    const errors = [];

    const basePipeline = (instituteId) => [
      {
        $match: {
          date: { $gte: fourWeeksAgo.toISOString().slice(0, 10) },
          ...(instituteId ? { instituteId } : {}),
        },
      },
      {
        $group: {
          _id: { userId: "$userId", instituteId: "$instituteId" },
          studentName: { $last: "$studentName" },
          email: { $last: "$email" },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
            },
          },
          recentPresent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$date", twoWeeksAgo.toISOString().slice(0, 10)] },
                    { $in: ["$status", ["present", "late"]] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          recentTotal: {
            $sum: {
              $cond: [
                { $gte: ["$date", twoWeeksAgo.toISOString().slice(0, 10)] },
                1,
                0,
              ],
            },
          },
          priorPresent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$date", twoWeeksAgo.toISOString().slice(0, 10)] },
                    {
                      $gte: ["$date", fourWeeksAgo.toISOString().slice(0, 10)],
                    },
                    { $in: ["$status", ["present", "late"]] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          priorTotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$date", twoWeeksAgo.toISOString().slice(0, 10)] },
                    {
                      $gte: ["$date", fourWeeksAgo.toISOString().slice(0, 10)],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    for (const instituteId of distinctInstitutes) {
      const records = await db
        .collection("attendance")
        .aggregate(basePipeline(instituteId))
        .toArray();

      if (records.length === 0) continue;

      // Batch upsert risk scores
      const riskBulkOps = records.map((rec) => {
        const attendanceRate =
          rec.totalDays === 0
            ? 100
            : Math.round((rec.presentDays / rec.totalDays) * 1000) / 10;

        const recentRate =
          rec.recentTotal === 0
            ? 100
            : (rec.recentPresent / rec.recentTotal) * 100;
        const priorRate =
          rec.priorTotal === 0
            ? 100
            : (rec.priorPresent / rec.priorTotal) * 100;
        const diff = recentRate - priorRate;

        const trend =
          diff < -5 ? "declining" : diff > 5 ? "improving" : "stable";

        const riskLevel =
          attendanceRate < 75
            ? "at_risk"
            : attendanceRate < 80
              ? "warning"
              : "good";

        let riskScore = Math.max(0, 100 - attendanceRate);
        if (trend === "declining") riskScore = Math.min(100, riskScore + 10);
        if (trend === "improving") riskScore = Math.max(0, riskScore - 5);

        return {
          updateOne: {
            filter: {
              userId: rec._id.userId,
              instituteId: rec._id.instituteId,
            },
            update: {
              $set: {
                studentName: rec.studentName,
                email: rec.email,
                attendanceRate,
                totalDays: rec.totalDays,
                presentDays: rec.presentDays,
                trend,
                riskLevel,
                riskScore: Math.round(riskScore),
                lastUpdated: now.toISOString(),
              },
            },
            upsert: true,
          },
        };
      });

      await db
        .collection("attendance_risk_scores")
        .bulkWrite(riskBulkOps, { ordered: false });

      // Batch check and insert alerts for students below threshold
      const alertCandidates = records.filter((r) => {
        const rate =
          r.totalDays === 0
            ? 100
            : Math.round((r.presentDays / r.totalDays) * 1000) / 10;
        return rate < 80 && r.email;
      });

      if (alertCandidates.length > 0) {
        const candidateIds = alertCandidates.map((r) => r._id.userId);
        const todayStr = now.toISOString().slice(0, 10);
        const alreadyAlerted = await db
          .collection("attendance_alerts")
          .find({
            userId: { $in: candidateIds },
            alertDate: todayStr,
          })
          .project({ userId: 1 })
          .toArray();
        const alertedSet = new Set(alreadyAlerted.map((a) => a.userId));

        const alertInserts = alertCandidates
          .filter((r) => !alertedSet.has(r._id.userId))
          .map((r) => {
            const rate = Math.round((r.presentDays / r.totalDays) * 1000) / 10;
            return {
              userId: r._id.userId,
              instituteId: r._id.instituteId,
              studentName: r.studentName,
              email: r.email,
              attendanceRate: rate,
              riskLevel: rate < 75 ? "at_risk" : "warning",
              alertDate: todayStr,
              sentAt: now.toISOString(),
              emailStatus: "pending",
            };
          });

        if (alertInserts.length > 0) {
          await db.collection("attendance_alerts").insertMany(alertInserts);
          alertsSent += alertInserts.length;
        }
      }

      processed += records.length;
    }

    return jsonSuccess({
      message: "Nightly attendance risk recalculation complete",
      processed,
      alertsSent,
      errors: errors.length > 0 ? errors : undefined,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    return jsonError(`Cron job failed: ${err.message}`, 500);
  }
};
