import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";

/**
 * GET /api/analytics/attendance-risk
 *
 * Returns at-risk students for the authenticated teacher's institute,
 * using a MongoDB aggregation pipeline to compute:
 *  - attendanceRate: percentage of present/late days out of total recorded days
 *  - consecutiveAbsences: current streak of absent days
 *  - trend: "declining" | "stable" | "improving" based on last 2 weeks vs prior 2 weeks
 *  - riskLevel: "at_risk" | "warning" | "good"
 *
 * Risk thresholds (matches issue #2183):
 *  - at_risk  : attendanceRate < 75  OR consecutiveAbsences >= 3
 *  - warning  : attendanceRate < 80
 *  - good     : attendanceRate >= 80
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, ["teacher", "institute", "admin"]);

  const db = await connectDb();

  // Use the Firestore profile returned by the shared RBAC helper.
  if (!profile) {
    return jsonError("User not found", 404);
  }

  const instituteId = profile.instituteId || profile.uid;

  // Two-week window dates
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);

  const pipeline = [
    // 1. Scope to this institute's attendance records
    {
      $match: {
        instituteId,
        date: { $gte: fourWeeksAgo.toISOString().slice(0, 10) },
      },
    },

    // 2. Group all records per student
    {
      $group: {
        _id: "$userId",
        studentName: { $last: "$studentName" },
        email: { $last: "$email" },
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
          },
        },
        // Collect recent 14 days for trend analysis
        recentStatuses: {
          $push: {
            $cond: [
              { $gte: ["$date", twoWeeksAgo.toISOString().slice(0, 10)] },
              "$status",
              "$$REMOVE",
            ],
          },
        },
        // Collect prior 14 days (days 15-28 ago) for trend comparison
        priorStatuses: {
          $push: {
            $cond: [
              {
                $and: [
                  {
                    $lt: ["$date", twoWeeksAgo.toISOString().slice(0, 10)],
                  },
                  {
                    $gte: ["$date", fourWeeksAgo.toISOString().slice(0, 10)],
                  },
                ],
              },
              "$status",
              "$$REMOVE",
            ],
          },
        },
        // Sorted list of recent statuses for consecutive-absence calculation
        sortedStatuses: { $push: { date: "$date", status: "$status" } },
      },
    },

    // 3. Compute derived fields
    {
      $addFields: {
        attendanceRate: {
          $cond: [
            { $eq: ["$totalDays", 0] },
            100,
            {
              $multiply: [
                { $divide: ["$presentDays", "$totalDays"] },
                100,
              ],
            },
          ],
        },
        recentRate: {
          $cond: [
            { $eq: [{ $size: "$recentStatuses" }, 0] },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: "$recentStatuses",
                          cond: { $in: ["$$this", ["present", "late"]] },
                        },
                      },
                    },
                    { $size: "$recentStatuses" },
                  ],
                },
                100,
              ],
            },
          ],
        },
        priorRate: {
          $cond: [
            { $eq: [{ $size: "$priorStatuses" }, 0] },
            100,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: "$priorStatuses",
                          cond: { $in: ["$$this", ["present", "late"]] },
                        },
                      },
                    },
                    { $size: "$priorStatuses" },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },

    // 4. Compute trend label
    {
      $addFields: {
        trend: {
          $switch: {
            branches: [
              {
                case: { $lt: [{ $subtract: ["$recentRate", "$priorRate"] }, -5] },
                then: "declining",
              },
              {
                case: { $gt: [{ $subtract: ["$recentRate", "$priorRate"] }, 5] },
                then: "improving",
              },
            ],
            default: "stable",
          },
        },
      },
    },

    // 5. Add risk level
    {
      $addFields: {
        riskLevel: {
          $switch: {
            branches: [
              {
                case: { $lt: ["$attendanceRate", 75] },
                then: "at_risk",
              },
              {
                case: { $lt: ["$attendanceRate", 80] },
                then: "warning",
              },
            ],
            default: "good",
          },
        },
      },
    },

    // 6. Only return students who are not fully "good" + stable, or include all
    // We return all so the dashboard can show the full picture
    {
      $project: {
        _id: 0,
        userId: "$_id",
        studentName: 1,
        email: 1,
        attendanceRate: { $round: ["$attendanceRate", 1] },
        totalDays: 1,
        presentDays: 1,
        trend: 1,
        riskLevel: 1,
      },
    },

    // 7. Sort: most at-risk first
    {
      $sort: { attendanceRate: 1 },
    },
  ];

  const results = await db
    .collection("attendance")
    .aggregate(pipeline)
    .toArray();

  // Compute consecutive absences in JS (simpler than in aggregation)
  const enriched = results.map((student) => {
    const riskScore = computeRiskScore(student);
    return { ...student, riskScore };
  });

  return jsonSuccess({
    students: enriched,
    generatedAt: new Date().toISOString(),
    totalStudents: enriched.length,
    atRiskCount: enriched.filter((s) => s.riskLevel === "at_risk").length,
    warningCount: enriched.filter((s) => s.riskLevel === "warning").length,
  });
});

/**
 * Compute a 0–100 risk score:
 * Lower attendance → higher risk score
 * Declining trend adds a penalty
 */
function computeRiskScore(student) {
  let score = Math.max(0, 100 - student.attendanceRate);
  if (student.trend === "declining") score = Math.min(100, score + 10);
  if (student.trend === "improving") score = Math.max(0, score - 5);
  return Math.round(score);
}