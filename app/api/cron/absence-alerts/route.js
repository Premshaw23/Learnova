import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { sendAbsenceAlert } from "@/lib/services/notificationService";

// Note: This endpoint should be secured by a cron secret in production
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDb();

    // 1. Get attendance records for the last 14 days to compute recent streaks
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const pipeline = [
      {
        $match: {
          date: { $gte: fourteenDaysAgo.toISOString().slice(0, 10) },
        },
      },
      {
        $group: {
          _id: "$userId",
          studentName: { $last: "$studentName" },
          email: { $last: "$email" },
          statuses: {
            $push: {
              date: "$date",
              status: "$status",
            },
          },
        },
      },
    ];

    const results = await db
      .collection("attendance")
      .aggregate(pipeline)
      .toArray();

    let alertsSent = 0;

    for (const student of results) {
      // Sort statuses descending by date (most recent first)
      const sorted = student.statuses.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      let consecutiveAbsences = 0;
      for (const record of sorted) {
        if (record.status === "absent") {
          consecutiveAbsences++;
        } else {
          // Break on the first non-absent record
          break;
        }
      }

      // If threshold is met (e.g., >= 3 consecutive absences)
      if (consecutiveAbsences >= 3) {
        const sent = await sendAbsenceAlert(
          {
            userId: student._id,
            studentName: student.studentName,
            email: student.email,
          },
          consecutiveAbsences
        );

        if (sent) alertsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} students. Sent ${alertsSent} alerts.`,
    });
  } catch (error) {
    logger.error(`Error in absence-alerts cron: ${error.message}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
