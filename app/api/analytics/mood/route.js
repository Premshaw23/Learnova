import { NextResponse } from "next/server";
import { connectDbForSSE } from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/error-handler";

export async function POST(req) {
  try {
    const db = await connectDbForSSE();
    const moodLogs = db.collection("MoodLogs");

    const body = await req.json();
    const { dominantExpression, focusScore } = body;

    // Anonymous logging
    await moodLogs.insertOne({
      dominantExpression,
      focusScore,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to log mood:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await authenticateRequest(req); // Only authenticated teachers can view analytics
    const db = await connectDbForSSE();
    const moodLogs = db.collection("MoodLogs");

    // Fetch analytics for the last 60 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: "$dominantExpression",
          count: { $sum: 1 },
          avgFocus: { $avg: "$focusScore" }
        }
      }
    ];

    const results = await moodLogs.aggregate(pipeline).toArray();

    let totalLogs = 0;
    let totalFocusScore = 0;
    const moodCounts = {};

    results.forEach(r => {
      totalLogs += r.count;
      totalFocusScore += (r.avgFocus * r.count);
      moodCounts[r._id] = r.count;
    });

    const averageFocus = totalLogs > 0 ? (totalFocusScore / totalLogs) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalLogs,
        averageFocus: Math.round(averageFocus),
        moodCounts,
        recentActive: totalLogs > 0
      }
    });
  } catch (err) {
    console.error("Failed to get mood analytics:", err);
    return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
